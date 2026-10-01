export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone: string;
  avatarUrl?: string;
  isVerified: boolean;
  password?: string;
}

export type AccountType = 'SAVINGS' | 'CURRENT' | 'FIXED_DEPOSIT' | 'RECURRING_DEPOSIT';
export type AccountStatus = 'ACTIVE' | 'DORMANT' | 'FROZEN' | 'CLOSED';

export interface BankAccount {
  id: string;
  accountNumber: string;
  customerId: string;
  customerName: string;
  accountType: AccountType;
  currency: string;
  balance: number;
  minimumBalance: number;
  interestRate: number;
  status: AccountStatus;
  dailyTransferLimit: number;
  createdAt: string;
}

export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'LOAN_DISBURSEMENT'
  | 'EMI_PAYMENT'
  | 'FD_INTEREST';

export interface Transaction {
  id: string;
  referenceId: string;
  accountId: string;
  accountNumber: string;
  customerName: string;
  recipientAccountId?: string;
  recipientAccountNumber?: string;
  recipientCustomerName?: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
  createdAt: string;
}

export type KYCStatus = 'VERIFIED' | 'PENDING' | 'REJECTED';

export type StaffStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED';

export interface StaffMember {
  id: string;
  employeeId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  branchId: string;
  branchName: string;
  department: string;
  designation: string;
  approvalLimit: number;
  status: StaffStatus;
  joinedAt: string;
  password?: string;
}

export interface Customer {
  id: string;
  customerId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  idType: string;
  idNumber: string;
  address: string;
  city: string;
  state: string;
  occupation: string;
  annualIncome: number;
  branchId: string;
  branchName: string;
  kycStatus: KYCStatus;
  createdAt: string;
}

export type LoanType = 'PERSONAL' | 'HOME' | 'VEHICLE' | 'EDUCATION' | 'BUSINESS';
export type LoanStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'CLOSED';

export interface LoanRepayment {
  id: string;
  installmentNumber: number;
  amount: number;
  principalComponent: number;
  interestComponent: number;
  paidAt: string;
}

export interface Loan {
  id: string;
  loanId: string;
  customerId: string;
  customerName: string;
  loanType: LoanType;
  amount: number;
  interestRate: number;
  tenureMonths: number;
  monthlyEmi: number;
  totalPayable: number;
  totalInterest: number;
  amountPaid: number;
  status: LoanStatus;
  purpose: string;
  disbursedToAccountId?: string;
  rejectionReason?: string;
  appliedAt: string;
  approvedAt?: string;
  disbursedAt?: string;
  repayments: LoanRepayment[];
}

export interface FixedDeposit {
  id: string;
  fdNumber: string;
  customerId: string;
  customerName: string;
  linkedAccountId: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  maturityAmount: number;
  totalInterest: number;
  status: 'ACTIVE' | 'MATURED' | 'CLOSED_PREMATURE';
  startDate: string;
  maturityDate: string;
}

export interface Beneficiary {
  id: string;
  customerId: string;
  beneficiaryName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  branchCode: string;
  ifscCode: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  managerName: string;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type?: 'TRANSACTION' | 'LOAN' | 'SECURITY' | 'SYSTEM';
}
