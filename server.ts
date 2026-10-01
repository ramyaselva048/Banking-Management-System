import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connect } from '@tidbcloud/serverless';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_TIDB_URI =
  'mysql://3s5MtfbFqMWrRVu.root:sqdOwwQZIjyjgz0Z@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/sys';

const rawUri = process.env.DATABASE_URL || DEFAULT_TIDB_URI;
const parsedUrl = new URL(rawUri);
const requestedDb = parsedUrl.pathname.replace(/^\//, '') || 'apex_bank';
// In TiDB Cloud, 'sys' is a read-only system schema; use 'apex_bank' for application tables
const ACTIVE_DB = requestedDb === 'sys' ? 'apex_bank' : requestedDb;

const dbUrl = new URL(rawUri);
dbUrl.pathname = `/${ACTIVE_DB}`;

const rootConn = connect({ url: rawUri });
const db = connect({ url: dbUrl.toString() });

let dbReady = false;
let dbError: string | null = null;
let initPromise: Promise<void> | null = null;

async function queryRows<T = Record<string, any>>(sql: string, params: any[] = []): Promise<T[]> {
  const res = await db.execute(sql, params);
  return (Array.isArray(res) ? res : []) as T[];
}

async function bulkReplace(
  tableName: string,
  columns: string[],
  rows: any[][],
  options: { deleteMissing?: boolean; allowEmptyDelete?: boolean } = {}
): Promise<void> {
  const { deleteMissing = false, allowEmptyDelete = false } = options;

  if (deleteMissing) {
    if (rows.length > 0) {
      const ids = rows.map((r) => r[0]);
      const placeholders = ids.map(() => '?').join(',');
      await db.execute(`DELETE FROM ${tableName} WHERE id NOT IN (${placeholders})`, ids);
    } else if (allowEmptyDelete) {
      await db.execute(`DELETE FROM ${tableName}`);
    }
  }

  if (rows.length === 0) return;

  // Chunk into batches of 50 rows per single multi-row REPLACE query
  const chunkSize = 50;
  const rowPlaceholder = `(${columns.map(() => '?').join(', ')})`;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const valuesPlaceholder = chunk.map(() => rowPlaceholder).join(', ');
    const flatParams = chunk.flat();
    await db.execute(
      `REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES ${valuesPlaceholder}`,
      flatParams
    );
  }
}

