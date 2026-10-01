import {
  User,
  Customer,
  BankAccount,
  Transaction,
  Loan,
  FixedDeposit,
  Beneficiary,
  Branch,
  AuditLog,
  NotificationItem,
  UserRole,
  StaffMember,
} from '../types/banking';
import {
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTIONS,
  INITIAL_LOANS,
  INITIAL_FIXED_DEPOSITS,
  INITIAL_BENEFICIARIES,
  INITIAL_BRANCHES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_STAFF,
} from '../data/initialData';
import { roundMoney, generateId, generateAccountNumber } from '../utils/finance';

const STORAGE_KEYS = {
  CURRENT_USER: 'apex_bank_current_user',
  USERS: 'apex_bank_users',
  CUSTOMERS: 'apex_bank_customers',
  STAFF: 'apex_bank_staff',
  ACCOUNTS: 'apex_bank_accounts',
  TRANSACTIONS: 'apex_bank_transactions',
  LOANS: 'apex_bank_loans',
  FDS: 'apex_bank_fds',
  BENEFICIARIES: 'apex_bank_beneficiaries',
  BRANCHES: 'apex_bank_branches',
  LOGS: 'apex_bank_audit_logs',
  NOTIFICATIONS: 'apex_bank_notifications',
};

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write failed:', e);
  }
}

export class BankingStorage {
  // Current user / session
  static getCurrentUser(): User {
    return getStored<User>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  }

  static setCurrentUser(user: User): void {
    setStored(STORAGE_KEYS.CURRENT_USER, user);
  }

  // Users
  static getUsers(): User[] {
    const users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    let modified = false;
    users.forEach((u) => {
      if (!u.password) {
        if (u.role === 'ADMIN') u.password = 'admin123';
        else if (u.role === 'STAFF') u.password = 'Staff@2026';
        else u.password = 'customer123';
        modified = true;
      }
    });
    if (modified) {
      setStored(STORAGE_KEYS.USERS, users);
    }
    return users;
  }

  static updateUser(updatedUser: User): User {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === updatedUser.id);
    if (index >= 0) {
      users[index] = { ...users[index], ...updatedUser };
    } else {
      users.push(updatedUser);
    }
    setStored(STORAGE_KEYS.USERS, users);

    // If current logged-in user, also sync in storage
    const current = this.getCurrentUser();
    if (current && current.id === updatedUser.id) {
      setStored(STORAGE_KEYS.CURRENT_USER, { ...current, ...updatedUser });
    }

    // Sync with staff list if this user is a staff member
    if (updatedUser.role === 'STAFF') {
      const staffList = this.getStaff();
      const staffIdx = staffList.findIndex(
        (s) => s.userId === updatedUser.id || s.email === updatedUser.email
      );
      if (staffIdx >= 0) {
        staffList[staffIdx].email = updatedUser.email;
        staffList[staffIdx].fullName = `${updatedUser.firstName} ${updatedUser.lastName}`.trim();
        if (updatedUser.phone) staffList[staffIdx].phone = updatedUser.phone;
        if (updatedUser.password) staffList[staffIdx].password = updatedUser.password;
        setStored(STORAGE_KEYS.STAFF, staffList);
      }
    }

    // Sync with customer list if this user is a customer
    if (updatedUser.role === 'CUSTOMER') {
      const customers = this.getCustomers();
      const custIdx = customers.findIndex(
        (c) => c.userId === updatedUser.id || c.email === updatedUser.email
      );
      if (custIdx >= 0) {
        customers[custIdx].email = updatedUser.email;
        customers[custIdx].fullName = `${updatedUser.firstName} ${updatedUser.lastName}`.trim();
        if (updatedUser.phone) customers[custIdx].phone = updatedUser.phone;
        setStored(STORAGE_KEYS.CUSTOMERS, customers);
      }
    }

