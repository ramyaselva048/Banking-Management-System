from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

from apps.accounts.models import User, Branch, CustomerProfile, StaffProfile, UserRole, KYCStatus
from apps.banking.models import Account, Transaction, Beneficiary, AccountType, AccountStatus, TransactionType, TransactionStatus
from apps.loans.models import Loan, LoanStatus, LoanType, LoanRepayment
from apps.deposits.models import FixedDeposit, RecurringDeposit, DepositStatus
from apps.core.models import AuditLog, Notification

class Command(BaseCommand):
    help = 'Seeds complete demonstration data for Apex Bank Management System'

    def handle(self, *args, **options):
        self.stdout.write("Starting banking system database seed...")

        with transaction.atomic():
            # 1. Create Branches
            b1, _ = Branch.objects.get_or_create(
                branch_code='APEX-001',
                defaults={
                    'name': 'Apex Downtown Headquarters',
                    'ifsc_code': 'APEX0001001',
                    'address': '100 Wall Street Financial Hub',
                    'city': 'New York',
                    'state': 'NY',
                    'zip_code': '10005',
                    'phone': '+1 (212) 555-0100',
                    'email': 'downtown@apexbank.com',
                    'manager_name': 'Robert Vance',
                    'is_active': True,
                }
            )
            b2, _ = Branch.objects.get_or_create(
                branch_code='APEX-002',
                defaults={
                    'name': 'Apex Silicon Valley Tech Branch',
                    'ifsc_code': 'APEX0002002',
                    'address': '500 University Ave',
                    'city': 'Palo Alto',
                    'state': 'CA',
                    'zip_code': '94301',
                    'phone': '+1 (650) 555-0200',
                    'email': 'siliconvalley@apexbank.com',
                    'manager_name': 'Elena Rostova',
                    'is_active': True,
                }
            )

            # 2. Users: Admin
            admin_user, created = User.objects.get_or_create(
                username='admin',
                defaults={
                    'email': 'admin@apexbank.com',
                    'first_name': 'Alexander',
                    'last_name': 'Hamilton',
                    'role': UserRole.ADMIN,
                    'is_staff': True,
                    'is_superuser': True,
                    'phone_number': '+1 (212) 555-9000',
                }
            )
            if created:
                admin_user.set_password('admin123')
                admin_user.save()

            # Staff User
            staff_user, created = User.objects.get_or_create(
                username='staff_officer',
                defaults={
                    'email': 'staff@apexbank.com',
                    'first_name': 'Sarah',
                    'last_name': 'Jenkins',
                    'role': UserRole.STAFF,
                    'is_staff': True,
                    'phone_number': '+1 (212) 555-8000',
                }
            )
            if created:
                staff_user.set_password('staff123')
                staff_user.save()
                StaffProfile.objects.create(
                    user=staff_user,
                    employee_id='EMP-10492',
                    branch=b1,
                    department='Credit & Operations',
                    designation='Senior Branch Manager'
                )

            # Customer Users
            c1_user, created = User.objects.get_or_create(
                username='john_doe',
                defaults={
                    'email': 'john@example.com',
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'role': UserRole.CUSTOMER,
                    'phone_number': '+1 (212) 555-1234',
                }
            )
            if created:
                c1_user.set_password('customer123')
                c1_user.save()
            c1_profile, _ = CustomerProfile.objects.get_or_create(
                user=c1_user,
                defaults={
                    'customer_id': 'CUST-8801',
                    'branch': b1,
                    'date_of_birth': '1988-06-15',
                    'gender': 'Male',
                    'id_type': 'Passport',
                    'id_number': 'USA-99882211',
                    'address': '742 Evergreen Terrace',
                    'city': 'New York',
                    'state': 'NY',
                    'occupation': 'Software Architect',
                    'annual_income': Decimal('145000.00'),
                    'kyc_status': KYCStatus.VERIFIED,
                }
            )

            c2_user, created = User.objects.get_or_create(
                username='emily_chen',
                defaults={
                    'email': 'emily@example.com',
                    'first_name': 'Emily',
                    'last_name': 'Chen',
                    'role': UserRole.CUSTOMER,
                    'phone_number': '+1 (415) 555-5678',
                }
            )
            if created:
                c2_user.set_password('customer123')
                c2_user.save()
            c2_profile, _ = CustomerProfile.objects.get_or_create(
                user=c2_user,
                defaults={
                    'customer_id': 'CUST-8802',
                    'branch': b2,
                    'date_of_birth': '1992-11-20',
                    'gender': 'Female',
                    'id_type': 'Drivers License',
                    'id_number': 'DL-CA-445566',
                    'address': '120 Market St',
                    'city': 'San Francisco',
                    'state': 'CA',
                    'occupation': 'Biotech Researcher',
                    'annual_income': Decimal('160000.00'),
                    'kyc_status': KYCStatus.VERIFIED,
                }
            )

            # 3. Create Accounts
            acc1, _ = Account.objects.get_or_create(
                account_number='100889900111',
                defaults={
                    'customer': c1_profile,
                    'account_type': AccountType.SAVINGS,
                    'balance': Decimal('24500.00'),
                    'minimum_balance': Decimal('100.00'),
                    'interest_rate': Decimal('4.00'),
                    'status': AccountStatus.ACTIVE,
                }
            )
            acc2, _ = Account.objects.get_or_create(
                account_number='100889900222',
                defaults={
                    'customer': c1_profile,
                    'account_type': AccountType.CURRENT,
                    'balance': Decimal('8900.50'),
                    'minimum_balance': Decimal('500.00'),
                    'interest_rate': Decimal('0.00'),
                    'status': AccountStatus.ACTIVE,
                }
            )
            acc3, _ = Account.objects.get_or_create(
                account_number='100889900333',
                defaults={
                    'customer': c2_profile,
                    'account_type': AccountType.SAVINGS,
                    'balance': Decimal('38250.75'),
                    'minimum_balance': Decimal('100.00'),
                    'interest_rate': Decimal('4.00'),
                    'status': AccountStatus.ACTIVE,
                }
            )

            # 4. Sample Transactions
            Transaction.objects.get_or_create(
                reference_id='TXN-INIT-001',
                defaults={
                    'account': acc1,
                    'transaction_type': TransactionType.DEPOSIT,
                    'amount': Decimal('20000.00'),
                    'balance_after': Decimal('20000.00'),
                    'description': 'Account opening cash deposit',
                    'status': TransactionStatus.COMPLETED
                }
            )
            Transaction.objects.get_or_create(
                reference_id='TXN-TRF-002',
                defaults={
                    'account': acc1,
                    'recipient_account': acc3,
                    'transaction_type': TransactionType.TRANSFER_OUT,
                    'amount': Decimal('1500.00'),
                    'balance_after': Decimal('18500.00'),
                    'description': 'Consulting invoice reimbursement to Emily Chen',
                    'status': TransactionStatus.COMPLETED
                }
            )
            Transaction.objects.get_or_create(
                reference_id='TXN-DEP-003',
                defaults={
                    'account': acc1,
                    'transaction_type': TransactionType.DEPOSIT,
                    'amount': Decimal('6000.00'),
                    'balance_after': Decimal('24500.00'),
                    'description': 'Monthly salary electronic transfer',
                    'status': TransactionStatus.COMPLETED
                }
            )

            # 5. Beneficiary
            Beneficiary.objects.get_or_create(
                customer=c1_profile,
                account_number='100889900333',
                defaults={
                    'beneficiary_name': 'Emily Chen',
                    'bank_name': 'Apex National Bank',
                    'ifsc_code': 'APEX0002002',
                    'email': 'emily@example.com',
                    'phone_number': '+1 (415) 555-5678',
                    'is_active': True
                }
            )

            # 6. Sample Loan
            loan1, _ = Loan.objects.get_or_create(
                loan_id='LN-2026-901',
                defaults={
                    'customer': c1_profile,
                    'loan_type': LoanType.HOME,
                    'amount': Decimal('250000.00'),
                    'interest_rate': Decimal('6.75'),
                    'tenure_months': 240,
                    'monthly_emi': Decimal('1897.45'),
                    'total_payable': Decimal('455388.00'),
                    'total_interest': Decimal('205388.00'),
                    'amount_paid': Decimal('1897.45'),
                    'status': LoanStatus.DISBURSED,
                    'purpose': 'First-time home buyer mortgage for condo acquisition',
                    'disbursed_to_account': acc1,
                    'approved_at': timezone.now() - timedelta(days=60),
                    'disbursed_at': timezone.now() - timedelta(days=58),
                }
            )
            LoanRepayment.objects.get_or_create(
                loan=loan1,
                installment_number=1,
                defaults={
                    'amount_paid': Decimal('1897.45'),
                    'principal_component': Decimal('491.20'),
                    'interest_component': Decimal('1406.25'),
                }
            )

            # 7. Fixed Deposit
            FixedDeposit.objects.get_or_create(
                fd_number='FD-778811',
                defaults={
                    'customer': c1_profile,
                    'linked_account': acc1,
                    'principal_amount': Decimal('10000.00'),
                    'interest_rate': Decimal('6.50'),
                    'tenure_months': 12,
                    'maturity_amount': Decimal('10666.02'),
                    'total_interest': Decimal('666.02'),
                    'status': DepositStatus.ACTIVE,
                    'maturity_date': timezone.now().date() + timedelta(days=365)
                }
            )

            # 8. Notifications & Audit Logs
            Notification.objects.get_or_create(
                user=c1_user,
                title='Salary Credit Verified',
                defaults={
                    'message': 'Your deposit of $6,000.00 has been credited to savings account #100889900111.',
                    'is_read': False
                }
            )
            AuditLog.objects.get_or_create(
                action='SYSTEM_SEED',
                defaults={
                    'user': admin_user,
                    'description': 'Database initial seed populated successfully with default accounts and records.',
                    'ip_address': '127.0.0.1',
                    'status': 'SUCCESS'
                }
            )

        self.stdout.write(self.style.SUCCESS("Apex Bank demo data seeded successfully!"))
        self.stdout.write("Credentials:")
        self.stdout.write(" - Admin:    admin / admin123")
        self.stdout.write(" - Staff:    staff_officer / staff123")
        self.stdout.write(" - Customer: john_doe / customer123")
        self.stdout.write(" - Customer: emily_chen / customer123")
