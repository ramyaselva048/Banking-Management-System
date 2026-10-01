/**
 * Apex National Bank - Complete Production Banking Management System
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { CustomerManagement } from './components/CustomerManagement';
import { AccountManagement } from './components/AccountManagement';
import { DepositWithdraw } from './components/DepositWithdraw';
import { FundTransfer } from './components/FundTransfer';
import { TransactionsStatement } from './components/TransactionsStatement';
import { LoanManagement } from './components/LoanManagement';
import { FixedDeposits } from './components/FixedDeposits';
import { Beneficiaries } from './components/Beneficiaries';
import { BranchManagement } from './components/BranchManagement';
import { ReportsAnalytics } from './components/ReportsAnalytics';
import { AuditLogs } from './components/AuditLogs';
import { NotificationsView } from './components/NotificationsView';
import { ProfileView } from './components/ProfileView';
import { DjangoExplorer } from './components/DjangoExplorer';
import { LoginView } from './components/LoginView';
import { PrintReportModal } from './components/PrintReportModal';
import { StaffManagement } from './components/StaffManagement';
import { OfficialPrintDocument } from './components/OfficialPrintDocument';
import { executeDirectPrint } from './utils/directPrint';

import { BankingStorage } from './services/storage';
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
  AccountType,
  LoanType,
  StaffMember,
} from './types/banking';

export default function App() {
  // Authentication & session state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  // Core state from storage
  const [currentUser, setCurrentUser] = useState<User>(() => BankingStorage.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => BankingStorage.getUsers());
  const [customers, setCustomers] = useState<Customer[]>(() => BankingStorage.getCustomers());
  const [accounts, setAccounts] = useState<BankAccount[]>(() => BankingStorage.getAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => BankingStorage.getTransactions());
  const [loans, setLoans] = useState<Loan[]>(() => BankingStorage.getLoans());
  const [fixedDeposits, setFixedDeposits] = useState<FixedDeposit[]>(() => BankingStorage.getFixedDeposits());
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(() => BankingStorage.getBeneficiaries());
  const [branches, setBranches] = useState<Branch[]>(() => BankingStorage.getBranches());
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => BankingStorage.getStaff());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => BankingStorage.getAuditLogs());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => BankingStorage.getNotifications());

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [depositWithdrawMode, setDepositWithdrawMode] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [statementFilterAccountId, setStatementFilterAccountId] = useState<string | undefined>(undefined);
  const [accountCustomerFilterId, setAccountCustomerFilterId] = useState<string | undefined>(undefined);

  // Print Report Modal state
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printConfig, setPrintConfig] = useState<{
    reportType: 'STATEMENT' | 'FINANCIAL' | 'CUSTOMERS' | 'LOANS';
    accountId?: string;
  }>({
    reportType: 'STATEMENT',
  });

  // Sync state helpers
  const refreshState = () => {
    setCurrentUser(BankingStorage.getCurrentUser());
    setUsers(BankingStorage.getUsers());
    setCustomers(BankingStorage.getCustomers());
    setStaffMembers(BankingStorage.getStaff());
    setAccounts(BankingStorage.getAccounts());
    setTransactions(BankingStorage.getTransactions());
    setLoans(BankingStorage.getLoans());
    setFixedDeposits(BankingStorage.getFixedDeposits());
    setBeneficiaries(BankingStorage.getBeneficiaries());
    setBranches(BankingStorage.getBranches());
    setAuditLogs(BankingStorage.getAuditLogs());
    setNotifications(BankingStorage.getNotifications());
  };

  useEffect(() => {
    BankingStorage.loadFromDatabase().then((loaded) => {
      if (loaded) {
        refreshState();
      }
    });
  }, []);

  const handleSwitchUser = (user: User) => {
    BankingStorage.setCurrentUser(user);
    setCurrentUser(user);
    // If switched from admin, ensure they aren't on admin-only page like staff allocation
    if (user.role !== 'ADMIN' && activeTab === 'staff') {
      setActiveTab('dashboard');
    }
    if (user.role === 'CUSTOMER' && ['customers', 'branches', 'reports', 'audit', 'deposit', 'withdraw', 'staff'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    BankingStorage.addAuditLog(
      'LOGOUT',
      `User ${currentUser.username} (${currentUser.role}) logged out of active banking session.`
    );
    setIsLoggedIn(false);
    refreshState();
  };

  const handleLogin = (user: User) => {
    BankingStorage.setCurrentUser(user);
    setCurrentUser(user);
    BankingStorage.addAuditLog(
      'LOGIN',
      `User ${user.username} (${user.role}) authenticated successfully.`
    );
    setIsLoggedIn(true);
    refreshState();
    setActiveTab('dashboard');
  };

  const handleRegisterCustomer = (
    name: string,
    email: string,
    phone: string,
    branchName: string,
    customPassword?: string
  ) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: email.split('@')[0],
      email: email.trim().toLowerCase(),
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' ') || 'Customer',
      role: 'CUSTOMER',
      phone,
      isVerified: true,
      password: customPassword || 'customer123',
    };
    BankingStorage.addUser(newUser);

    BankingStorage.addCustomer({
      userId: newUser.id,
      fullName: name,
      email: email.trim().toLowerCase(),
      phone,
      dateOfBirth: '',
      gender: 'Male',
      idType: 'National ID',
      idNumber: '',
      address: '',
      city: '',
      state: '',
      occupation: '',
      annualIncome: 0,
      branchId: branches[0]?.id || '',
      branchName: branchName || branches[0]?.name || '',
      kycStatus: 'VERIFIED',
    });

    refreshState();
  };

  const [selectedPrintAccountId, setSelectedPrintAccountId] = useState<string | undefined>(undefined);

  const handleOpenPrintReport = (
    reportType: 'STATEMENT' | 'FINANCIAL' | 'CUSTOMERS' | 'LOANS' = 'STATEMENT',
    accountId?: string
  ) => {
    const targetAccId = accountId || accounts[0]?.id;
    const targetAcc = accounts.find((a) => a.id === targetAccId) || accounts[0];
    const targetCust = targetAcc
      ? customers.find((c) => c.id === targetAcc.customerId)
      : undefined;

    setSelectedPrintAccountId(targetAccId);
    setPrintConfig({
      reportType,
      accountId: targetAccId,
    });

    // 1. Open the preview modal for clear UI state
    setShowPrintModal(true);

    // 2. Directly trigger print to computer / printer
    executeDirectPrint({
      account: targetAcc,
      transactions,
      customer: targetCust,
      currentUser,
    });
  };

  const handleResetData = () => {
    BankingStorage.resetDemoData();
    setCurrentUser(BankingStorage.getCurrentUser());
    refreshState();
    setActiveTab('dashboard');
  };

  // Notification handlers
  const handleMarkNotificationRead = (id: string) => {
    BankingStorage.markNotificationRead(id);
    refreshState();
  };

  const handleMarkAllNotificationsRead = () => {
    BankingStorage.markAllNotificationsRead();
    refreshState();
  };

  // Banking Operations
  const handleDeposit = (accountId: string, amount: number, desc: string): Transaction => {
    const txn = BankingStorage.deposit(accountId, amount, desc);
    refreshState();
    return txn;
  };

  const handleWithdraw = (accountId: string, amount: number, desc: string): Transaction => {
    const txn = BankingStorage.withdraw(accountId, amount, desc);
    refreshState();
    return txn;
  };

  const handleTransfer = (
    srcAccId: string,
    destAccNum: string,
    amount: number,
    desc: string
  ): Transaction => {
    const txn = BankingStorage.transfer(srcAccId, destAccNum, amount, desc);
    refreshState();
    return txn;
  };

  // Customers
  const handleAddCustomer = (custData: Omit<Customer, 'id' | 'customerId' | 'createdAt'>) => {
    BankingStorage.addCustomer(custData);
    refreshState();
  };

  const handleUpdateCustomer = (id: string, updates: Partial<Customer>) => {
    BankingStorage.updateCustomer(id, updates);
    refreshState();
  };

  const handleDeleteCustomer = (id: string) => {
    BankingStorage.deleteCustomer(id);
    refreshState();
  };

  // Accounts
  const handleOpenAccount = (
    customerId: string,
    accountType: AccountType,
    initialDeposit: number,
    interestRate: number
  ) => {
    BankingStorage.addAccount(customerId, accountType, initialDeposit, interestRate);
    refreshState();
  };

  // Loans
  const handleApplyLoan = (
    customerId: string,
    loanType: LoanType,
    amount: number,
    tenureMonths: number,
    rate: number,
    purpose: string
  ) => {
    BankingStorage.applyLoan(customerId, loanType, amount, tenureMonths, rate, purpose);
    refreshState();
  };

  const handleApproveLoan = (loanId: string) => {
    BankingStorage.approveLoan(loanId);
    refreshState();
  };

  const handleRejectLoan = (loanId: string, reason: string) => {
    BankingStorage.rejectLoan(loanId, reason);
    refreshState();
  };

  const handleDisburseLoan = (loanId: string, targetAccountId: string) => {
    BankingStorage.disburseLoan(loanId, targetAccountId);
    refreshState();
  };

  const handleRepayEMI = (loanId: string, sourceAccountId: string) => {
    BankingStorage.repayLoanEMI(loanId, sourceAccountId);
    refreshState();
  };

  // Fixed Deposits
  const handleOpenFD = (
    customerId: string,
    linkedAccountId: string,
    principal: number,
    tenureMonths: number,
    rate: number
  ) => {
    BankingStorage.openFixedDeposit(customerId, linkedAccountId, principal, tenureMonths, rate);
    refreshState();
  };

  const handleCloseFD = (fdId: string) => {
    BankingStorage.closeFixedDeposit(fdId);
    refreshState();
  };

  // Beneficiaries
  const handleAddBeneficiary = (ben: Omit<Beneficiary, 'id' | 'createdAt'>) => {
    BankingStorage.addBeneficiary(ben);
    refreshState();
  };

  const handleDeleteBeneficiary = (id: string) => {
    BankingStorage.deleteBeneficiary(id);
    refreshState();
  };

  // Branches
  const handleAddBranch = (branch: Omit<Branch, 'id'>) => {
    BankingStorage.addBranch(branch);
    refreshState();
  };

  // Staff Allocation (Admin Only)
  const handleAddStaff = (
    staffData: Omit<StaffMember, 'id' | 'employeeId' | 'joinedAt'>,
    initialPassword?: string
  ) => {
    BankingStorage.addStaff(staffData, initialPassword);
    refreshState();
  };

  const handleUpdateStaff = (
    id: string,
    updates: Partial<StaffMember>,
    newPassword?: string
  ) => {
    BankingStorage.updateStaff(id, updates, newPassword);
    refreshState();
  };

  const handleTransferStaff = (staffId: string, newBranchId: string) => {
    BankingStorage.transferStaff(staffId, newBranchId);
    refreshState();
  };

  const handleDeleteStaff = (id: string) => {
    BankingStorage.deleteStaff(id);
    refreshState();
  };

  // Profile update
  const handleUpdateUser = (updated: Partial<User>) => {
    const updatedUser = { ...currentUser, ...updated };
    BankingStorage.updateUser(updatedUser);
    BankingStorage.setCurrentUser(updatedUser);
    setCurrentUser(updatedUser);
    refreshState();
  };

  const pendingLoansCount = loans.filter((l) => l.status === 'PENDING').length;
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  // If user has logged out, present the dedicated Login View
  if (!isLoggedIn) {
    return (
      <LoginView
        users={users}
        onLogin={handleLogin}
        onRegisterCustomer={handleRegisterCustomer}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onResetData={handleResetData}
        onNavigate={(tab) => setActiveTab(tab)}
        onLogout={handleLogout}
        onOpenPrintReport={() => handleOpenPrintReport('STATEMENT')}
      />

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <Sidebar
          currentTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          userRole={currentUser.role}
          pendingLoansCount={pendingLoansCount}
          unreadNotifsCount={unreadNotifsCount}
          onLogout={handleLogout}
          onOpenPrintReport={() => handleOpenPrintReport('STATEMENT')}
        />

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <Dashboard
              currentUser={currentUser}
              accounts={accounts}
              transactions={transactions}
              loans={loans}
              customers={customers}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenDeposit={() => {
                setDepositWithdrawMode('DEPOSIT');
                setActiveTab('deposit');
              }}
              onOpenWithdraw={() => {
                setDepositWithdrawMode('WITHDRAW');
                setActiveTab('withdraw');
              }}
              onOpenTransfer={() => setActiveTab('transfer')}
              onOpenPrintReport={() => handleOpenPrintReport('FINANCIAL')}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerManagement
              customers={customers}
              branches={branches}
              accounts={accounts}
              loans={loans}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onOpenAccountForCustomer={(custId) => {
                setAccountCustomerFilterId(custId);
                setActiveTab('accounts');
              }}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountManagement
              accounts={accounts}
              customers={customers}
              onOpenAccount={handleOpenAccount}
              onNavigateToTransfer={() => setActiveTab('transfer')}
              onNavigateToStatement={(accId) => {
                setStatementFilterAccountId(accId);
                setActiveTab('transactions');
              }}
              defaultCustomerFilterId={accountCustomerFilterId}
            />
          )}

          {(activeTab === 'deposit' || activeTab === 'withdraw') && (
            <DepositWithdraw
              mode={activeTab === 'deposit' ? 'DEPOSIT' : 'WITHDRAW'}
              accounts={accounts}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
            />
          )}

          {activeTab === 'transfer' && (
            <FundTransfer
              accounts={accounts}
              beneficiaries={beneficiaries}
              onTransfer={handleTransfer}
              onNavigateToBeneficiaries={() => setActiveTab('beneficiaries')}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsStatement
              transactions={transactions}
              accounts={accounts}
              customers={customers}
              selectedAccountId={statementFilterAccountId}
              onOpenPrintReport={(accId) => handleOpenPrintReport('STATEMENT', accId)}
            />
          )}

          {activeTab === 'loans' && (
            <LoanManagement
              loans={loans}
              accounts={accounts}
              customers={customers}
              userRole={currentUser.role}
              onApplyLoan={handleApplyLoan}
              onApproveLoan={handleApproveLoan}
              onRejectLoan={handleRejectLoan}
              onDisburseLoan={handleDisburseLoan}
              onRepayEMI={handleRepayEMI}
            />
          )}

          {activeTab === 'deposits' && (
            <FixedDeposits
              fixedDeposits={fixedDeposits}
              accounts={accounts}
              customers={customers}
              onOpenFD={handleOpenFD}
              onCloseFD={handleCloseFD}
            />
          )}

          {activeTab === 'beneficiaries' && (
            <Beneficiaries
              beneficiaries={beneficiaries}
              customers={customers}
              onAddBeneficiary={handleAddBeneficiary}
              onDeleteBeneficiary={handleDeleteBeneficiary}
              onInitiateTransfer={(accNum) => {
                setActiveTab('transfer');
              }}
            />
          )}

          {activeTab === 'staff' && currentUser.role === 'ADMIN' && (
            <StaffManagement
              staffMembers={staffMembers}
              branches={branches}
              onAddStaff={handleAddStaff}
              onUpdateStaff={handleUpdateStaff}
              onTransferStaff={handleTransferStaff}
              onDeleteStaff={handleDeleteStaff}
            />
          )}

          {activeTab === 'branches' && (
            <BranchManagement branches={branches} onAddBranch={handleAddBranch} />
          )}

          {activeTab === 'reports' && (
            <ReportsAnalytics
              transactions={transactions}
              accounts={accounts}
              customers={customers}
              loans={loans}
              branches={branches}
              onOpenPrintReport={() => handleOpenPrintReport('FINANCIAL')}
            />
          )}

          {activeTab === 'audit' && <AuditLogs logs={auditLogs} />}

          {activeTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onMarkRead={handleMarkNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
            />
          )}

          {activeTab === 'django_project' && <DjangoExplorer />}
        </main>
      </div>

      {/* Official Print Report Modal Dialog */}
      <PrintReportModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        accounts={accounts}
        transactions={transactions}
        customers={customers}
        loans={loans}
        branches={branches}
        currentUser={currentUser}
        initialReportType={printConfig.reportType}
        initialAccountId={printConfig.accountId}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Apex National Bank &bull; Enterprise Banking Management System</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Django ORM &bull; Bootstrap 5 &bull; Chart.js &bull; MySQL Ready
          </span>
        </div>
      </footer>

      {/* Official Direct Computer Printable Statement (Triggered directly on print) */}
      <OfficialPrintDocument
        accounts={accounts}
        transactions={transactions}
        customers={customers}
        currentUser={currentUser}
        selectedAccountId={selectedPrintAccountId}
      />
    </div>
  );
}
