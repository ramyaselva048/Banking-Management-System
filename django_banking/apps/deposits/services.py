from decimal import Decimal, ROUND_HALF_UP
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import FixedDeposit, RecurringDeposit, DepositStatus
from apps.banking.models import Account, Transaction, TransactionType, TransactionStatus
from apps.core.models import AuditLog, Notification

class DepositService:
    @staticmethod
    def calculate_fd_maturity(principal, annual_rate, tenure_months, compounds_per_year=4):
        """
        Compound Interest formula: A = P * (1 + r/n)^(n*t)
        Quarterly compounding standard.
        """
        P = Decimal(str(principal))
        r = float(annual_rate) / 100.0
        n = compounds_per_year
        t = float(tenure_months) / 12.0

        amount_float = float(P) * ((1 + (r / n)) ** (n * t))
        maturity_amount = Decimal(str(amount_float)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        total_interest = maturity_amount - P
        return maturity_amount, total_interest

    @classmethod
    def open_fixed_deposit(cls, customer, linked_account_id, principal, tenure_months, annual_rate=Decimal('6.50'), user=None):
        principal = Decimal(str(principal))
        with transaction.atomic():
            account = Account.objects.select_for_update().get(id=linked_account_id)
            if account.customer != customer:
                raise ValidationError("Linked funding account does not belong to customer.")

            if account.balance - principal < account.minimum_balance:
                raise ValidationError(f"Insufficient funds in account #{account.account_number} to fund FD of ${principal:,.2f}.")

            # Deduct principal from source account
            account.balance -= principal
            account.save()

            Transaction.objects.create(
                account=account,
                transaction_type=TransactionType.TRANSFER_OUT,
                amount=principal,
                balance_after=account.balance,
                description=f"Funded Fixed Deposit for {tenure_months} months",
                status=TransactionStatus.COMPLETED
            )

            maturity_amount, total_interest = cls.calculate_fd_maturity(principal, annual_rate, tenure_months)
            maturity_date = timezone.now().date() + timedelta(days=int(tenure_months * 30.4375))

            fd = FixedDeposit.objects.create(
                customer=customer,
                linked_account=account,
                principal_amount=principal,
                interest_rate=annual_rate,
                tenure_months=tenure_months,
                maturity_amount=maturity_amount,
                total_interest=total_interest,
                maturity_date=maturity_date,
                status=DepositStatus.ACTIVE
            )

            AuditLog.log(
                user=user or customer.user,
                action='OPEN_FIXED_DEPOSIT',
                description=f"Opened FD #{fd.fd_number} with principal ${principal:,.2f} at {annual_rate}%."
            )

            Notification.send(
                user=customer.user,
                title="Fixed Deposit Certificate Generated",
                message=f"FD #{fd.fd_number} opened successfully. Maturity Value: ${maturity_amount:,.2f} on {maturity_date}."
            )

            return fd

    @classmethod
    def close_fixed_deposit(cls, fd_id, user=None):
        with transaction.atomic():
            fd = FixedDeposit.objects.select_for_update().get(id=fd_id)
            if fd.status != DepositStatus.ACTIVE:
                raise ValidationError("Only active fixed deposits can be closed.")

            today = timezone.now().date()
            account = Account.objects.select_for_update().get(id=fd.linked_account_id)

            # Check if matured or premature
            if today >= fd.maturity_date:
                payout = fd.maturity_amount
                fd.status = DepositStatus.MATURED
                desc = f"FD #{fd.fd_number} Maturity Payout"
            else:
                # Premature penalty: 1% deduction on principal
                penalty = fd.principal_amount * Decimal('0.01')
                payout = fd.principal_amount - penalty
                fd.status = DepositStatus.CLOSED_PREMATURE
                desc = f"Premature FD #{fd.fd_number} Closure (1% penalty applied)"

            account.balance += payout
            account.save()

            Transaction.objects.create(
                account=account,
                transaction_type=TransactionType.FD_INTEREST,
                amount=payout,
                balance_after=account.balance,
                description=desc,
                status=TransactionStatus.COMPLETED
            )

            fd.save()

            AuditLog.log(
                user=user or fd.customer.user,
                action='CLOSE_FD',
                description=f"Closed FD #{fd.fd_number}, refunded ${payout:,.2f} to account {account.account_number}."
            )

            Notification.send(
                user=fd.customer.user,
                title="Fixed Deposit Settled",
                message=f"FD #{fd.fd_number} settled. Amount of ${payout:,.2f} credited to your account {account.account_number}."
            )

            return fd
