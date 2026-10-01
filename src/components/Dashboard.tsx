import React from 'react';
import {
  Wallet,
  Coins,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  FileText,
  Printer,
  UserCheck,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  User,
  BankAccount,
  Transaction,
  Loan,
  Customer,
} from '../types/banking';
import { formatCurrency } from '../utils/finance';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardProps {
  currentUser: User;
  accounts: BankAccount[];
  transactions: Transaction[];
  loans: Loan[];
  customers: Customer[];
  onNavigate: (tab: string) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenTransfer: () => void;
  onOpenPrintReport?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  accounts,
  transactions,
  loans,
  customers,
  onNavigate,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
  onOpenPrintReport,
}) => {
  const isCustomer = currentUser.role === 'CUSTOMER';

  // Filter accounts for customer if customer role
  const displayAccounts = isCustomer
    ? accounts.filter((a) => a.customerName.toLowerCase().includes(currentUser.firstName.toLowerCase()))
    : accounts;

  const totalDeposits = displayAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalLoansDisbursed = loans
    .filter((l) => l.status === 'DISBURSED')
    .reduce((sum, l) => sum + l.amount, 0);
  const pendingLoans = loans.filter((l) => l.status === 'PENDING').length;

  // Chart data: 7-day cash flow computed from real transactions
  const last7DayDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const last7Days = last7DayDates.map((d) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );

  const inflowData = last7DayDates.map((d) => {
    const dateStr = d.toISOString().split('T')[0];
    return transactions
      .filter(
        (t) =>
          t.createdAt.startsWith(dateStr) &&
          (t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN' || t.type === 'LOAN_DISBURSEMENT' || t.type === 'FD_INTEREST')
      )
      .reduce((sum, t) => sum + t.amount, 0);
  });

  const outflowData = last7DayDates.map((d) => {
    const dateStr = d.toISOString().split('T')[0];
    return transactions
      .filter(
        (t) =>
          t.createdAt.startsWith(dateStr) &&
          (t.type === 'WITHDRAWAL' || t.type === 'TRANSFER_OUT' || t.type === 'EMI_PAYMENT')
      )
      .reduce((sum, t) => sum + t.amount, 0);
  });

  const cashFlowData = {
    labels: last7Days,
    datasets: [
      {
        label: 'Inflow / Deposits ($)',
        data: inflowData,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.35,
        fill: true,
      },
      {
        label: 'Outflow / Withdrawals ($)',
        data: outflowData,
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  // Doughnut: Account types distribution
  const savingsCount = accounts.filter((a) => a.accountType === 'SAVINGS').length;
  const currentCount = accounts.filter((a) => a.accountType === 'CURRENT').length;
  const fdCount = accounts.filter((a) => a.accountType === 'FIXED_DEPOSIT').length;

  const accountDistributionData = {
    labels: ['Savings Accounts', 'Current Accounts', 'Fixed Deposit'],
    datasets: [
      {
        data: [savingsCount, currentCount, fdCount],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {currentUser.role} PORTAL
              </span>
              <span className="text-xs text-slate-400">Apex National Bank Core System</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {currentUser.firstName} {currentUser.lastName}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              {isCustomer
                ? `You have ${displayAccounts.length} active banking accounts with a combined balance of ${formatCurrency(totalDeposits)}.`
                : `Executive banking operations dashboard with live ORM transactions, credit portfolios, and branch liquidity.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('staff')}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
                title="Manage and allocate bank staff members"
              >
                <UserCheck className="w-4 h-4" />
                <span>Allocate Staff</span>
              </button>
            )}
            {onOpenPrintReport && (
              <button
                onClick={onOpenPrintReport}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 flex items-center gap-1.5 transition"
                title="Print Official Financial Report"
              >
                <Printer className="w-4 h-4 text-blue-300" />
                <span>Print Report</span>
              </button>
            )}
            <button
              onClick={onOpenTransfer}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white flex items-center gap-1.5 shadow-sm transition"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Fund Transfer</span>
            </button>
            {currentUser.role !== 'CUSTOMER' ? (
              <>
                <button
                  onClick={onOpenDeposit}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                  <span>Deposit Cash</span>
                </button>
                <button
                  onClick={onOpenWithdraw}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <ArrowUpFromLine className="w-4 h-4 text-rose-400" />
                  <span>Withdraw Cash</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => onNavigate('loans')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Apply for Loan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Balance / Deposits */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              {isCustomer ? 'TOTAL BALANCE' : 'TOTAL DEPOSITS'}
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(totalDeposits)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Across {displayAccounts.length} active accounts</span>
          </div>
        </div>

        {/* Card 2: Loan Portfolio */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              {isCustomer ? 'ACTIVE LOANS' : 'DISBURSED LOANS'}
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(totalLoansDisbursed)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium">
            <span>{loans.filter((l) => l.status === 'DISBURSED').length} active loans</span>
          </div>
        </div>

        {/* Card 3: Customers Count */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              {isCustomer ? 'MY ACCOUNTS' : 'TOTAL CUSTOMERS'}
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {isCustomer ? displayAccounts.length : customers.length}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <span>Verified KYC Status</span>
          </div>
        </div>

        {/* Card 4: Pending Queue */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              PENDING LOANS
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 tracking-tight">
            {pendingLoans}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Awaiting credit review</span>
            {pendingLoans > 0 && !isCustomer && (
              <button
                onClick={() => onNavigate('loans')}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Review &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">7-Day Cash Liquidity Stream</h3>
              <p className="text-xs text-slate-500">Daily deposits vs withdrawals in real-time</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium border border-slate-200">
              Live Chart.js
            </span>
          </div>
          <div className="h-64">
            <Line
              data={cashFlowData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
                },
                scales: {
                  y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
                  x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                },
              }}
            />
          </div>
        </div>

        {/* Account Types Doughnut */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Deposit Product Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Portfolio breakdown by deposit account class</p>
            <div className="h-48 relative flex items-center justify-center">
              <Doughnut
                data={accountDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                  },
                }}
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Quarterly Interest Payout</span>
            <span className="font-semibold text-emerald-600">3.5% - 7.5%</span>
          </div>
        </div>
      </div>

      {/* Customer Accounts Quick Cards if Customer, or Recent Transactions Table */}
      {isCustomer && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">My Bank Accounts</h3>
            <button
              onClick={() => onNavigate('accounts')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              View Passbook &rarr;
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {acc.accountType.replace('_', ' ')}
                    </span>
                    <div className="font-mono text-xs text-slate-500 mt-1">Acc: {acc.accountNumber}</div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {acc.status}
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-xs text-slate-400">Available Balance</span>
                  <div className="text-2xl font-bold text-slate-900">{formatCurrency(acc.balance)}</div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Min. Balance: {formatCurrency(acc.minimumBalance)}</span>
                  <button
                    onClick={onOpenTransfer}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>Transfer Now</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Ledger Activity</h3>
            <p className="text-xs text-slate-500">Latest completed financial events</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            <span>Full History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Reference ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Balance After</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {transactions.slice(0, 7).map((txn) => {
                const isInflow = txn.type === 'DEPOSIT' || txn.type === 'TRANSFER_IN';
                return (
                  <tr key={txn.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{txn.referenceId}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(txn.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono">{txn.accountNumber}</td>
                    <td className="py-3 px-4 max-w-xs truncate" title={txn.description}>
                      <span className="font-medium text-slate-900">{txn.type.replace('_', ' ')}</span>
                      <span className="text-slate-500 ml-1.5">— {txn.description}</span>
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                        isInflow ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isInflow ? '+' : '-'}
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      {formatCurrency(txn.balanceAfter)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No ledger transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