    this.addAuditLog(
      'UPDATE_USER',
      `User ${updatedUser.username} (${updatedUser.email}) updated profile credentials.`
    );
    return updatedUser;
  }

  static addUser(newUser: User): User {
    const users = this.getUsers();
    const existingIndex = users.findIndex((u) => u.email === newUser.email || u.id === newUser.id);
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...newUser };
    } else {
      users.push(newUser);
    }
    setStored(STORAGE_KEYS.USERS, users);
    this.addAuditLog('REGISTER_USER', `User ${newUser.username} (${newUser.email}) registered.`);
    return newUser;
  }

  // Branches
  static getBranches(): Branch[] {
    return getStored<Branch[]>(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
  }

  static addBranch(branch: Omit<Branch, 'id'>): Branch {
    const branches = this.getBranches();
    const newBranch: Branch = {
      ...branch,
      id: generateId('br'),
    };
    branches.push(newBranch);
    setStored(STORAGE_KEYS.BRANCHES, branches);
    this.addAuditLog('CREATE_BRANCH', `Created new branch ${newBranch.name} (${newBranch.branchCode}).`);
    return newBranch;
  }

  // Staff Management (Admin Only)
  static getStaff(): StaffMember[] {
    return getStored<StaffMember[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
  }

  static addStaff(
    staffData: Omit<StaffMember, 'id' | 'employeeId' | 'joinedAt'>,
    initialPassword?: string
  ): StaffMember {
    const staffList = this.getStaff();
    const newStaff: StaffMember = {
      ...staffData,
      id: generateId('staff'),
      employeeId: `EMP-${Math.floor(10500 + Math.random() * 4999)}`,
      joinedAt: new Date().toISOString().split('T')[0],
      password: initialPassword || 'Staff@123',
    };
    staffList.unshift(newStaff);
    setStored(STORAGE_KEYS.STAFF, staffList);

    // Also register user account for login if not exists or update password
    const users = this.getUsers();
    const username = staffData.email.split('@')[0] || staffData.fullName.toLowerCase().replace(/\s+/g, '_');
    const existingIndex = users.findIndex((u) => u.email === staffData.email);
    if (existingIndex >= 0) {
      users[existingIndex].password = initialPassword || 'Staff@123';
      users[existingIndex].role = 'STAFF';
    } else {
      users.push({
        id: newStaff.userId || `user-${Date.now()}`,
        username,
        email: staffData.email,
        firstName: staffData.fullName.split(' ')[0],
        lastName: staffData.fullName.split(' ').slice(1).join(' ') || 'Officer',
        role: 'STAFF',
        phone: staffData.phone,
        isVerified: true,
        password: initialPassword || 'Staff@123',
      });
    }
    setStored(STORAGE_KEYS.USERS, users);

    this.addAuditLog(
      'ALLOCATE_STAFF',
      `Admin allocated staff member ${newStaff.fullName} (${newStaff.employeeId}) to branch ${newStaff.branchName} with credentials initialized.`
    );
    return newStaff;
  }

  static updateStaff(id: string, updates: Partial<StaffMember>, newPassword?: string): StaffMember {
    const staffList = this.getStaff();
    const index = staffList.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Staff member not found');
    staffList[index] = { ...staffList[index], ...updates };
    if (newPassword) {
      staffList[index].password = newPassword;
    }
    setStored(STORAGE_KEYS.STAFF, staffList);

    const users = this.getUsers();
    const user = users.find(
      (u) => u.email === staffList[index].email || u.id === staffList[index].userId
    );
    if (user) {
      if (newPassword) user.password = newPassword;
      if (updates.email) user.email = updates.email;
      if (updates.fullName) {
        user.firstName = updates.fullName.split(' ')[0];
        user.lastName = updates.fullName.split(' ').slice(1).join(' ') || 'Officer';
      }
      setStored(STORAGE_KEYS.USERS, users);
    }

    this.addAuditLog('UPDATE_STAFF', `Admin updated designation/details for staff ${staffList[index].fullName}.`);
    return staffList[index];
  }

  static transferStaff(staffId: string, newBranchId: string): StaffMember {
    const staffList = this.getStaff();
    const staff = staffList.find((s) => s.id === staffId);
    if (!staff) throw new Error('Staff member not found');

    const branches = this.getBranches();
    const targetBranch = branches.find((b) => b.id === newBranchId);
    if (!targetBranch) throw new Error('Target branch not found');

    const oldBranchName = staff.branchName;
    staff.branchId = targetBranch.id;
    staff.branchName = targetBranch.name;
    setStored(STORAGE_KEYS.STAFF, staffList);

    this.addAuditLog('TRANSFER_STAFF', `Admin transferred ${staff.fullName} from ${oldBranchName} to ${targetBranch.name}.`);
    return staff;
  }

  static deleteStaff(id: string): void {
    const staffList = this.getStaff().filter((s) => s.id !== id);
    setStored(STORAGE_KEYS.STAFF, staffList);
    this.addAuditLog('OFFBOARD_STAFF', `Admin offboarded staff record ID ${id}.`);
  }

  // Customers
  static getCustomers(): Customer[] {
    return getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  static addCustomer(customerData: Omit<Customer, 'id' | 'customerId' | 'createdAt'>): Customer {
    const customers = this.getCustomers();
    const newCustomer: Customer = {
      ...customerData,
      id: generateId('cust'),
      customerId: `CUST-${Math.floor(8000 + Math.random() * 1999)}`,
      createdAt: new Date().toISOString(),
    };
    customers.unshift(newCustomer);
    setStored(STORAGE_KEYS.CUSTOMERS, customers);
    this.addAuditLog('CREATE_CUSTOMER', `Created customer profile ${newCustomer.fullName} (${newCustomer.customerId}).`);
    return newCustomer;
  }

  static updateCustomer(id: string, updates: Partial<Customer>): Customer {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Customer not found');
    customers[index] = { ...customers[index], ...updates };
    setStored(STORAGE_KEYS.CUSTOMERS, customers);
    this.addAuditLog('UPDATE_CUSTOMER', `Updated customer ${customers[index].fullName}.`);
    return customers[index];
  }

  static deleteCustomer(id: string): void {
    const customers = this.getCustomers().filter((c) => c.id !== id);
    setStored(STORAGE_KEYS.CUSTOMERS, customers);
    this.addAuditLog('DELETE_CUSTOMER', `Deleted customer record ID ${id}.`);
  }

  // Accounts
  static getAccounts(): BankAccount[] {
    return getStored<BankAccount[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  }

  static addAccount(
    customerId: string,
    accountType: BankAccount['accountType'],
    initialDeposit: number,
    interestRate: number = 4.0
  ): BankAccount {
    const customers = this.getCustomers();
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    const accounts = this.getAccounts();
    const minBalance = accountType === 'CURRENT' ? 500 : 100;

    if (initialDeposit < minBalance) {
      throw new Error(`Initial deposit must be at least minimum balance of $${minBalance}`);
    }

    const newAccount: BankAccount = {
      id: generateId('acc'),
      accountNumber: generateAccountNumber(),
      customerId: customer.id,
      customerName: customer.fullName,
      accountType,
      currency: 'USD',
      balance: roundMoney(initialDeposit),
      minimumBalance: minBalance,
      interestRate,
      status: 'ACTIVE',
      dailyTransferLimit: 50000,
      createdAt: new Date().toISOString(),
    };

    accounts.unshift(newAccount);
    setStored(STORAGE_KEYS.ACCOUNTS, accounts);

    // Initial Deposit Transaction
    if (initialDeposit > 0) {
      this.recordTransaction({
        accountId: newAccount.id,
        accountNumber: newAccount.accountNumber,
        customerName: newAccount.customerName,
        type: 'DEPOSIT',
        amount: initialDeposit,
        balanceAfter: initialDeposit,
        description: 'Initial account opening deposit',
      });
    }

    this.addAuditLog('OPEN_ACCOUNT', `Opened ${accountType} #${newAccount.accountNumber} for ${customer.fullName}.`);
    this.addNotification(
      customer.userId,
      'New Account Activated',
      `Your ${accountType} #${newAccount.accountNumber} is active with balance $${initialDeposit.toFixed(2)}.`
    );

    return newAccount;
  }

  // Transactions
  static getTransactions(): Transaction[] {
    return getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }

  private static recordTransaction(txnData: Omit<Transaction, 'id' | 'referenceId' | 'status' | 'createdAt'>): Transaction {
    const txns = this.getTransactions();
    const newTxn: Transaction = {
      ...txnData,
      id: generateId('txn'),
      referenceId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };
    txns.unshift(newTxn);
    setStored(STORAGE_KEYS.TRANSACTIONS, txns);
    return newTxn;
  }

  // Deposit
  static deposit(accountId: string, amount: number, description: string): Transaction {
    if (amount <= 0) throw new Error('Deposit amount must be greater than zero');
    const accounts = this.getAccounts();
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) throw new Error('Account not found');
    if (acc.status !== 'ACTIVE') throw new Error(`Account is currently ${acc.status}`);

    acc.balance = roundMoney(acc.balance + amount);
    setStored(STORAGE_KEYS.ACCOUNTS, accounts);

    const txn = this.recordTransaction({
      accountId: acc.id,
      accountNumber: acc.accountNumber,
      customerName: acc.customerName,
      type: 'DEPOSIT',
      amount: roundMoney(amount),
      balanceAfter: acc.balance,
      description: description || 'Counter Cash Deposit',
    });

    this.addAuditLog('DEPOSIT', `Deposited $${amount.toFixed(2)} to account ${acc.accountNumber}.`);
    this.addNotification(
      acc.customerId,
      'Deposit Successful',
      `$${amount.toFixed(2)} credited to account ${acc.accountNumber}. Current balance: $${acc.balance.toFixed(2)}.`
    );

    return txn;
  }

  // Withdrawal
  static withdraw(accountId: string, amount: number, description: string): Transaction {
    if (amount <= 0) throw new Error('Withdrawal amount must be greater than zero');
    const accounts = this.getAccounts();
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) throw new Error('Account not found');
    if (acc.status !== 'ACTIVE') throw new Error(`Account is ${acc.status}`);

    const maxAllowed = roundMoney(acc.balance - acc.minimumBalance);
    if (amount > maxAllowed) {
      throw new Error(`Insufficient funds. Maximum available withdrawal is $${maxAllowed.toFixed(2)} (preserving minimum balance of $${acc.minimumBalance.toFixed(2)}).`);
    }

    acc.balance = roundMoney(acc.balance - amount);
    setStored(STORAGE_KEYS.ACCOUNTS, accounts);

    const txn = this.recordTransaction({
      accountId: acc.id,
      accountNumber: acc.accountNumber,
      customerName: acc.customerName,
      type: 'WITHDRAWAL',
      amount: roundMoney(amount),
      balanceAfter: acc.balance,
      description: description || 'Counter Cash Withdrawal',
    });

    this.addAuditLog('WITHDRAWAL', `Withdrew $${amount.toFixed(2)} from account ${acc.accountNumber}.`);
    this.addNotification(
      acc.customerId,
      'Withdrawal Processed',
      `$${amount.toFixed(2)} debited from account ${acc.accountNumber}. Remaining balance: $${acc.balance.toFixed(2)}.`
    );

    return txn;
  }

  // Transfer
  static transfer(
    sourceAccountId: string,
    destinationAccountNumber: string,
    amount: number,
    description: string
  ): Transaction {
    if (amount <= 0) throw new Error('Transfer amount must be greater than zero');

    const accounts = this.getAccounts();
    const sender = accounts.find((a) => a.id === sourceAccountId);
    if (!sender) throw new Error('Source account not found');
    if (sender.status !== 'ACTIVE') throw new Error('Source account is not active');

    const recipient = accounts.find((a) => a.accountNumber === destinationAccountNumber);
    if (!recipient) throw new Error(`Destination account #${destinationAccountNumber} does not exist`);
    if (recipient.id === sender.id) throw new Error('Source and destination accounts cannot be identical');
    if (recipient.status !== 'ACTIVE') throw new Error('Destination account is not active');

    const maxAllowed = roundMoney(sender.balance - sender.minimumBalance);
    if (amount > maxAllowed) {
      throw new Error(`Insufficient funds. Available transfer balance is $${maxAllowed.toFixed(2)}.`);
    }

    // Atomic update
    sender.balance = roundMoney(sender.balance - amount);
    recipient.balance = roundMoney(recipient.balance + amount);
    setStored(STORAGE_KEYS.ACCOUNTS, accounts);

    // Sender Outflow Transaction
    const outTxn = this.recordTransaction({
      accountId: sender.id,
      accountNumber: sender.accountNumber,
      customerName: sender.customerName,
      recipientAccountId: recipient.id,
      recipientAccountNumber: recipient.accountNumber,
      recipientCustomerName: recipient.customerName,
      type: 'TRANSFER_OUT',
      amount: roundMoney(amount),
      balanceAfter: sender.balance,
      description: `Transfer to ${recipient.customerName} (${recipient.accountNumber}): ${description || 'Peer transfer'}`,
    });

    // Recipient Inflow Transaction
    this.recordTransaction({
      accountId: recipient.id,
      accountNumber: recipient.accountNumber,
      customerName: recipient.customerName,
      recipientAccountId: sender.id,
      recipientAccountNumber: sender.accountNumber,
      recipientCustomerName: sender.customerName,
      type: 'TRANSFER_IN',
      amount: roundMoney(amount),
      balanceAfter: recipient.balance,
      description: `Transfer from ${sender.customerName} (${sender.accountNumber}): ${description || 'Peer transfer'}`,
    });

    this.addAuditLog('TRANSFER', `Transferred $${amount.toFixed(2)} from ${sender.accountNumber} to ${recipient.accountNumber}.`);

    this.addNotification(
      sender.customerId,
      'Transfer Sent',
      `Transferred $${amount.toFixed(2)} to ${recipient.customerName} (${recipient.accountNumber}). Ref: ${outTxn.referenceId}.`
    );

    this.addNotification(
      recipient.customerId,
      'Transfer Received',
      `Received $${amount.toFixed(2)} from ${sender.customerName} into ${recipient.accountNumber}.`
    );

    return outTxn;
  }

  // Loans
  static getLoans(): Loan[] {
    return getStored<Loan[]>(STORAGE_KEYS.LOANS, INITIAL_LOANS);
  }

  static applyLoan(
    customerId: string,
    loanType: Loan['loanType'],
    amount: number,
    tenureMonths: number,
    interestRate: number,
    purpose: string
  ): Loan {
    const customers = this.getCustomers();
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    const loans = this.getLoans();
    const r = interestRate / (12 * 100);
    const factor = Math.pow(1 + r, tenureMonths);
    const emi = roundMoney(amount * r * (factor / (factor - 1)));
    const totalPayable = roundMoney(emi * tenureMonths);
    const totalInterest = roundMoney(totalPayable - amount);

    const newLoan: Loan = {
      id: generateId('loan'),
      loanId: `LN-2025-${Math.floor(100 + Math.random() * 900)}`,
      customerId: customer.id,
      customerName: customer.fullName,
      loanType,
      amount: roundMoney(amount),
      interestRate,
      tenureMonths,
      monthlyEmi: emi,
      totalPayable,
      totalInterest,
      amountPaid: 0,
      status: 'PENDING',
      purpose,
      appliedAt: new Date().toISOString(),
      repayments: [],
    };

    loans.unshift(newLoan);
    setStored(STORAGE_KEYS.LOANS, loans);
    this.addAuditLog('APPLY_LOAN', `Customer ${customer.fullName} applied for ${loanType} loan of $${amount.toFixed(2)}.`);
    this.addNotification(customer.userId, 'Loan Application Submitted', `Your loan application #${newLoan.loanId} ($${amount.toFixed(2)}) is under review.`);

    return newLoan;
  }

  static approveLoan(loanId: string): Loan {
    const loans = this.getLoans();
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) throw new Error('Loan not found');
    if (loan.status !== 'PENDING') throw new Error('Only pending loans can be approved');

    loan.status = 'APPROVED';
    loan.approvedAt = new Date().toISOString();
    setStored(STORAGE_KEYS.LOANS, loans);

    this.addAuditLog('APPROVE_LOAN', `Approved loan #${loan.loanId} for ${loan.customerName}.`);
    this.addNotification(loan.customerId, 'Loan Approved', `Your loan #${loan.loanId} for $${loan.amount.toFixed(2)} has been APPROVED! Ready for disbursement.`);
    return loan;
  }

  static rejectLoan(loanId: string, reason: string): Loan {
    const loans = this.getLoans();
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) throw new Error('Loan not found');

    loan.status = 'REJECTED';
    loan.rejectionReason = reason;
    setStored(STORAGE_KEYS.LOANS, loans);

    this.addAuditLog('REJECT_LOAN', `Rejected loan #${loan.loanId}. Reason: ${reason}`);
    this.addNotification(loan.customerId, 'Loan Status Update', `Your loan application #${loan.loanId} was declined: ${reason}`);
    return loan;
  }

  static disburseLoan(loanId: string, targetAccountId: string): Loan {
    const loans = this.getLoans();
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) throw new Error('Loan not found');
    if (loan.status !== 'APPROVED') throw new Error('Only approved loans can be disbursed');

    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.id === targetAccountId);
    if (!account) throw new Error('Target account not found');

    account.balance = roundMoney(account.balance + loan.amount);
    setStored(STORAGE_KEYS.ACCOUNTS, accounts);

    loan.status = 'DISBURSED';
    loan.disbursedToAccountId = account.id;
    loan.disbursedAt = new Date().toISOString();
    setStored(STORAGE_KEYS.LOANS, loans);

    this.recordTransaction({
      accountId: account.id,
      accountNumber: account.accountNumber,
      customerName: account.customerName,
      type: 'LOAN_DISBURSEMENT',
      amount: loan.amount,
      balanceAfter: account.balance,
      description: `Disbursement of ${loan.loanType} Loan #${loan.loanId}`,
    });

    this.addAuditLog('DISBURSE_LOAN', `Disbursed $${loan.amount.toFixed(2)} for loan #${loan.loanId} into account ${account.accountNumber}.`);
    this.addNotification(
      loan.customerId,
      'Loan Disbursed!',
      `$${loan.amount.toFixed(2)} has been credited to your account ${account.accountNumber}. Monthly EMI is $${loan.monthlyEmi.toFixed(2)}.`
    );

    return loan;
  }

  static repayLoanEMI(loanId: string, sourceAccountId: string): Loan {
    const loans = this.getLoans();
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) throw new Error('Loan not found');
    if (loan.status !== 'DISBURSED') throw new Error('Loan is not active');

    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.id === sourceAccountId);
    if (!account) throw new Error('Source account not found');

    const remaining = roundMoney(loan.totalPayable - loan.amountPaid);
    const emi = Math.min(loan.monthlyEmi, remaining);

    if (account.balance - emi < account.minimumBalance) {
      throw new Error(`Insufficient funds in account. Requires $${emi.toFixed(2)}.`);
    }

    account.balance = roundMoney(account.balance - emi);
    setStored(STORAGE_KEYS.ACCOUNTS, accounts);

    loan.amountPaid = roundMoney(loan.amountPaid + emi);
    if (loan.amountPaid >= loan.totalPayable) {
      loan.status = 'CLOSED';
    }

    const nextInstallment = loan.repayments.length + 1;
    loan.repayments.push({
      id: generateId('rep'),
      installmentNumber: nextInstallment,
      amount: emi,
      principalComponent: roundMoney(emi * 0.7),
      interestComponent: roundMoney(emi * 0.3),
      paidAt: new Date().toISOString(),
    });

    setStored(STORAGE_KEYS.LOANS, loans);

    this.recordTransaction({
      accountId: account.id,
      accountNumber: account.accountNumber,
      customerName: account.customerName,
      type: 'EMI_PAYMENT',
      amount: emi,
      balanceAfter: account.balance,
      description: `EMI Installment #${nextInstallment} for Loan #${loan.loanId}`,
    });

    this.addAuditLog('PAY_EMI', `Repaid EMI of $${emi.toFixed(2)} for Loan #${loan.loanId}.`);
    this.addNotification(
      loan.customerId,
      'EMI Payment Received',
      `EMI payment of $${emi.toFixed(2)} confirmed for Loan #${loan.loanId}. Remaining balance: $${(loan.totalPayable - loan.amountPaid).toFixed(2)}.`
    );

    return loan;
  }

  // Fixed Deposits
  static getFixedDeposits(): FixedDeposit[] {
    return getStored<FixedDeposit[]>(STORAGE_KEYS.FDS, INITIAL_FIXED_DEPOSITS);
  }

  static openFixedDeposit(
    customerId: string,
    linkedAccountId: string,
    principalAmount: number,
    tenureMonths: number,
    interestRate: number
  ): FixedDeposit {
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.id === linkedAccountId);
    if (!account) throw new Error('Linked funding account not found');

    if (account.balance - principalAmount < account.minimumBalance) {
      throw new Error(`Insufficient funds in account ${account.accountNumber} to fund FD of $${principalAmount.toFixed(2)}.`);
    }

    // Deduct principal
    account.balance = roundMoney(account.balance - principalAmount);
    setStored(STORAGE_KEYS.ACCOUNTS, accounts);

    const P = principalAmount;
    const r = interestRate / 100;
    const n = 4; // quarterly
    const t = tenureMonths / 12;
    const maturityAmount = roundMoney(P * Math.pow(1 + r / n, n * t));
    const totalInterest = roundMoney(maturityAmount - P);

    const today = new Date();
    const matDate = new Date();
    matDate.setMonth(today.getMonth() + tenureMonths);

    const fds = this.getFixedDeposits();
    const newFD: FixedDeposit = {
      id: generateId('fd'),
      fdNumber: `FD-${Math.floor(100000 + Math.random() * 900000)}`,
      customerId,
      customerName: account.customerName,
      linkedAccountId,
      principalAmount: roundMoney(principalAmount),
      interestRate,
      tenureMonths,
      maturityAmount,
      totalInterest,
      status: 'ACTIVE',
      startDate: today.toISOString().split('T')[0],
      maturityDate: matDate.toISOString().split('T')[0],
    };

    fds.unshift(newFD);
    setStored(STORAGE_KEYS.FDS, fds);

    this.recordTransaction({
      accountId: account.id,
      accountNumber: account.accountNumber,
      customerName: account.customerName,
      type: 'TRANSFER_OUT',
      amount: principalAmount,
      balanceAfter: account.balance,
      description: `Funded Fixed Deposit #${newFD.fdNumber} (${tenureMonths} Months)`,
    });

    this.addAuditLog('OPEN_FD', `Opened FD #${newFD.fdNumber} with $${principalAmount.toFixed(2)} at ${interestRate}%.`);
    this.addNotification(customerId, 'Fixed Deposit Certificate', `FD #${newFD.fdNumber} generated. Maturity: $${maturityAmount.toFixed(2)}.`);

    return newFD;
  }

  static closeFixedDeposit(fdId: string): FixedDeposit {
    const fds = this.getFixedDeposits();
    const fd = fds.find((f) => f.id === fdId);
    if (!fd) throw new Error('Fixed Deposit not found');
    if (fd.status !== 'ACTIVE') throw new Error('FD is not active');

    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.id === fd.linkedAccountId);
    if (!account) throw new Error('Linked refund account not found');

    const today = new Date().toISOString().split('T')[0];
    let payout = fd.maturityAmount;
    if (today < fd.maturityDate) {
      // 1% premature penalty
      const penalty = roundMoney(fd.principalAmount * 0.01);
      payout = roundMoney(fd.principalAmount - penalty);
      fd.status = 'CLOSED_PREMATURE';
    } else {
      fd.status = 'MATURED';
    }

    account.balance = roundMoney(account.balance + payout);
    setStored(STORAGE_KEYS.ACCOUNTS, accounts);
    setStored(STORAGE_KEYS.FDS, fds);

    this.recordTransaction({
      accountId: account.id,
      accountNumber: account.accountNumber,
      customerName: account.customerName,
      type: 'FD_INTEREST',
      amount: payout,
      balanceAfter: account.balance,
      description: `Settlement of Fixed Deposit #${fd.fdNumber}`,
    });

    this.addAuditLog('CLOSE_FD', `Settled FD #${fd.fdNumber}, refunded $${payout.toFixed(2)} to account ${account.accountNumber}.`);
    this.addNotification(fd.customerId, 'FD Settled', `FD #${fd.fdNumber} settled with payout of $${payout.toFixed(2)} to account ${account.accountNumber}.`);

    return fd;
  }

  // Beneficiaries
  static getBeneficiaries(): Beneficiary[] {
    return getStored<Beneficiary[]>(STORAGE_KEYS.BENEFICIARIES, INITIAL_BENEFICIARIES);
  }

  static addBeneficiary(ben: Omit<Beneficiary, 'id' | 'createdAt'>): Beneficiary {
    const bens = this.getBeneficiaries();
    const newBen: Beneficiary = {
      ...ben,
      id: generateId('ben'),
      createdAt: new Date().toISOString(),
    };
    bens.unshift(newBen);
    setStored(STORAGE_KEYS.BENEFICIARIES, bens);
    this.addAuditLog('ADD_BENEFICIARY', `Added beneficiary ${newBen.beneficiaryName} (${newBen.accountNumber}).`);
    return newBen;
  }

  static deleteBeneficiary(id: string): void {
    const bens = this.getBeneficiaries().filter((b) => b.id !== id);
    setStored(STORAGE_KEYS.BENEFICIARIES, bens);
  }

  // Audit Logs
  static getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.LOGS, INITIAL_AUDIT_LOGS);
  }

  static addAuditLog(action: string, description: string, status: AuditLog['status'] = 'SUCCESS'): void {
    const currentUser = this.getCurrentUser();
    const logs = this.getAuditLogs();
    logs.unshift({
      id: generateId('log'),
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.username,
      action,
      description,
      ipAddress: '127.0.0.1',
      status,
      createdAt: new Date().toISOString(),
    });
    setStored(STORAGE_KEYS.LOGS, logs.slice(0, 200));
  }

  // Notifications
  static getNotifications(): NotificationItem[] {
    return getStored<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  static addNotification(userId: string, title: string, message: string, type: NotificationItem['type'] = 'SYSTEM'): void {
    const notifs = this.getNotifications();
    notifs.unshift({
      id: generateId('notif'),
      userId,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
      type,
    });
    setStored(STORAGE_KEYS.NOTIFICATIONS, notifs.slice(0, 100));
  }

  static markNotificationRead(id: string): void {
    const notifs = this.getNotifications();
    const notif = notifs.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      setStored(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  }

  static markAllNotificationsRead(): void {
    const notifs = this.getNotifications();
    notifs.forEach((n) => (n.isRead = true));
    setStored(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }

  // Reset to default
  static resetDemoData(): void {
    localStorage.clear();
    setStored(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
    setStored(STORAGE_KEYS.USERS, INITIAL_USERS);
    setStored(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    setStored(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    setStored(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    setStored(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    setStored(STORAGE_KEYS.LOANS, INITIAL_LOANS);
    setStored(STORAGE_KEYS.FDS, INITIAL_FIXED_DEPOSITS);
    setStored(STORAGE_KEYS.BENEFICIARIES, INITIAL_BENEFICIARIES);
    setStored(STORAGE_KEYS.BRANCHES, INITIAL_BRANCHES);
    setStored(STORAGE_KEYS.LOGS, INITIAL_AUDIT_LOGS);
    setStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }
}
