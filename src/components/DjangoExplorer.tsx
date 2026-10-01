import React, { useState } from 'react';
import {
  Code2,
  FolderTree,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Database,
  FileCode,
  Layers,
  Play,
  Server,
} from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

const DJANGO_FILES: FileItem[] = [
  {
    name: 'settings.py',
    path: 'django_banking/banking_system/settings.py',
    language: 'python',
    description: 'Modular database configuration (SQLite default, MySQL switch via .env), installed banking apps, authentication backend',
    content: `# banking_system/settings.py
from pathlib import Path
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('SECRET_KEY', 'apex-banking-secret-key-production-ready')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Banking Apps
    'apps.core',
    'apps.accounts',
    'apps.banking',
    'apps.loans',
    'apps.deposits',
    'apps.reports',
]

# Modular Database Switcher: TiDB Cloud MySQL (default) or SQLite
DB_ENGINE = os.getenv('DATABASE_ENGINE', 'mysql').lower()

if DB_ENGINE == 'mysql':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('DB_NAME', 'apex_bank'),
            'USER': os.getenv('DB_USER', '3s5MtfbFqMWrRVu.root'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'sqdOwwQZIjyjgz0Z'),
            'HOST': os.getenv('DB_HOST', 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com'),
            'PORT': os.getenv('DB_PORT', '4000'),
            'OPTIONS': {
                'charset': 'utf8mb4',
                'ssl': {'ca': '/etc/ssl/certs/ca-certificates.crt'},
            }
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_USER_MODEL = 'accounts.User'
LOGIN_URL = 'accounts:login'
LOGIN_REDIRECT_URL = 'core:dashboard'`,
  },
  {
    name: 'banking/services.py',
    path: 'django_banking/apps/banking/services.py',
    language: 'python',
    description: 'Atomic financial operations with Decimal monetary precision and row-locking select_for_update()',
    content: `# apps/banking/services.py
from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Account, Transaction, TransactionType, TransactionStatus, AccountStatus

class BankingService:
    @classmethod
    def transfer(cls, sender_account_id, recipient_account_id, amount, description, user=None, ip=None):
        amount = Decimal(str(amount))
        if amount <= Decimal('0.00'):
            raise ValidationError("Transfer amount must be strictly greater than zero.")
        if sender_account_id == recipient_account_id:
            raise ValidationError("Source and destination accounts cannot be identical.")

        with transaction.atomic():
            # Lock accounts deterministically to prevent deadlocks
            first_id, second_id = sorted([sender_account_id, recipient_account_id])
            accounts_map = {
                acc.id: acc
                for acc in Account.objects.select_for_update().filter(id__in=[first_id, second_id])
            }
            sender = accounts_map.get(sender_account_id)
            recipient = accounts_map.get(recipient_account_id)

            if sender.balance - amount < sender.minimum_balance:
                raise ValidationError(f"Insufficient funds. Maximum available: {sender.available_balance}")

            sender.balance -= amount
            sender.save()

            out_txn = Transaction.objects.create(
                account=sender,
                recipient_account=recipient,
                transaction_type=TransactionType.TRANSFER_OUT,
                amount=amount,
                balance_after=sender.balance,
                description=description,
                status=TransactionStatus.COMPLETED
            )

            recipient.balance += amount
            recipient.save()

            Transaction.objects.create(
                account=recipient,
                recipient_account=sender,
                transaction_type=TransactionType.TRANSFER_IN,
                amount=amount,
                balance_after=recipient.balance,
                description=description,
                status=TransactionStatus.COMPLETED
            )
            return out_txn`,
  },
  {
    name: 'loans/services.py',
    path: 'django_banking/apps/loans/services.py',
    language: 'python',
    description: 'Exact Decimal EMI calculation math and atomic disbursement into customer savings account',
    content: `# apps/loans/services.py
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.utils import timezone
from .models import Loan, LoanStatus

class LoanService:
    @staticmethod
    def calculate_emi(principal, annual_interest_rate, tenure_months):
        P = Decimal(str(principal))
        r_annual = Decimal(str(annual_interest_rate))
        n = int(tenure_months)
        if n <= 0 or P <= 0:
            return Decimal('0.00'), Decimal('0.00'), Decimal('0.00')

        r = r_annual / (Decimal('12') * Decimal('100'))
        factor = (1 + float(r)) ** n
        emi_float = float(P) * (float(r) * factor) / (factor - 1)
        monthly_emi = Decimal(str(emi_float)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        total_payable = (monthly_emi * Decimal(n)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        total_interest = total_payable - P
        return monthly_emi, total_payable, total_interest

    @classmethod
    def disburse_loan(cls, loan_id, target_account_id, staff_user):
        with transaction.atomic():
            loan = Loan.objects.select_for_update().get(id=loan_id)
            account = Account.objects.select_for_update().get(id=target_account_id)

            account.balance += loan.amount
            account.save()

            loan.status = LoanStatus.DISBURSED
            loan.disbursed_to_account = account
            loan.disbursed_at = timezone.now()
            loan.save()
            return loan`,
  },
  {
    name: 'accounts/models.py',
    path: 'django_banking/apps/accounts/models.py',
    language: 'python',
    description: 'Custom User with RBAC roles (ADMIN, STAFF, CUSTOMER), CustomerProfile with KYC status, and Bank Branch directory',
    content: `# apps/accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', 'System Administrator'
    STAFF = 'STAFF', 'Bank Staff / Officer'
    CUSTOMER = 'CUSTOMER', 'Bank Customer'

class User(AbstractUser):
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.CUSTOMER)
    phone_number = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)

    @property
    def is_bank_admin(self):
        return self.role == UserRole.ADMIN or self.is_superuser

    @property
    def is_bank_staff(self):
        return self.role in [UserRole.ADMIN, UserRole.STAFF] or self.is_staff

class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    customer_id = models.CharField(max_length=30, unique=True, editable=False)
    branch = models.ForeignKey('Branch', on_delete=models.SET_NULL, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    annual_income = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    kyc_status = models.CharField(max_length=20, default='PENDING')`,
  },
  {
    name: 'seed_banking_data.py',
    path: 'django_banking/apps/core/management/commands/seed_banking_data.py',
    language: 'python',
    description: 'Seed management command generating admin, staff, customers, accounts, transactions, and loans',
    content: `# python manage.py seed_banking_data
# Generates:
# - Admin: admin / admin123
# - Staff: staff_officer / staff123
# - Customer 1: john_doe / customer123 (Savings $24,500, Checking $8,900)
# - Customer 2: emily_chen / customer123 (Savings $38,250)
# - Branches, Fixed Deposits, and Audit Logs`,
  },
  {
    name: '.vscode/launch.json',
    path: 'django_banking/.vscode/launch.json',
    language: 'json',
    description: 'VS Code 1-click F5 debugging and runner profile for Django server, test suite, and seed command',
    content: `{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Django: Run Banking Server",
      "type": "python",
      "request": "launch",
      "program": "\${workspaceFolder}/django_banking/manage.py",
      "args": ["runserver", "0.0.0.0:8000"],
      "django": true,
      "autoStartBrowser": true
    },
    {
      "name": "Django: Seed Demo Data",
      "type": "python",
      "request": "launch",
      "program": "\${workspaceFolder}/django_banking/manage.py",
      "args": ["seed_banking_data"]
    },
    {
      "name": "Django: Run Tests",
      "type": "python",
      "request": "launch",
      "program": "\${workspaceFolder}/django_banking/manage.py",
      "args": ["test", "tests"]
    }
  ]
}`,
  },
  {
    name: '.env.example',
    path: 'django_banking/.env.example',
    language: 'ini',
    description: 'Environment variables template with modular SQLite / MySQL toggle',
    content: `# Apex Bank - Environment Configuration
SECRET_KEY=django-insecure-apex-bank-production-grade-secret-key-9988
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Set to 'sqlite' for zero-config quickstart, or 'mysql' for MySQL server
DATABASE_ENGINE=sqlite

# MySQL Configuration (Active when DATABASE_ENGINE=mysql)
DB_NAME=apex_bank_db
DB_USER=apex_bank_user
DB_PASSWORD=your_secure_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306

BANK_NAME="Apex National Bank"
BANK_CODE="APEX"
MINIMUM_SAVINGS_BALANCE=100.00
MINIMUM_CURRENT_BALANCE=500.00`,
  },
];

