import React, { useState } from 'react';
import {
  Wallet,
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  FileText,
  X,
  CreditCard,
  Building,
} from 'lucide-react';
import { BankAccount, Customer, AccountType, AccountStatus } from '../types/banking';
import { formatCurrency } from '../utils/finance';
import { TypeableSelect } from './TypeableSelect';

interface AccountManagementProps {
  accounts: BankAccount[];
  customers: Customer[];
  onOpenAccount: (
    customerId: string,
    accountType: AccountType,
    initialDeposit: number,
    interestRate: number
  ) => void;
  onNavigateToTransfer: () => void;
  onNavigateToStatement: (accountId: string) => void;
  defaultCustomerFilterId?: string;
}

export const AccountManagement: React.FC<AccountManagementProps> = ({
  accounts,
  customers,
  onOpenAccount,
  onNavigateToTransfer,
  onNavigateToStatement,
  defaultCustomerFilterId,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showOpenModal, setShowOpenModal] = useState(!!defaultCustomerFilterId);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    defaultCustomerFilterId || (customers[0]?.id || '')
  );
  const [accountType, setAccountType] = useState<AccountType>('SAVINGS');
  const [initialDeposit, setInitialDeposit] = useState<number>(500);
  const [interestRate, setInterestRate] = useState<number>(4.0);
  const [formError, setFormError] = useState<string>('');

  const handleAccountTypeChange = (type: AccountType) => {
    setAccountType(type);
    if (type === 'SAVINGS') {
      setInitialDeposit(500);
      setInterestRate(4.0);
    } else if (type === 'CURRENT') {
      setInitialDeposit(1000);
      setInterestRate(0.0);
    } else if (type === 'FIXED_DEPOSIT') {
      setInitialDeposit(2500);
      setInterestRate(6.5);
    } else {
      setInitialDeposit(200);
      setInterestRate(5.8);
    }
  };

  const effectiveCustomerId = selectedCustomerId || defaultCustomerFilterId || customers[0]?.id || '';

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const minRequired = accountType === 'CURRENT' ? 500 : 100;
    if (initialDeposit < minRequired) {
      setFormError(`Initial deposit must be at least minimum balance of ${formatCurrency(minRequired)}.`);
      return;
    }

    try {
      onOpenAccount(effectiveCustomerId, accountType, initialDeposit, interestRate);
      setShowOpenModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to open account');
    }
  };

  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch =
      a.accountNumber.includes(search) ||
      a.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || a.accountType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Account Management</h2>
          <p className="text-xs text-slate-500">
            Savings, checking, term deposit ledgers, minimum balance enforcement and limits
          </p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setShowOpenModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white flex items-center gap-1.5 shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Open New Account</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by account number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
          >
            <option value="ALL">All Account Classes</option>
            <option value="SAVINGS">Savings Accounts</option>
            <option value="CURRENT">Current / Checking</option>
            <option value="FIXED_DEPOSIT">Fixed Deposits</option>
            <option value="RECURRING_DEPOSIT">Recurring Deposits</option>
          </select>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map((acc) => {
          const available = Math.max(0, acc.balance - acc.minimumBalance);
          return (
            <div
              key={acc.id}
              className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {acc.accountType.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {acc.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{acc.customerName}</h4>
                <div className="font-mono text-xs text-slate-500 mt-0.5">#{acc.accountNumber}</div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 block">Total Ledger Balance</span>
                  <div className="text-2xl font-bold text-slate-900">{formatCurrency(acc.balance)}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Available: <strong className="text-emerald-600">{formatCurrency(available)}</strong></span>
                    <span>Min: {formatCurrency(acc.minimumBalance)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">APY: {acc.interestRate}%</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateToStatement(acc.id)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Statement &rarr;
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAccounts.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200">
          No bank accounts found matching criteria.
        </div>
      )}

      {/* Open Account Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Open New Bank Account</h3>
              </div>
              <button
                onClick={() => setShowOpenModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer *</label>
                <TypeableSelect
                  required
                  allowCustom={false}
                  value={effectiveCustomerId}
                  onChange={(val) => setSelectedCustomerId(val)}
                  placeholder="Type or select customer"
                  options={customers.map((c) => ({
                    value: c.id,
                    label: `${c.fullName} (${c.customerId}) - ${c.email}`,
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Class *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['SAVINGS', 'CURRENT', 'FIXED_DEPOSIT', 'RECURRING_DEPOSIT'] as AccountType[]).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => handleAccountTypeChange(type)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition ${
                        accountType === type
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Deposit ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={accountType === 'CURRENT' ? 500 : 100}
                    step="any"
                    placeholder="Enter initial deposit"
                    value={initialDeposit === 0 ? '' : initialDeposit}
                    onChange={(e) =>
                      setInitialDeposit(e.target.value === '' ? 0 : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Min required: {accountType === 'CURRENT' ? '$500.00' : '$100.00'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Enter interest rate"
                    value={interestRate === 0 && accountType !== 'CURRENT' ? '' : interestRate}
                    onChange={(e) =>
                      setInterestRate(e.target.value === '' ? 0 : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm"
                >
                  Confirm & Open Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