async function syncCollection(
  collection: string,
  items: any[],
  allowEmptyDelete: boolean = true
): Promise<void> {
  if (!Array.isArray(items)) return;

  if (collection === 'users') {
    await bulkReplace(
      'users',
      ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_verified', 'password'],
      items.map((u) => [
        u.id,
        u.username || '',
        u.email || '',
        u.firstName || '',
        u.lastName || '',
        u.role || 'CUSTOMER',
        u.phone || '',
        u.isVerified ? 1 : 0,
        u.password || '',
      ]),
      { deleteMissing: items.length > 0, allowEmptyDelete: false }
    );
  } else if (collection === 'branches') {
    await bulkReplace(
      'branches',
      ['id', 'name', 'branch_code', 'ifsc_code', 'address', 'city', 'state', 'phone', 'email', 'manager_name', 'is_active'],
      items.map((b) => [
        b.id,
        b.name,
        b.branchCode,
        b.ifscCode,
        b.address || '',
        b.city || '',
        b.state || '',
        b.phone || '',
        b.email || '',
        b.managerName || '',
        b.isActive ? 1 : 0,
      ]),
      { deleteMissing: true, allowEmptyDelete }
    );
  } else if (collection === 'staff') {
    await bulkReplace(
      'staff',
      ['id', 'employee_id', 'user_id', 'full_name', 'email', 'phone', 'branch_id', 'branch_name', 'department', 'designation', 'approval_limit', 'status', 'joined_at', 'password'],
      items.map((s) => [
        s.id,
        s.employeeId,
        s.userId,
        s.fullName,
        s.email,
        s.phone || '',
        s.branchId || '',
        s.branchName || '',
        s.department || '',
        s.designation || '',
        Number(s.approvalLimit) || 0,
        s.status || 'ACTIVE',
        s.joinedAt || '',
        s.password || '',
      ]),
      { deleteMissing: true, allowEmptyDelete }
    );
  } else if (collection === 'customers') {
    await bulkReplace(
      'customers',
      ['id', 'customer_id', 'user_id', 'full_name', 'email', 'phone', 'date_of_birth', 'gender', 'id_type', 'id_number', 'address', 'city', 'state', 'occupation', 'annual_income', 'branch_id', 'branch_name', 'kyc_status', 'created_at'],
      items.map((c) => [
        c.id,
        c.customerId,
        c.userId,
        c.fullName,
        c.email,
        c.phone || '',
        c.dateOfBirth || '',
        c.gender || 'Male',
        c.idType || 'Passport',
        c.idNumber || '',
        c.address || '',
        c.city || '',
        c.state || '',
        c.occupation || '',
        Number(c.annualIncome) || 0,
        c.branchId || '',
        c.branchName || '',
        c.kycStatus || 'VERIFIED',
        c.createdAt || '',
      ]),
      { deleteMissing: true, allowEmptyDelete }
    );
  } else if (collection === 'accounts') {
    await bulkReplace(
      'accounts',
      ['id', 'account_number', 'customer_id', 'customer_name', 'account_type', 'currency', 'balance', 'minimum_balance', 'interest_rate', 'status', 'daily_transfer_limit', 'created_at'],
      items.map((a) => [
        a.id,
        a.accountNumber,
        a.customerId,
        a.customerName,
        a.accountType,
        a.currency || 'USD',
        Number(a.balance) || 0,
        Number(a.minimumBalance) || 0,
        Number(a.interestRate) || 0,
        a.status || 'ACTIVE',
        Number(a.dailyTransferLimit) || 50000,
        a.createdAt || '',
      ]),
      { deleteMissing: true, allowEmptyDelete }
    );
  } else if (collection === 'transactions') {
    await bulkReplace(
      'transactions',
      ['id', 'reference_id', 'account_id', 'account_number', 'customer_name', 'recipient_account_id', 'recipient_account_number', 'recipient_customer_name', 'type', 'amount', 'balance_after', 'description', 'status', 'created_at'],
      items.slice(0, 200).map((t) => [
        t.id,
        t.referenceId,
        t.accountId,
        t.accountNumber,
        t.customerName,
        t.recipientAccountId || null,
        t.recipientAccountNumber || null,
        t.recipientCustomerName || null,
        t.type,
        Number(t.amount) || 0,
        Number(t.balanceAfter) || 0,
        t.description || '',
        t.status || 'COMPLETED',
        t.createdAt || '',
      ]),
      { deleteMissing: false }
    );
  } else if (collection === 'loans') {
    await bulkReplace(
      'loans',
      ['id', 'loan_id', 'customer_id', 'customer_name', 'loan_type', 'amount', 'interest_rate', 'tenure_months', 'monthly_emi', 'total_payable', 'total_interest', 'amount_paid', 'status', 'purpose', 'rejection_reason', 'disbursed_to_account_id', 'applied_at', 'approved_at', 'disbursed_at', 'repayments_json'],
      items.map((l) => [
        l.id,
        l.loanId,
        l.customerId,
        l.customerName,
        l.loanType,
        Number(l.amount) || 0,
        Number(l.interestRate) || 0,
        Number(l.tenureMonths) || 12,
        Number(l.monthlyEmi) || 0,
        Number(l.totalPayable) || 0,
        Number(l.totalInterest) || 0,
        Number(l.amountPaid) || 0,
        l.status || 'PENDING',
        l.purpose || '',
        l.rejectionReason || null,
        l.disbursedToAccountId || null,
        l.appliedAt || '',
        l.approvedAt || null,
        l.disbursedAt || null,
        JSON.stringify(l.repayments || []),
      ]),
      { deleteMissing: true, allowEmptyDelete }
    );
  } else if (collection === 'fixedDeposits') {
    await bulkReplace(
      'fixed_deposits',
      ['id', 'fd_number', 'customer_id', 'customer_name', 'linked_account_id', 'principal_amount', 'interest_rate', 'tenure_months', 'maturity_amount', 'total_interest', 'status', 'start_date', 'maturity_date'],
      items.map((f) => [
        f.id,
        f.fdNumber,
        f.customerId,
        f.customerName,
        f.linkedAccountId,
        Number(f.principalAmount) || 0,
        Number(f.interestRate) || 0,
        Number(f.tenureMonths) || 12,
        Number(f.maturityAmount) || 0,
        Number(f.totalInterest) || 0,
        f.status || 'ACTIVE',
        f.startDate || '',
        f.maturityDate || '',
      ]),
      { deleteMissing: true, allowEmptyDelete }
    );
  } else if (collection === 'beneficiaries') {
    await bulkReplace(
      'beneficiaries',
      ['id', 'customer_id', 'beneficiary_name', 'account_number', 'bank_name', 'ifsc_code', 'email', 'phone', 'created_at'],
      items.map((b) => [
        b.id,
        b.customerId,
        b.beneficiaryName,
        b.accountNumber,
        b.bankName || '',
        b.ifscCode || '',
        b.email || null,
        b.phone || null,
        b.createdAt || '',
      ]),
      { deleteMissing: true, allowEmptyDelete }
    );
  } else if (collection === 'auditLogs') {
    await bulkReplace(
      'audit_logs',
      ['id', 'user_id', 'user_name', 'action', 'description', 'ip_address', 'status', 'created_at'],
      items.slice(0, 100).map((log) => [
        log.id,
        log.userId,
        log.userName,
        log.action,
        log.description || '',
        log.ipAddress || '127.0.0.1',
        log.status || 'SUCCESS',
        log.createdAt || '',
      ]),
      { deleteMissing: false }
    );
  } else if (collection === 'notifications') {
    await bulkReplace(
      'notifications',
      ['id', 'user_id', 'title', 'message', 'is_read', 'created_at', 'type'],
      items.slice(0, 100).map((n) => [
        n.id,
        n.userId,
        n.title,
        n.message || '',
        n.isRead ? 1 : 0,
        n.createdAt || '',
        n.type || 'SYSTEM',
      ]),
      { deleteMissing: false }
    );
  }
}

