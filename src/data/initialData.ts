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
  StaffMember,
} from '../types/banking';

export const INITIAL_STAFF: StaffMember[] = [];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    email: 'admin@apexbank.com',
    firstName: 'Admin',
    lastName: '',
    role: 'ADMIN',
    phone: '',
    isVerified: true,
    password: 'admin123',
  },
];

export const INITIAL_BRANCHES: Branch[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_ACCOUNTS: BankAccount[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_LOANS: Loan[] = [];

export const INITIAL_FIXED_DEPOSITS: FixedDeposit[] = [];

export const INITIAL_BENEFICIARIES: Beneficiary[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
