import random
from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Account, Transaction, TransactionType, TransactionStatus, AccountStatus, AccountType
from apps.core.models import AuditLog, Notification

class BankingService:
    """Core banking operations with atomic transactions and strict balance locking."""

    @staticmethod
    def generate_account_number():
        """Generates a unique 12-digit standard bank account number."""
        while True:
            number = f"100{random.randint(100000000, 999999999)}"
            if not Account.objects.filter(account_number=number).exists():
                return number

    @classmethod
    def open_account(cls, customer, account_type, initial_deposit=Decimal('0.00'), interest_rate=None, user=None, ip=None):
        initial_deposit = Decimal(str(initial_deposit))
        min_balance = Decimal('100.00') if account_type == AccountType.SAVINGS else Decimal('500.00')
        if account_type in [AccountType.FIXED_DEPOSIT, AccountType.RECURRING_DEPOSIT]:
            min_balance = Decimal('0.00')

        if initial_deposit < min_balance and account_type in [AccountType.SAVINGS, AccountType.CURRENT]:
            raise ValidationError(f"Initial deposit must be at least minimum balance of ${min_balance:,.2f}")

        rate = interest_rate
        if rate is None:
            rate = Decimal('4.00') if account_type == AccountType.SAVINGS else Decimal('0.00')

        with transaction.atomic():
            account = Account.objects.create(
                account_number=cls.generate_account_number(),
                customer=customer,
                account_type=account_type,
                balance=initial_deposit,
                minimum_balance=min_balance,
                interest_rate=rate,
                status=AccountStatus.ACTIVE
            )

            if initial_deposit > 0:
                Transaction.objects.create(
                    account=account,
                    transaction_type=TransactionType.DEPOSIT,
                    amount=initial_deposit,
                    balance_after=account.balance,
                    description="Initial opening account deposit",
                    status=TransactionStatus.COMPLETED,
                    ip_address=ip
                )

            AuditLog.log(
                user=user or customer.user,
                action='OPEN_ACCOUNT',
                description=f"Opened {account.get_account_type_display()} {account.account_number} for {customer.user.get_full_name()}.",
                ip_address=ip
            )

            Notification.send(
                user=customer.user,
                title="New Account Activated",
                message=f"Your {account.get_account_type_display()} #{account.account_number} has been opened with initial balance of ${initial_deposit:,.2f}."
            )

            return account

    @classmethod
    def deposit(cls, account_id, amount, description, user=None, ip=None):
        amount = Decimal(str(amount))
        if amount <= Decimal('0.00'):
            raise ValidationError("Deposit amount must be greater than zero.")

        with transaction.atomic():
            account = Account.objects.select_for_update().get(id=account_id)
            if account.status != AccountStatus.ACTIVE:
                raise ValidationError(f"Account is currently {account.status}. Deposits cannot be processed.")

            account.balance += amount
            account.save()

            txn = Transaction.objects.create(
                account=account,
                transaction_type=TransactionType.DEPOSIT,
                amount=amount,
                balance_after=account.balance,
                description=description or "Cash / Cheque Deposit",
                status=TransactionStatus.COMPLETED,
                ip_address=ip
            )

            AuditLog.log(
                user=user or account.customer.user,
                action='DEPOSIT',
                description=f"Deposited ${amount:,.2f} to account {account.account_number}.",
                ip_address=ip
            )

            Notification.send(
                user=account.customer.user,
                title="Deposit Successful",
                message=f"${amount:,.2f} credited to {account.account_number}. Current balance: ${account.balance:,.2f}."
            )

            return txn

    @classmethod
    def withdraw(cls, account_id, amount, description, user=None, ip=None):
        amount = Decimal(str(amount))
        if amount <= Decimal('0.00'):
            raise ValidationError("Withdrawal amount must be greater than zero.")

        with transaction.atomic():
            account = Account.objects.select_for_update().get(id=account_id)
            if account.status != AccountStatus.ACTIVE:
                raise ValidationError(f"Account is currently {account.status}. Withdrawals cannot be processed.")

            if account.balance - amount < account.minimum_balance:
                raise ValidationError(
                    f"Insufficient funds. Maximum available withdrawal is ${account.available_balance:,.2f} "
                    f"(maintaining minimum balance of ${account.minimum_balance:,.2f})."
                )

            account.balance -= amount
            account.save()

            txn = Transaction.objects.create(
                account=account,
                transaction_type=TransactionType.WITHDRAWAL,
                amount=amount,
                balance_after=account.balance,
                description=description or "Cash Withdrawal",
                status=TransactionStatus.COMPLETED,
                ip_address=ip
            )

            AuditLog.log(
                user=user or account.customer.user,
                action='WITHDRAWAL',
                description=f"Withdrew ${amount:,.2f} from account {account.account_number}.",
                ip_address=ip
            )

            Notification.send(
                user=account.customer.user,
                title="Withdrawal Alert",
                message=f"${amount:,.2f} debited from {account.account_number}. Remaining balance: ${account.balance:,.2f}."
            )

            return txn

    @classmethod
    def transfer(cls, sender_account_id, recipient_account_id, amount, description, user=None, ip=None):
        amount = Decimal(str(amount))
        if amount <= Decimal('0.00'):
            raise ValidationError("Transfer amount must be strictly greater than zero.")

        if sender_account_id == recipient_account_id:
            raise ValidationError("Source and destination accounts cannot be identical.")

        with transaction.atomic():
            # Lock both accounts in a deterministic order to prevent deadlocks
            first_id, second_id = sorted([sender_account_id, recipient_account_id])
            accounts_map = {
                acc.id: acc
                for acc in Account.objects.select_for_update().filter(id__in=[first_id, second_id])
            }

            sender = accounts_map.get(sender_account_id)
            recipient = accounts_map.get(recipient_account_id)

            if not sender or not recipient:
                raise ValidationError("Specified sender or recipient account does not exist.")

            if sender.status != AccountStatus.ACTIVE:
                raise ValidationError(f"Sender account is {sender.status}.")
            if recipient.status != AccountStatus.ACTIVE:
                raise ValidationError(f"Recipient account is {recipient.status}.")

            if sender.balance - amount < sender.minimum_balance:
                raise ValidationError(
                    f"Insufficient funds. Available transfer balance: ${sender.available_balance:,.2f}."
                )

            # Deduct from sender
            sender.balance -= amount
            sender.save()

            out_txn = Transaction.objects.create(
                account=sender,
                recipient_account=recipient,
                transaction_type=TransactionType.TRANSFER_OUT,
                amount=amount,
                balance_after=sender.balance,
                description=f"Transfer to {recipient.customer.user.get_full_name()} ({recipient.account_number}): {description}",
                status=TransactionStatus.COMPLETED,
                ip_address=ip
            )

            # Credit recipient
            recipient.balance += amount
            recipient.save()

            Transaction.objects.create(
                account=recipient,
                recipient_account=sender,
                transaction_type=TransactionType.TRANSFER_IN,
                amount=amount,
                balance_after=recipient.balance,
                description=f"Transfer from {sender.customer.user.get_full_name()} ({sender.account_number}): {description}",
                status=TransactionStatus.COMPLETED,
                ip_address=ip
            )

            AuditLog.log(
                user=user or sender.customer.user,
                action='TRANSFER',
                description=f"Transferred ${amount:,.2f} from {sender.account_number} to {recipient.account_number}.",
                ip_address=ip
            )

            Notification.send(
                user=sender.customer.user,
                title="Transfer Sent",
                message=f"Transferred ${amount:,.2f} to {recipient.account_number}. Reference: {out_txn.reference_id}."
            )

            Notification.send(
                user=recipient.customer.user,
                title="Transfer Received",
                message=f"Received ${amount:,.2f} from {sender.customer.user.get_full_name()} into {recipient.account_number}."
            )

            return out_txn