async function initDatabase(): Promise<void> {
  if (dbReady) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await rootConn.execute(`CREATE DATABASE IF NOT EXISTS \`${ACTIVE_DB}\``);

      await Promise.all([
        db.execute(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(64) PRIMARY KEY,
            username VARCHAR(128) NOT NULL,
            email VARCHAR(255) NOT NULL,
            first_name VARCHAR(128) NOT NULL,
            last_name VARCHAR(128) NOT NULL DEFAULT '',
            role VARCHAR(32) NOT NULL,
            phone VARCHAR(64) NOT NULL DEFAULT '',
            is_verified TINYINT(1) NOT NULL DEFAULT 1,
            password VARCHAR(255) NOT NULL DEFAULT ''
          )
        `),
        db.execute(`
          CREATE TABLE IF NOT EXISTS branches (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            branch_code VARCHAR(64) NOT NULL,
            ifsc_code VARCHAR(64) NOT NULL,
            address TEXT,
            city VARCHAR(128),
            state VARCHAR(128),
            phone VARCHAR(64),
            email VARCHAR(255),
            manager_name VARCHAR(255),
            is_active TINYINT(1) NOT NULL DEFAULT 1
          )
        `),
        db.execute(`
          CREATE TABLE IF NOT EXISTS staff (
            id VARCHAR(64) PRIMARY KEY,
            employee_id VARCHAR(64) NOT NULL,
            user_id VARCHAR(64) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(64),
            branch_id VARCHAR(64),
            branch_name VARCHAR(255),
            department VARCHAR(128),
            designation VARCHAR(128),
            approval_limit DECIMAL(15, 2) NOT NULL DEFAULT 0,
            status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
            joined_at VARCHAR(64),
            password VARCHAR(255)
          )
        `),
        db.execute(`
          CREATE TABLE IF NOT EXISTS customers (
            id VARCHAR(64) PRIMARY KEY,
            customer_id VARCHAR(64) NOT NULL,
            user_id VARCHAR(64) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(64),
            date_of_birth VARCHAR(64),
            gender VARCHAR(32),
            id_type VARCHAR(64),
            id_number VARCHAR(128),
            address TEXT,
            city VARCHAR(128),
            state VARCHAR(128),
            occupation VARCHAR(128),
            annual_income DECIMAL(15, 2) NOT NULL DEFAULT 0,
            branch_id VARCHAR(64),
            branch_name VARCHAR(255),
            kyc_status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED',
            created_at VARCHAR(64)
          )
        `),
        db.execute(`
          CREATE TABLE IF NOT EXISTS accounts (
            id VARCHAR(64) PRIMARY KEY,
            account_number VARCHAR(64) NOT NULL,
            customer_id VARCHAR(64) NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            account_type VARCHAR(64) NOT NULL,
            currency VARCHAR(16) NOT NULL DEFAULT 'USD',
            balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
            minimum_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
            interest_rate DECIMAL(6, 2) NOT NULL DEFAULT 0,
            status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
            daily_transfer_limit DECIMAL(15, 2) NOT NULL DEFAULT 50000,
            created_at VARCHAR(64)
          )
        `),
        db.execute(`
          CREATE TABLE IF NOT EXISTS transactions (
            id VARCHAR(64) PRIMARY KEY,
            reference_id VARCHAR(64) NOT NULL,
            account_id VARCHAR(64) NOT NULL,
            account_number VARCHAR(64) NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            recipient_account_id VARCHAR(64),
            recipient_account_number VARCHAR(64),
            recipient_customer_name VARCHAR(255),
            type VARCHAR(64) NOT NULL,
            amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
            balance_after DECIMAL(15, 2) NOT NULL DEFAULT 0,
            description TEXT,
            status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
            created_at VARCHAR(64)
          )
        `),
        db.execute(`
          CREATE TABLE IF NOT EXISTS loans (
            id VARCHAR(64) PRIMARY KEY,
            loan_id VARCHAR(64) NOT NULL,
            customer_id VARCHAR(64) NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            loan_type VARCHAR(64) NOT NULL,
            amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
            interest_rate DECIMAL(6, 2) NOT NULL DEFAULT 0,
            tenure_months INT NOT NULL DEFAULT 12,
            monthly_emi DECIMAL(15, 2) NOT NULL DEFAULT 0,
            total_payable DECIMAL(15, 2) NOT NULL DEFAULT 0,
            total_interest DECIMAL(15, 2) NOT NULL DEFAULT 0,
            amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
            status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
            purpose TEXT,
            rejection_reason TEXT,
            disbursed_to_account_id VARCHAR(64),
            applied_at VARCHAR(64),
            approved_at VARCHAR(64),
            disbursed_at VARCHAR(64),
            repayments_json LONGTEXT
          )
        `),
        db.execute(`
          CREATE TABLE IF NOT EXISTS fixed_deposits (
            id VARCHAR(64) PRIMARY KEY,
            fd_number VARCHAR(64) NOT NULL,
            customer_id VARCHAR(64) NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            linked_account_id VARCHAR(64) NOT NULL,
            principal_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
            interest_rate DECIMAL(6, 2) NOT NULL DEFAULT 0,
            tenure_months INT NOT NULL DEFAULT 12,
            maturity_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
            total_interest DECIMAL(15, 2) NOT NULL DEFAULT 0,
            status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
            start_date VARCHAR(64),
            maturity_date VARCHAR(64)
          )
        `),
        db.execute(`
          CREATE TABLE IF NOT EXISTS beneficiaries (
            id VARCHAR(64) PRIMARY KEY,
            customer_id VARCHAR(64) NOT NULL,
            beneficiary_name VARCHAR(255) NOT NULL,
            account_number VARCHAR(64) NOT NULL,
            bank_name VARCHAR(255),
            ifsc_code VARCHAR(64),
            email VARCHAR(255),
            phone VARCHAR(64),
            created_at VARCHAR(64)
          )
        `),
        db.execute(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL,
            user_name VARCHAR(255) NOT NULL,
            action VARCHAR(128) NOT NULL,
            description TEXT,
            ip_address VARCHAR(64),
            status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
            created_at VARCHAR(64)
          )
        `),
        db.execute(`
          CREATE TABLE IF NOT EXISTS notifications (
            id VARCHAR(64) PRIMARY KEY,
            user_id VARCHAR(64) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT,
            is_read TINYINT(1) NOT NULL DEFAULT 0,
            created_at VARCHAR(64),
            type VARCHAR(64) NOT NULL DEFAULT 'SYSTEM'
          )
        `),
      ]);

      // Ensure default Admin user exists if users table is empty
      const existingUsers = await queryRows<{ cnt: number | string }>('SELECT COUNT(*) as cnt FROM users');
      if (Number(existingUsers[0]?.cnt || 0) === 0) {
        await db.execute(
          `INSERT INTO users (id, username, email, first_name, last_name, role, phone, is_verified, password)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ['user-admin', 'admin', 'admin@apexbank.com', 'Admin', '', 'ADMIN', '', 1, 'admin123']
        );
      }

      dbReady = true;
      dbError = null;
      console.log(`[Database] Connected to TiDB Cloud MySQL (${parsedUrl.hostname}:${parsedUrl.port || 4000}/${ACTIVE_DB})`);
    } catch (err: any) {
      dbError = err?.message || String(err);
      console.error('[Database] Initialization error:', dbError);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Trigger DB init in background immediately on startup
  initDatabase();

  // Database health & connection status endpoint
  app.get('/api/db/status', async (_req, res) => {
    try {
      if (!dbReady) await initDatabase();
      const versionRows = await queryRows<{ version: string }>('SELECT VERSION() as version');
      res.json({
        connected: true,
        host: parsedUrl.hostname,
        port: Number(parsedUrl.port) || 4000,
        database: ACTIVE_DB,
        version: versionRows[0]?.version || 'TiDB MySQL',
      });
    } catch (err: any) {
      res.status(500).json({
        connected: false,
        error: err?.message || String(err),
      });
    }
  });

  // Load full state from TiDB Cloud MySQL
  app.get('/api/state', async (_req, res) => {
    if (!dbReady) {
      await initDatabase();
    }
    try {
      const [
        usersRows,
        branchesRows,
        staffRows,
        customersRows,
        accountsRows,
        txnsRows,
        loansRows,
        fdsRows,
        bensRows,
        logsRows,
        notifsRows,
      ] = await Promise.all([
        queryRows('SELECT * FROM users'),
        queryRows('SELECT * FROM branches'),
        queryRows('SELECT * FROM staff ORDER BY joined_at DESC'),
        queryRows('SELECT * FROM customers ORDER BY created_at DESC'),
        queryRows('SELECT * FROM accounts ORDER BY created_at DESC'),
        queryRows('SELECT * FROM transactions ORDER BY created_at DESC'),
        queryRows('SELECT * FROM loans ORDER BY applied_at DESC'),
        queryRows('SELECT * FROM fixed_deposits ORDER BY start_date DESC'),
        queryRows('SELECT * FROM beneficiaries ORDER BY created_at DESC'),
        queryRows('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200'),
        queryRows('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100'),
      ]);

      res.json({
        users: usersRows.map((r) => ({
          id: r.id,
          username: r.username,
          email: r.email,
          firstName: r.first_name,
          lastName: r.last_name,
          role: r.role,
          phone: r.phone,
          isVerified: Boolean(Number(r.is_verified)),
          password: r.password,
        })),
        branches: branchesRows.map((r) => ({
          id: r.id,
          name: r.name,
          branchCode: r.branch_code,
          ifscCode: r.ifsc_code,
          address: r.address || '',
          city: r.city || '',
          state: r.state || '',
          phone: r.phone || '',
          email: r.email || '',
          managerName: r.manager_name || '',
          isActive: Boolean(Number(r.is_active)),
        })),
        staff: staffRows.map((r) => ({
          id: r.id,
          employeeId: r.employee_id,
          userId: r.user_id,
          fullName: r.full_name,
          email: r.email,
          phone: r.phone || '',
          branchId: r.branch_id || '',
          branchName: r.branch_name || '',
          department: r.department || '',
          designation: r.designation || '',
          approvalLimit: Number(r.approval_limit),
          status: r.status,
          joinedAt: r.joined_at || '',
          password: r.password || '',
        })),
        customers: customersRows.map((r) => ({
          id: r.id,
          customerId: r.customer_id,
          userId: r.user_id,
          fullName: r.full_name,
          email: r.email,
          phone: r.phone || '',
          dateOfBirth: r.date_of_birth || '',
          gender: r.gender || 'Male',
          idType: r.id_type || 'Passport',
          idNumber: r.id_number || '',
          address: r.address || '',
          city: r.city || '',
          state: r.state || '',
          occupation: r.occupation || '',
          annualIncome: Number(r.annual_income),
          branchId: r.branch_id || '',
          branchName: r.branch_name || '',
          kycStatus: r.kyc_status,
          createdAt: r.created_at || '',
        })),
        accounts: accountsRows.map((r) => ({
          id: r.id,
          accountNumber: r.account_number,
          customerId: r.customer_id,
          customerName: r.customer_name,
          accountType: r.account_type,
          currency: r.currency || 'USD',
          balance: Number(r.balance),
          minimumBalance: Number(r.minimum_balance),
          interestRate: Number(r.interest_rate),
          status: r.status,
          dailyTransferLimit: Number(r.daily_transfer_limit),
          createdAt: r.created_at || '',
        })),
        transactions: txnsRows.map((r) => ({
          id: r.id,
          referenceId: r.reference_id,
          accountId: r.account_id,
          accountNumber: r.account_number,
          customerName: r.customer_name,
          recipientAccountId: r.recipient_account_id || undefined,
          recipientAccountNumber: r.recipient_account_number || undefined,
          recipientCustomerName: r.recipient_customer_name || undefined,
          type: r.type,
          amount: Number(r.amount),
          balanceAfter: Number(r.balance_after),
          description: r.description || '',
          status: r.status,
          createdAt: r.created_at || '',
        })),
        loans: loansRows.map((r) => ({
          id: r.id,
          loanId: r.loan_id,
          customerId: r.customer_id,
          customerName: r.customer_name,
          loanType: r.loan_type,
          amount: Number(r.amount),
          interestRate: Number(r.interest_rate),
          tenureMonths: Number(r.tenure_months),
          monthlyEmi: Number(r.monthly_emi),
          totalPayable: Number(r.total_payable),
          totalInterest: Number(r.total_interest),
          amountPaid: Number(r.amount_paid),
          status: r.status,
          purpose: r.purpose || '',
          rejectionReason: r.rejection_reason || undefined,
          disbursedToAccountId: r.disbursed_to_account_id || undefined,
          appliedAt: r.applied_at || '',
          approvedAt: r.approved_at || undefined,
          disbursedAt: r.disbursed_at || undefined,
          repayments: r.repayments_json ? JSON.parse(r.repayments_json) : [],
        })),
        fixedDeposits: fdsRows.map((r) => ({
          id: r.id,
          fdNumber: r.fd_number,
          customerId: r.customer_id,
          customerName: r.customer_name,
          linkedAccountId: r.linked_account_id,
          principalAmount: Number(r.principal_amount),
          interestRate: Number(r.interest_rate),
          tenureMonths: Number(r.tenure_months),
          maturityAmount: Number(r.maturity_amount),
          totalInterest: Number(r.total_interest),
          status: r.status,
          startDate: r.start_date || '',
          maturityDate: r.maturity_date || '',
        })),
        beneficiaries: bensRows.map((r) => ({
          id: r.id,
          customerId: r.customer_id,
          beneficiaryName: r.beneficiary_name,
          accountNumber: r.account_number,
          bankName: r.bank_name || '',
          ifscCode: r.ifsc_code || '',
          email: r.email || undefined,
          phone: r.phone || undefined,
          createdAt: r.created_at || '',
        })),
        auditLogs: logsRows.map((r) => ({
          id: r.id,
          userId: r.user_id,
          userName: r.user_name,
          action: r.action,
          description: r.description || '',
          ipAddress: r.ip_address || '127.0.0.1',
          status: r.status,
          createdAt: r.created_at || '',
        })),
        notifications: notifsRows.map((r) => ({
          id: r.id,
          userId: r.user_id,
          title: r.title,
          message: r.message || '',
          isRead: Boolean(Number(r.is_read)),
          createdAt: r.created_at || '',
          type: r.type || 'SYSTEM',
        })),
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // Batch sync multiple collections in a single HTTP request
  app.post('/api/sync-batch', async (req, res) => {
    if (!dbReady) {
      await initDatabase();
    }
    const collections = req.body?.collections;
    const allowEmptyDelete = Boolean(req.body?.allowEmptyDelete);
    if (!collections || typeof collections !== 'object') {
      res.status(400).json({ error: 'Invalid collections payload' });
      return;
    }

    try {
      await Promise.all(
        Object.entries(collections).map(([col, items]) =>
          syncCollection(col, Array.isArray(items) ? items : [], allowEmptyDelete)
        )
      );
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  // Single collection sync endpoint
  app.post('/api/sync/:collection', async (req, res) => {
    if (!dbReady) {
      await initDatabase();
    }
    const { collection } = req.params;
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const allowEmptyDelete = req.body?.allowEmptyDelete !== false;

    try {
      await syncCollection(collection, items, allowEmptyDelete);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || String(err) });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
