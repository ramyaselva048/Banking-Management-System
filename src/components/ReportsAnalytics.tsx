import React from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  FileDown,
  PieChart,
  TrendingUp,
  ShieldCheck,
  Building,
  Users,
  Coins,
  Wallet,
  Printer,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Transaction, BankAccount, Customer, Loan, Branch } from '../types/banking';
import {
  exportTransactionsToExcel,
  exportCustomersToExcel,
  exportLoansToExcel,
} from '../utils/export';
import { formatCurrency } from '../utils/finance';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ReportsAnalyticsProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  customers: Customer[];
  loans: Loan[];
  branches: Branch[];
  onOpenPrintReport?: () => void;
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
  transactions,
  accounts,
  customers,
  loans,
  branches,
  onOpenPrintReport,
}) => {
  // Compute totals
  const totalAssets = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalLoans = loans.reduce((sum, l) => sum + l.amount, 0);
  const totalDeposits = transactions
    .filter((t) => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions
    .filter((t) => t.type === 'WITHDRAWAL')
    .reduce((sum, t) => sum + t.amount, 0);

  // Branch balances
  const branchLabels = branches.map((b) => b.name.replace('Apex ', '').slice(0, 16));
  const branchData = branches.map((b) => {
    const branchCustomerIds = customers.filter((c) => c.branchId === b.id).map((c) => c.id);
    return accounts
      .filter((a) => branchCustomerIds.includes(a.customerId))
      .reduce((sum, a) => sum + a.balance, 0);
  });

  const branchChartData = {
    labels: branchLabels,
    datasets: [
      {
        label: 'Branch Liquid Assets ($)',
        data: branchData,
        backgroundColor: '#2563EB',
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reports & Financial Analytics</h2>
          <p className="text-xs text-slate-500">
            Executive liquidity telemetry, branch balance distribution, and multi-format document export
          </p>
        </div>
        {onOpenPrintReport && (
          <button
            onClick={onOpenPrintReport}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Report</span>
          </button>
        )}
      </div>

      {/* Export Hub Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Transactions Ledger</h4>
            <p className="text-xs text-slate-500 mt-1">
              Formatted Excel spreadsheet containing complete audit trails, timestamps, and balances.
            </p>
          </div>
          <button
            onClick={() => exportTransactionsToExcel(transactions)}
            className="mt-4 w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white flex items-center justify-center gap-1.5 shadow-2xs transition"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Transactions (.xlsx)</span>
          </button>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Customer Master Roster</h4>
            <p className="text-xs text-slate-500 mt-1">
              Export verified KYC client directories, assigned branches, and contact files.
            </p>
          </div>
          <button
            onClick={() => exportCustomersToExcel(customers)}
            className="mt-4 w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white flex items-center justify-center gap-1.5 shadow-2xs transition"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Customers (.xlsx)</span>
          </button>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Coins className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Credit & Loan Portfolio</h4>
            <p className="text-xs text-slate-500 mt-1">
              Loan amortization records, interest receivables, and repayment performance.
            </p>
          </div>
          <button
            onClick={() => exportLoansToExcel(loans)}
            className="mt-4 w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 font-semibold text-xs text-white flex items-center justify-center gap-1.5 shadow-2xs transition"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Loan Book (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Capital Inflow vs Outflow Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            TOTAL CAPITAL IN BANK
          </span>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalAssets)}</div>
          <span className="text-xs text-emerald-600 font-medium">Liquid & Reserves</span>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            LIFETIME DEPOSITS
          </span>
          <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalDeposits)}</div>
          <span className="text-xs text-slate-500">Gross counter inflow</span>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            LIFETIME WITHDRAWALS
          </span>
          <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalWithdrawals)}</div>
          <span className="text-xs text-slate-500">Disbursements & cash out</span>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            NET LIQUIDITY SURPLUS
          </span>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalDeposits - totalWithdrawals)}
          </div>
          <span className="text-xs text-slate-500">Positive reserves</span>
        </div>
      </div>

      {/* Branch Liquidity Chart */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Branch Liquidity Allocation</h3>
            <p className="text-xs text-slate-500">Total customer deposits held per registered branch hub</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            Chart.js Real-Time
          </span>
        </div>
        <div className="h-64">
          <Bar
            data={branchChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              scales: {
                y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};
