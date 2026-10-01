# 🏛️ Apex Bank — Production-Ready Banking Management System

A full-stack, enterprise-grade **Banking Management System** built with **Python & Django**, **Django ORM**, **Bootstrap 5**, **Chart.js**, and support for **PDF & Excel exports**.

Designed with clean service architecture, atomic transactions (`select_for_update()`), exact `Decimal` monetary precision, and modular database adapters (switch seamlessly from SQLite to MySQL with zero code changes).

---

## 📑 Table of Contents
1. [Architecture & Features](#architecture--features)
2. [17 Core Modules](#17-core-modules)
3. [Quick Start (VS Code & Command Line)](#quick-start)
4. [Database Configuration (SQLite vs MySQL)](#database-configuration)
5. [Demo User Credentials](#demo-user-credentials)
6. [Security & Financial Integrity](#security--financial-integrity)
7. [Running Automated Tests](#running-automated-tests)

---

## 🏛️ Architecture & Features

```
django_banking/
├── banking_system/         # Root settings, URLs, WSGI/ASGI
├── apps/
│   ├── core/               # Dashboard metrics, AuditLog, Notifications, Middleware
│   ├── accounts/           # Custom User (Admin, Staff, Customer), KYC, Branches
│   ├── banking/            # Accounts (Savings, Current), Deposits, Withdrawals, Transfers
│   ├── loans/              # Loan Origination, EMI Calculator, Approval, Repayment
│   ├── deposits/           # Fixed Deposits, Recurring Deposits, Compounding
│   └── reports/            # Excel (.xlsx) and PDF statement export services
├── management/commands/    # Data seed command (`seed_banking_data`)
├── tests/                  # Unit & integration tests for RBAC, transactions, loans
├── templates/              # Bootstrap 5 responsive templates
├── .vscode/                # VS Code launch & task configurations (1-click F5)
├── requirements.txt        # Python package dependencies
├── .env.example            # Environment template for SQLite / MySQL
└── run_banking.sh          # One-click start script
```

---

## 🚀 17 Core Modules

1. **Authentication & Authorization**: Role-based access control (Admin, Staff, Customer) with secure password hashing.
2. **Role-Based Dashboards**: Custom view for each role:
   - *Admin*: Global cash flow, total deposits, active loans, transaction volume charts.
   - *Staff*: Customer onboarding, pending loan queue, branch counter operations.
   - *Customer*: Account balances, fast transfers, recent passbook history.
3. **Customer Management**: Full CRUD, KYC status verification, national ID tracking, search, branch filter, and pagination.
4. **Account Management**: Auto-generation of 12-digit account numbers, Savings, Current/Checking, Fixed Deposit, Recurring Deposit accounts.
5. **Deposit Operations**: Instant counter deposits with atomic balance credits and audit logs.
6. **Withdrawal Operations**: Counter withdrawals with minimum balance constraint checks (`$100` min for Savings, `$500` for Current).
7. **Fund Transfers**: Intra-bank and inter-bank transfers wrapped in `transaction.atomic()` with row-level locks (`select_for_update()`) to prevent race conditions.
8. **Transaction History & Passbook**: Searchable and filterable transaction records with running balance after every operation.
9. **Beneficiary Management**: Save, view, and initiate 1-click transfers to registered beneficiaries.
10. **Loan Management**:
    - Interactive EMI Calculator ($E = P \cdot r \cdot \frac{(1+r)^n}{(1+r)^n - 1}$).
    - Loan application submission.
    - Staff / Admin approval & rejection workflow.
    - Direct atomic disbursement to applicant savings account.
    - Monthly EMI repayment tracking.
11. **Fixed Deposit & Interest Calculation**: Term deposit opening, quarterly compounding calculation, maturity projection, and premature closure settlement.
12. **Recurring Deposit (RD)**: Monthly recurring deposit tracking and interest accumulation.
13. **Bank Branch Management**: Branch directory, IFSC codes, manager assignments, and branch contact points.
14. **Reports & Analytics**: Charts of cash inflow vs outflow, account distributions, and loan portfolios.
15. **Notifications**: In-app alert system for transaction debits/credits, approvals, and security updates.
16. **Audit Logs**: Immutable system trail capturing user, action, IP address, timestamp, and status.
17. **PDF & Excel Exports**:
    - Download transactions as `.xlsx` with custom headers.
    - Download customer directory as `.xlsx`.
    - Print / save official bank statements with account summary.

---

## ⚡ Quick Start

### Option A: 1-Click in Visual Studio Code
1. Open the project folder in **VS Code**.
2. Press <kbd>Ctrl+Shift+P</kbd> (or <kbd>Cmd+Shift+P</kbd> on Mac) and select **Python: Select Interpreter**.
3. Press <kbd>F5</kbd> or go to the **Run and Debug** tab and click **Django: Run Banking Server**.
4. The system will start at `http://127.0.0.1:8000`.

### Option B: Command Line (Linux / macOS / Windows Bash)
```bash
cd django_banking

# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Initialize environment variables
cp .env.example .env

# 4. Run database migrations
python manage.py makemigrations accounts core banking loans deposits reports
python manage.py migrate

# 5. Populate sample demo data
python manage.py seed_banking_data

# 6. Launch development server
python manage.py runserver
```

---

## 🗄️ Database Configuration (SQLite to MySQL)

The system is configured to use **SQLite** by default for immediate zero-config testing. When you are ready to switch to **MySQL**:

1. In `.env`, change:
```ini
DATABASE_ENGINE=mysql
DB_NAME=apex_bank_db
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306
```

2. Create the database in MySQL:
```sql
CREATE DATABASE apex_bank_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Run migrations on MySQL:
```bash
python manage.py migrate
python manage.py seed_banking_data
```

---

## 👤 Demo User Credentials

| Role | Username | Password | Email | Purpose |
|---|---|---|---|---|
| **Administrator** | `admin` | `admin123` | admin@apexbank.com | Full bank oversight, branch setup, audit logs |
| **Staff Officer** | `staff_officer` | `staff123` | staff@apexbank.com | Customer onboarding, deposits, withdrawals, loan approvals |
| **Customer #1** | `john_doe` | `customer123` | john@example.com | Savings ($24,500), Checking ($8,900), active Home Loan |
| **Customer #2** | `emily_chen` | `customer123` | emily@example.com | Savings ($38,250), Biotech Researcher |

---

## 🛡️ Security & Financial Integrity

- **Decimal Precision**: All monetary values are handled exclusively via Python's `decimal.Decimal` to avoid binary floating-point rounding errors.
- **Atomic Operations**: All financial updates use `@transaction.atomic` blocks.
- **Row-Level Locking**: High-concurrency operations use `select_for_update()` to guarantee that accounts cannot be double-spent.
- **Anti-Tampering Audit Logs**: Every state change (deposits, transfers, logins, approvals) generates an immutable record in `AuditLog`.

---

## 🧪 Running Automated Tests

Run the comprehensive test suite verifying RBAC permissions, atomic transfers, and loan EMI logic:

```bash
python manage.py test tests
```
