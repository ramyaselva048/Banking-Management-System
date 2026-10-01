import React, { useState } from 'react';
import {
  History,
  FileSpreadsheet,
  FileDown,
  Printer,
  Search,
  Filter,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { Transaction, BankAccount, Customer, TransactionType } from '../types/banking';
import { exportTransactionsToExcel, generateAccountStatementPDF } from '../utils/export';
import { formatCurrency } from '../utils/finance';
import { TypeableSelect } from './TypeableSelect';

interface TransactionsStatementProps {
  transactions: Transaction[];
  accounts: BankAccount[];
  customers: Customer[];
  selectedAccountId?: string;
  onOpenPrintReport?: (accountId?: string) => void;
}

export const TransactionsStatement: React.FC<TransactionsStatementProps> = ({
  transactions,
  accounts,
  customers,
  selectedAccountId: initialAccountId,
  onOpenPrintReport,
}) => {
  const [selectedAccId, setSelectedAccId] = useState<string>(initialAccountId || 'ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const currentAccount = accounts.find((a) => a.id === selectedAccId);
  const currentCustomer = currentAccount
    ? customers.find((c) => c.id === currentAccount.customerId)
    : undefined;

  const filteredTransactions = transactions.filter((t) => {
    const matchesAccount = selectedAccId === 'ALL' || t.accountId === selectedAccId;
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchesSearch =
      t.referenceId.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.accountNumber.includes(search);

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(t.createdAt) >= new Date(startDate);
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23, 59, 59);
      matchesDate = matchesDate && new Date(t.createdAt) <= eDate;
    }

    return matchesAccount && matchesType && matchesSearch && matchesDate;
  });

  const handleExportPDF = () => {
    if (currentAccount) {
      generateAccountStatementPDF(currentAccount, filteredTransactions, currentCustomer);
    } else {
      // Default to first account or alert
      if (accounts[0]) {
        generateAccountStatementPDF(accounts[0], filteredTransactions, customers[0]);
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Passbook & Statements</h2>
          <p className="text-xs text-slate-500">
            Real-time financial audit trail, transaction statements, and document export
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportTransactionsToExcel(filteredTransactions)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
            title="Download formatted .xlsx workbook"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-white flex items-center gap-1.5 shadow-sm transition"
            title="Generate official branded PDF statement"
          >
            <FileDown className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={() => {
              if (onOpenPrintReport) {
                onOpenPrintReport(selectedAccId !== 'ALL' ? selectedAccId : undefined);
              } else {
                window.print();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-sm transition"
            title="Open printable official statement report"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Account Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filter by Account</label>
            <TypeableSelect
              allowCustom={false}
              value={selectedAccId}
              onChange={(val) => setSelectedAccId(val)}
              placeholder="Type or select account..."
              options={[
                { value: 'ALL', label: 'All Bank Accounts' },
                ...accounts.map((a) => ({
                  value: a.id,
                  label: `${a.accountNumber} (${a.customerName}) — ${a.accountType}`,
                })),
              ]}
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Transaction Category</label>
            <TypeableSelect
              allowCustom={false}
              value={typeFilter}
              onChange={(val) => setTypeFilter(val)}
              placeholder="Type or select category..."
              options={[
                { value: 'ALL', label: 'All Categories' },
                { value: 'DEPOSIT', label: 'Cash Deposit' },
                { value: 'WITHDRAWAL', label: 'Cash Withdrawal' },
                { value: 'TRANSFER_IN', label: 'Transfer Received' },
                { value: 'TRANSFER_OUT', label: 'Transfer Sent' },
                { value: 'LOAN_DISBURSEMENT', label: 'Loan Disbursement' },
                { value: 'EMI_PAYMENT', label: 'Loan EMI Repayment' },
                { value: 'FD_INTEREST', label: 'FD Interest / Payout' },
              ]}
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800"
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Reference ID (e.g. TXN-100234), description, or recipient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs"
          />
        </div>
      </div>

      {/* Selected Account Summary Header if filtered */}
      {currentAccount && (
        <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">
              {currentAccount.accountType.replace('_', ' ')}
            </span>
            <div className="font-bold text-base mt-1">{currentAccount.customerName}</div>
            <div className="font-mono text-xs text-slate-400">Account #{currentAccount.accountNumber}</div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Current Ledger Balance</span>
            <span className="text-2xl font-bold">{formatCurrency(currentAccount.balance)}</span>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Debit / Credit</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTransactions.map((t) => {
                const isInflow = t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN';
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.referenceId}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono">{t.accountNumber}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isInflow
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {t.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-sm truncate" title={t.description}>
                      {t.description}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                        isInflow ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isInflow ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {formatCurrency(t.balanceAfter)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (onOpenPrintReport) {
                            onOpenPrintReport(t.accountId);
                          } else {
                            window.print();
                          }
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-blue-600 transition"
                        title="Print official transaction advice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No transactions found for the specified filters.
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
