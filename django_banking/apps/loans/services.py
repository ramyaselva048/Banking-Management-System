from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import Loan, LoanStatus, LoanRepayment, LoanType
from apps.banking.models import Account, Transaction, TransactionType, TransactionStatus
from apps.core.models import AuditLog, Notification

class LoanService:
    @staticmethod
    def calculate_emi(principal, annual_interest_rate, tenure_months):
        """
        Calculates monthly EMI using Decimal precision:
        E = P * r * (1+r)^n / ((1+r)^n - 1)
        where r is monthly interest rate: annual_rate / (12 * 100)
        """
        P = Decimal(str(principal))
        annual_rate = Decimal(str(annual_interest_rate))
        n = int(tenure_months)

        if n <= 0 or P <= 0:
            return Decimal('0.00'), Decimal('0.00'), Decimal('0.00')

        if annual_rate == 0:
            monthly_emi = (P / Decimal(n)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            total_payable = P
            total_interest = Decimal('0.00')
            return monthly_emi, total_payable, total_interest

        # Monthly interest rate
        r = annual_rate / (Decimal('12') * Decimal('100'))
        
        # Convert float for power operation, then back to Decimal
        r_float = float(r)
        factor = (1 + r_float) ** n
        emi_float = float(P) * (r_float * factor) / (factor - 1)
        
        monthly_emi = Decimal(str(emi_float)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        total_payable = (monthly_emi * Decimal(n)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        total_interest = total_payable - P

        return monthly_emi, total_payable, total_interest

    @classmethod
    def apply_for_loan(cls, customer, loan_type, amount, tenure_months, interest_rate, purpose):
        amount = Decimal(str(amount))
        interest_rate = Decimal(str(interest_rate))
        emi, total_payable, total_interest = cls.calculate_emi(amount, interest_rate, tenure_months)

        loan = Loan.objects.create(
            customer=customer,
            loan_type=loan_type,
            amount=amount,
            interest_rate=interest_rate,
            tenure_months=tenure_months,
            monthly_emi=emi,
            total_payable=total_payable,
            total_interest=total_interest,
            purpose=purpose,
            status=LoanStatus.PENDING
        )

        AuditLog.log(
            user=customer.user,
            action='APPLY_LOAN',
            description=f"Applied for {loan.get_loan_type_display()} of ${amount:,.2f} (ID: {loan.loan_id})."
        )

        Notification.send(
            user=customer.user,
            title="Loan Application Submitted",
            message=f"Your application #{loan.loan_id} for ${amount:,.2f} is under review."
        )

        return loan

    @classmethod
    def approve_loan(cls, loan_id, staff_user):
        with transaction.atomic():
            loan = Loan.objects.select_for_update().get(id=loan_id)
            if loan.status != LoanStatus.PENDING:
                raise ValidationError("Only pending loans can be approved.")

            loan.status = LoanStatus.APPROVED
            loan.approved_at = timezone.now()
            loan.save()

            AuditLog.log(
                user=staff_user,
                action='APPROVE_LOAN',
                description=f"Approved loan #{loan.loan_id} for ${loan.amount:,.2f}."
            )

            Notification.send(
                user=loan.customer.user,
                title="Loan Approved!",
                message=f"Your loan #{loan.loan_id} has been approved. Awaiting disbursement to your savings account."
            )
            return loan

    @classmethod
    def reject_loan(cls, loan_id, reason, staff_user):
        with transaction.atomic():
            loan = Loan.objects.select_for_update().get(id=loan_id)
            if loan.status != LoanStatus.PENDING:
                raise ValidationError("Only pending loans can be rejected.")

            loan.status = LoanStatus.REJECTED
            loan.rejection_reason = reason
            loan.save()

            AuditLog.log(
                user=staff_user,
                action='REJECT_LOAN',
                description=f"Rejected loan #{loan.loan_id}. Reason: {reason}"
            )

            Notification.send(
                user=loan.customer.user,
                title="Loan Application Update",
                message=f"Your loan application #{loan.loan_id} was declined. Reason: {reason}"
            )
            return loan

    @classmethod
    def disburse_loan(cls, loan_id, target_account_id, staff_user, ip=None):
        with transaction.atomic():
            loan = Loan.objects.select_for_update().get(id=loan_id)
            if loan.status != LoanStatus.APPROVED:
                raise ValidationError("Only approved loans can be disbursed.")

            account = Account.objects.select_for_update().get(id=target_account_id)
            if account.customer != loan.customer:
                raise ValidationError("Target disbursement account must belong to the loan applicant.")

            # Credit loan amount directly into account
            account.balance += loan.amount
            account.save()

            txn = Transaction.objects.create(
                account=account,
                transaction_type=TransactionType.LOAN_DISBURSEMENT,
                amount=loan.amount,
                balance_after=account.balance,
                description=f"Disbursement of {loan.get_loan_type_display()} #{loan.loan_id}",
                status=TransactionStatus.COMPLETED,
                ip_address=ip
            )

            loan.status = LoanStatus.DISBURSED
            loan.disbursed_to_account = account
            loan.disbursed_at = timezone.now()
            loan.save()

            AuditLog.log(
                user=staff_user,
                action='DISBURSE_LOAN',
                description=f"Disbursed loan #{loan.loan_id} (${loan.amount:,.2f}) to account {account.account_number}.",
                ip_address=ip
            )

            Notification.send(
                user=loan.customer.user,
                title="Loan Disbursed!",
                message=f"${loan.amount:,.2f} disbursed to account #{account.account_number}."
            )
            return loan

    @classmethod
    def pay_emi(cls, loan_id, source_account_id, user, ip=None):
        with transaction.atomic():
            loan = Loan.objects.select_for_update().get(id=loan_id)
            if loan.status != LoanStatus.DISBURSED:
                raise ValidationError("Loan is not currently in active repayment status.")

            account = Account.objects.select_for_update().get(id=source_account_id)
            emi_amount = loan.monthly_emi

            # If remaining balance is less than EMI, pay remaining balance
            payable = min(emi_amount, loan.remaining_balance)

            if account.balance - payable < account.minimum_balance:
                raise ValidationError(f"Insufficient account funds. Available: ${account.available_balance:,.2f}, required: ${payable:,.2f}")

            account.balance -= payable
            account.save()

            txn = Transaction.objects.create(
                account=account,
                transaction_type=TransactionType.EMI_PAYMENT,
                amount=payable,
                balance_after=account.balance,
                description=f"EMI Payment for Loan #{loan.loan_id}",
                status=TransactionStatus.COMPLETED,
                ip_address=ip
            )

            next_installment = loan.repayments.count() + 1
            LoanRepayment.objects.create(
                loan=loan,
                installment_number=next_installment,
                amount_paid=payable,
                principal_component=payable * Decimal('0.7'),
                interest_component=payable * Decimal('0.3'),
                transaction=txn
            )

            loan.amount_paid += payable
            if loan.amount_paid >= loan.total_payable:
                loan.status = LoanStatus.CLOSED

            loan.save()

            AuditLog.log(
                user=user,
                action='PAY_LOAN_EMI',
                description=f"Paid EMI of ${payable:,.2f} for loan {loan.loan_id}.",
                ip_address=ip
            )

            Notification.send(
                user=loan.customer.user,
                title="EMI Payment Successful",
                message=f"EMI payment of ${payable:,.2f} received for Loan #{loan.loan_id}. Remaining balance: ${loan.remaining_balance:,.2f}."
            )

            return loan
