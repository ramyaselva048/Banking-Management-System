from django.test import TestCase
from decimal import Decimal
from django.core.exceptions import ValidationError
from apps.accounts.models import User, CustomerProfile, UserRole
from apps.banking.models import Account, AccountType, AccountStatus, Transaction, TransactionType
from apps.banking.services import BankingService

class BankingTransactionTests(TestCase):
    def setUp(self):
        # Create test users and customer profiles
        self.user1 = User.objects.create_user(username='cust1', password='pw', role=UserRole.CUSTOMER)
        self.profile1 = CustomerProfile.objects.create(user=self.user1)
        self.account1 = BankingService.open_account(
            customer=self.profile1,
            account_type=AccountType.SAVINGS,
            initial_deposit=Decimal('1000.00')
        )

        self.user2 = User.objects.create_user(username='cust2', password='pw', role=UserRole.CUSTOMER)
        self.profile2 = CustomerProfile.objects.create(user=self.user2)
        self.account2 = BankingService.open_account(
            customer=self.profile2,
            account_type=AccountType.SAVINGS,
            initial_deposit=Decimal('500.00')
        )

    def test_deposit_increases_balance_and_creates_transaction(self):
        initial_balance = self.account1.balance
        deposit_amount = Decimal('250.00')

        txn = BankingService.deposit(
            account_id=self.account1.id,
            amount=deposit_amount,
            description="ATM Cash Deposit"
        )

        self.account1.refresh_from_db()
        self.assertEqual(self.account1.balance, initial_balance + deposit_amount)
        self.assertEqual(txn.transaction_type, TransactionType.DEPOSIT)
        self.assertEqual(txn.amount, deposit_amount)

    def test_withdrawal_fails_if_below_minimum_balance(self):
        # Minimum balance for savings is 100.00, current balance is 1000.00
        # Maximum allowed withdrawal is 900.00. 950.00 should fail.
        with self.assertRaises(ValidationError):
            BankingService.withdraw(
                account_id=self.account1.id,
                amount=Decimal('950.00'),
                description="Overdraw attempt"
            )

    def test_atomic_fund_transfer_synchronization(self):
        transfer_amount = Decimal('300.00')
        initial_bal1 = self.account1.balance
        initial_bal2 = self.account2.balance

        txn = BankingService.transfer(
            sender_account_id=self.account1.id,
            recipient_account_id=self.account2.id,
            amount=transfer_amount,
            description="Peer to Peer test transfer"
        )

        self.account1.refresh_from_db()
        self.account2.refresh_from_db()

        self.assertEqual(self.account1.balance, initial_bal1 - transfer_amount)
        self.assertEqual(self.account2.balance, initial_bal2 + transfer_amount)
        self.assertEqual(txn.transaction_type, TransactionType.TRANSFER_OUT)