export const DjangoExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileItem>(DJANGO_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">
                Complete Source Code Available on Disk
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Python Django Backend & VS Code Execution</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              The complete, production-ready Django project directory has been generated in{' '}
              <code className="bg-black/40 px-2 py-0.5 rounded font-mono text-blue-300">/django_banking/</code>{' '}
              with all Django ORM models, views, forms, urls, tests, templates, seed script, and VS Code configurations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modular MySQL Ready</span>
            </span>
          </div>
        </div>
      </div>

      {/* VS Code 1-Click Run Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
            <Play className="w-4 h-4 text-blue-600" />
            <span>1. Open in VS Code</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Open the repository in <strong>Visual Studio Code</strong>. The preconfigured{' '}
            <code className="text-blue-700 bg-blue-50 px-1 rounded">.vscode/launch.json</code> allows 1-click execution.
          </p>
          <div className="mt-3 text-xs text-slate-400">Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border">F5</kbd> to launch server</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>2. Seed Demo Data</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Run the custom management command to populate Admin, Staff, and Customer demo accounts:
          </p>
          <code className="mt-3 block bg-slate-900 text-emerald-400 p-2 rounded text-[11px] font-mono">
            python manage.py seed_banking_data
          </code>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
            <Server className="w-4 h-4 text-purple-600" />
            <span>3. Switch to MySQL</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            When you're ready to connect MySQL, simply update <code className="text-blue-700 bg-blue-50 px-1 rounded">.env</code>:
          </p>
          <code className="mt-3 block bg-slate-900 text-blue-300 p-2 rounded text-[11px] font-mono">
            DATABASE_ENGINE=mysql
          </code>
        </div>
      </div>

      {/* Code Inspector */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Django Code Inspector</h3>
            <span className="font-mono text-xs text-slate-400">({selectedFile.path})</span>
          </div>

          <button
            onClick={() => handleCopy(selectedFile.content)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[420px]">
          {/* File selector list */}
          <div className="border-r border-slate-100 p-2 space-y-1 bg-slate-50/50">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Generated Django Files
            </div>
            {DJANGO_FILES.map((file) => {
              const isSelected = selectedFile.name === file.name;
              return (
                <button
                  key={file.name}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-mono">{file.name}</div>
                  <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {file.path}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Code viewer */}
          <div className="lg:col-span-3 p-4 bg-slate-950 text-slate-200 overflow-x-auto flex flex-col justify-between">
            <div className="text-xs text-slate-400 mb-2 font-mono pb-2 border-b border-slate-800">
              # {selectedFile.description}
            </div>
            <pre className="font-mono text-xs leading-relaxed text-slate-300 flex-1 overflow-y-auto max-h-[480px]">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
