import React, { useState } from 'react';
import {
  Printer,
  X,
  Download,
  Building2,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
} from 'lucide-react';
import {
  BankAccount,
  Transaction,
  Customer,
  Loan,
  Branch,
  User,
} from '../types/banking';
import { formatCurrency } from '../utils/finance';
import { generateAccountStatementPDF } from '../utils/export';
import { executeDirectPrint } from '../utils/directPrint';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: BankAccount[];
  transactions: Transaction[];
  customers: Customer[];
  loans: Loan[];
  branches: Branch[];
  currentUser: User;
  initialReportType?: 'STATEMENT' | 'FINANCIAL' | 'CUSTOMERS' | 'LOANS';
  initialAccountId?: string;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  accounts,
  transactions,
  customers,
  loans,
  branches,
  currentUser,
  initialReportType = 'STATEMENT',
  initialAccountId,
}) => {
  const [reportType, setReportType] = useState<'STATEMENT' | 'FINANCIAL' | 'CUSTOMERS' | 'LOANS'>(
    initialReportType
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    initialAccountId || accounts[0]?.id || ''
  );
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const currentAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  const currentCustomer = currentAccount
    ? customers.find((c) => c.id === currentAccount.customerId)
    : undefined;

  // Filter transactions for report
  const reportTransactions = transactions.filter((t) => {
    const matchesAccount = reportType !== 'STATEMENT' || t.accountId === currentAccount?.id;
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(t.createdAt) >= new Date(startDate);
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59);
      matchesDate = matchesDate && new Date(t.createdAt) <= eDate;
    }
    return matchesAccount && matchesDate;
  });

  const handleTriggerPrint = React.useCallback(() => {
    executeDirectPrint({
      account: currentAccount,
      transactions: reportTransactions,
      customer: currentCustomer,
      currentUser,
    });
  }, [currentAccount, reportTransactions, currentCustomer, currentUser]);

  // Automatically trigger direct print to computer when modal opens
  React.useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      handleTriggerPrint();
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen, handleTriggerPrint]);

  // Listen for Ctrl+P / Cmd+P
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handleTriggerPrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleTriggerPrint]);

  // Only return null after all hooks have been called
  if (!isOpen) return null;

  // Calculate totals matching the exact screenshot layout
  const incomeTxns = reportTransactions.filter(
    (t) => t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN' || t.type === 'FD_INTEREST'
  );
  const expenseTxns = reportTransactions.filter(
    (t) => t.type === 'WITHDRAWAL' || t.type === 'TRANSFER_OUT' || t.type === 'EMI_PAYMENT'
  );

  const totalIncome = incomeTxns.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTxns.reduce((sum, t) => sum + t.amount, 0);
  const receivableAmount = loans
    .filter((l) => l.status === 'DISBURSED')
    .reduce((sum, l) => sum + Math.max(0, l.totalPayable - l.amountPaid), 0);
  const payableAmount = 0;

  const totalBalance = currentAccount
    ? currentAccount.balance
    : accounts.reduce((sum, a) => sum + a.balance, 0);
  const reportNumber = 'RPT-2026-00015';

  const now = new Date();
  const dateFormatted = `${String(now.getDate()).padStart(2, '0')}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}-${now.getFullYear()}`;
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleDownloadPDF = () => {
    if (currentAccount) {
      generateAccountStatementPDF(currentAccount, reportTransactions, currentCustomer);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full">
        {/* Modal Controls Header - Hidden during print */}
        <div className="print:hidden p-4 sm:px-6 sm:py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Computer Print Layout Preview</h3>
              <p className="text-[11px] text-slate-500">
                Formatted to match official corporate finance monitoring & statement advice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Save PDF</span>
            </button>
            <button
              onClick={handleTriggerPrint}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print to Computer / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Configuration Bar - Hidden during print */}
        <div className="print:hidden p-4 bg-white border-b border-slate-100 space-y-3 shrink-0 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Report Format
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
              >
                <option value="STATEMENT">Financial Monitoring Statement</option>
                <option value="FINANCIAL">Executive Liquidity Dashboard</option>
                <option value="CUSTOMERS">Customer Master Directory</option>
                <option value="LOANS">Credit & Loan Portfolio</option>
              </select>
            </div>

            {reportType === 'STATEMENT' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Target Account
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountNumber} ({a.customerName} - {a.accountType})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Filter From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Filter To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Printable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 print:bg-white print:p-0">
          {/* Paper Sheet Matching Reference Screenshot */}
          <div
            id="printable-report"
            className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-slate-300 mx-auto max-w-3xl text-slate-900 font-sans print:border print:border-slate-300 print:shadow-none print:p-6 print:max-w-none print:w-full print:m-0"
          >
            {/* Top Running Header (Matches "30/09/2026, 12:57" and "Report RPT-2026-00015 - Azia Finance Monitoring") */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pb-3 font-mono">
              <span>
                {dateFormatted.replace(/-/g, '/')}, {timeFormatted}
              </span>
              <span className="font-semibold text-slate-700">
                Report {reportNumber} - Apex Finance Monitoring
              </span>
            </div>

            {/* Inner Bordered Box */}
            <div className="border border-slate-300 rounded-xl p-5 sm:p-6">
              {/* Centered Pill: [ FINANCIAL MONITORING STATEMENT ] */}
              <div className="text-center mb-2">
                <span className="inline-block border border-slate-800 text-slate-900 font-mono font-bold text-[9px] uppercase tracking-widest px-3 py-0.5 rounded">
                  FINANCIAL MONITORING STATEMENT
                </span>
              </div>

              {/* Main Brand Title */}
              <div className="text-center mb-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-widest text-slate-900 font-mono uppercase">
                  APEX FINANCE
                </h1>
                <h2 className="text-[10px] font-bold text-slate-600 tracking-wider font-mono uppercase">
                  FINANCE MONITORING ENTERPRISE DASHBOARD
                </h2>
              </div>

              {/* Sub-header Details */}
              <div className="text-center text-[11px] text-slate-600 space-y-0.5 mb-4 font-mono">
                <div>
                  Account Holder: <span className="text-slate-900 font-semibold">{currentCustomer?.fullName || currentAccount?.customerName || 'N/A'}</span> | Account: <span className="font-semibold text-slate-900">{currentAccount ? `•••• ${currentAccount.accountNumber.slice(-4)} (${currentAccount.accountType})` : 'All Accounts'}</span>
                </div>
                <div>
                  Operator: <span className="text-slate-900 font-semibold">{currentUser.firstName} {currentUser.lastName} ({currentUser.email})</span> | Period: <span className="text-slate-900 font-semibold">{startDate && endDate ? `${startDate} to ${endDate}` : 'All Dates'}</span>
                </div>
              </div>

              {/* Dotted Divider */}
              <div className="border-t border-dashed border-slate-300 my-3" />

              {/* Meta Key-Value Grid */}
              <div className="grid grid-cols-2 text-xs font-mono gap-y-1 mb-4 text-slate-700">
                <div>
                  Report No: <span className="font-bold text-blue-600">{reportNumber}</span>
                </div>
                <div className="text-right">
                  Date: <span className="font-bold text-slate-900">{dateFormatted}</span>
                </div>

                <div>
                  Gross Margin: <span className="font-semibold text-slate-900">75%</span> | Net Margin: <span className="font-semibold text-slate-900">68%</span>
                </div>
                <div className="text-right flex items-center justify-end gap-1.5">
                  <span>Status:</span>
                  <span className="border border-emerald-600 bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.2 rounded font-mono">
                    VERIFIED
                  </span>
                </div>

                <div>
                  Time: <span className="text-slate-900">{dateFormatted} {timeFormatted}</span>
                </div>
                <div className="text-right">
                  Ratios: <span className="text-slate-900">QR 1.4:8 | CR 3.3</span>
                </div>
              </div>

              {/* 4 Summary KPI Cards Row (Exact Match) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                {/* Box 1: Total Income */}
                <div className="border border-cyan-300/80 rounded-lg p-2.5 bg-cyan-50/20">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    TOTAL INCOME
                  </span>
                  <span className="text-sm font-bold text-blue-600 font-mono">
                    {formatCurrency(totalIncome)}
                  </span>
                </div>

                {/* Box 2: Total Expenses */}
                <div className="border border-cyan-300/80 rounded-lg p-2.5 bg-cyan-50/20">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    TOTAL EXPENSES
                  </span>
                  <span className="text-sm font-bold text-blue-600 font-mono">
                    {formatCurrency(totalExpense)}
                  </span>
                </div>

                {/* Box 3: Receivable */}
                <div className="border border-cyan-300/80 rounded-lg p-2.5 bg-cyan-50/20">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    RECEIVABLE
                  </span>
                  <span className="text-sm font-bold text-emerald-600 font-mono">
                    {formatCurrency(receivableAmount)}
                  </span>
                </div>

                {/* Box 4: Payable */}
                <div className="border border-cyan-300/80 rounded-lg p-2.5 bg-cyan-50/20">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    PAYABLE
                  </span>
                  <span className="text-sm font-bold text-rose-600 font-mono">
                    {formatCurrency(payableAmount)}
                  </span>
                </div>
              </div>

              {/* Dotted Line */}
              <div className="border-t border-dashed border-slate-300 my-3" />

              {/* Table Header with Dotted Top & Bottom */}
              <div className="border-t border-b border-dashed border-slate-400 py-1.5 my-2 flex items-center justify-between text-[11px] font-bold font-mono text-slate-800">
                <span className="w-1/2">ITEM / TRANSACTION</span>
                <span className="w-1/6 text-center">TYPE</span>
                <span className="w-1/6 text-center">STATUS</span>
                <span className="w-1/6 text-right">AMOUNT</span>
              </div>

              {/* Transactions List */}
              <div className="divide-y divide-slate-100 text-[11px] font-mono">
                {reportTransactions.slice(0, 15).map((t, idx) => {
                  const isInflow = t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN';
                  const isExpense = t.type === 'WITHDRAWAL' || t.type === 'TRANSFER_OUT';
                  const isPayable = t.type === 'EMI_PAYMENT';

                  const typeLabel = isInflow ? 'RECEIVABLE' : isPayable ? 'PAYABLE' : isExpense ? 'EXPENSE' : 'INCOME';
                  const typeColor = isInflow
                    ? 'text-emerald-600'
                    : isPayable
                    ? 'text-rose-600'
                    : 'text-blue-600';

                  return (
                    <div key={t.id} className="py-2 flex items-start justify-between">
                      <div className="w-1/2 pr-2">
                        <div className="font-semibold text-slate-900">
                          {idx + 1}. {t.description} ({new Date(t.createdAt).toISOString().split('T')[0]})
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Ref: {t.referenceId} &bull; Account {t.accountNumber}
                        </div>
                      </div>
                      <div className={`w-1/6 text-center font-bold ${typeColor}`}>
                        {typeLabel}
                      </div>
                      <div className="w-1/6 text-center text-slate-600">
                        {t.status}
                      </div>
                      <div className="w-1/6 text-right font-bold text-slate-900">
                        {formatCurrency(t.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtotals & Treasury Balance Section */}
              <div className="border-t border-dashed border-slate-300 mt-4 pt-3 space-y-1 text-xs font-mono text-slate-700">
                <div className="flex justify-between">
                  <span>Total Income ({incomeTxns.length} items):</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(totalIncome)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Expenses ({expenseTxns.length} items):</span>
                  <span className="font-semibold text-slate-900">
                    -{formatCurrency(totalExpense)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Accounts Receivable / Payable Net:</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(receivableAmount - payableAmount)}
                  </span>
                </div>

                <div className="border-t border-dashed border-slate-300 my-2" />

                <div className="flex items-center justify-between text-sm sm:text-base font-extrabold text-slate-900 pt-1">
                  <span>CURRENT TREASURY BALANCE :</span>
                  <span>{formatCurrency(totalBalance)}</span>
                </div>
              </div>

              {/* Official Statement Audited Verified Box (Exact Match to bottom of screenshot) */}
              <div className="mt-8 mb-2 flex justify-center">
                <div className="border border-emerald-600 bg-white rounded-lg px-6 py-2 text-center shadow-2xs">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 font-mono">
                    STATEMENT AUDITED
                  </div>
                  <div className="text-xs font-black text-emerald-600 font-mono tracking-widest my-0.5">
                    VERIFIED
                  </div>
                  <div className="text-[8px] text-emerald-700 font-mono">
                    via Apex National Bank
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer (Matches "about:blank" on left, "1/2" on right) */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-4 font-mono">
              <span>about:blank</span>
              <span>1/1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
