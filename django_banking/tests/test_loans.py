from django.test import TestCase
from decimal import Decimal
from apps.accounts.models import User, CustomerProfile, UserRole
from apps.banking.models import Account, AccountType
from apps.banking.services import BankingService
from apps.loans.models import Loan, LoanStatus, LoanType
from apps.loans.services import LoanService

class LoanServiceTests(TestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user(username='bank_staff', password='pw', role=UserRole.STAFF)
        self.cust_user = User.objects.create_user(username='borrower', password='pw', role=UserRole.CUSTOMER)
        self.profile = CustomerProfile.objects.create(user=self.cust_user)
        self.savings_acc = BankingService.open_account(
            customer=self.profile,
            account_type=AccountType.SAVINGS,
            initial_deposit=Decimal('2000.00')
        )

    def test_emi_calculation_formula(self):
        # Principal: 10,000, 12% per year (1% per month), 12 months
        # Monthly EMI formula yields approx 888.49
        principal = Decimal('10000.00')
        rate = Decimal('12.00')
        tenure = 12

        emi, total_payable, total_interest = LoanService.calculate_emi(principal, rate, tenure)
        self.assertTrue(Decimal('880.00') < emi < Decimal('895.00'))
        self.assertEqual(total_payable, emi * 12)
        self.assertEqual(total_interest, total_payable - principal)

    def test_loan_approval_and_disbursement_lifecycle(self):
        loan = LoanService.apply_for_loan(
            customer=self.profile,
            loan_type=LoanType.PERSONAL,
            amount=Decimal('5000.00'),
            tenure_months=24,
            interest_rate=Decimal('10.00'),
            purpose="Home renovation test"
        )
        self.assertEqual(loan.status, LoanStatus.PENDING)

        # Staff approves loan
        LoanService.approve_loan(loan.id, self.staff_user)
        loan.refresh_from_db()
        self.assertEqual(loan.status, LoanStatus.APPROVED)

        # Disburse loan into customer savings account
        initial_balance = self.savings_acc.balance
        LoanService.disburse_loan(loan.id, self.savings_acc.id, self.staff_user)

        loan.refresh_from_db()
        self.savings_acc.refresh_from_db()
        self.assertEqual(loan.status, LoanStatus.DISBURSED)
        self.assertEqual(self.savings_acc.balance, initial_balance + Decimal('5000.00'))
