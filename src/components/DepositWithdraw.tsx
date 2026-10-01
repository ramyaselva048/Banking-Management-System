import React, { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { BankAccount, Transaction } from '../types/banking';
import { formatCurrency } from '../utils/finance';
import { TypeableSelect } from './TypeableSelect';

interface DepositWithdrawProps {
  mode: 'DEPOSIT' | 'WITHDRAW';
  accounts: BankAccount[];
  onDeposit: (accountId: string, amount: number, description: string) => Transaction;
  onWithdraw: (accountId: string, amount: number, description: string) => Transaction;
}

export const DepositWithdraw: React.FC<DepositWithdrawProps> = ({
  mode: initialMode,
  accounts,
  onDeposit,
  onWithdraw,
}) => {
  const [mode, setMode] = useState<'DEPOSIT' | 'WITHDRAW'>(initialMode);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [lastReceipt, setLastReceipt] = useState<Transaction | null>(null);

  const effectiveAccountId = selectedAccountId || accounts[0]?.id || '';
  const selectedAccount = accounts.find((a) => a.id === effectiveAccountId);
  const numAmount = parseFloat(amount) || 0;

  const maxWithdraw = selectedAccount
    ? Math.max(0, selectedAccount.balance - selectedAccount.minimumBalance)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLastReceipt(null);

    if (numAmount <= 0) {
      setError('Please specify a transaction amount greater than zero.');
      return;
    }

    if (!selectedAccount) {
      setError('Please select an active target account.');
      return;
    }

    try {
      if (mode === 'DEPOSIT') {
        const txn = onDeposit(
          selectedAccount.id,
          numAmount,
          description || 'Counter Cash Deposit'
        );
        setLastReceipt(txn);
        setAmount('');
        setDescription('');
      } else {
        if (numAmount > maxWithdraw) {
          setError(
            `Insufficient funds. Maximum available withdrawal from ${selectedAccount.accountNumber} is ${formatCurrency(
              maxWithdraw
            )} (enforcing minimum balance of ${formatCurrency(selectedAccount.minimumBalance)}).`
          );
          return;
        }
        const txn = onWithdraw(
          selectedAccount.id,
          numAmount,
          description || 'Counter Cash Withdrawal'
        );
        setLastReceipt(txn);
        setAmount('');
        setDescription('');
      }
    } catch (err: any) {
      setError(err.message || 'Transaction could not be executed.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Tab Switcher */}
      <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1">
        <button
          onClick={() => {
            setMode('DEPOSIT');
            setError('');
            setLastReceipt(null);
          }}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
            mode === 'DEPOSIT'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
          <span>Cash Deposit Counter</span>
        </button>
        <button
          onClick={() => {
            setMode('WITHDRAW');
            setError('');
            setLastReceipt(null);
          }}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
            mode === 'WITHDRAW'
              ? 'bg-white text-rose-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowUpFromLine className="w-4 h-4 text-rose-600" />
          <span>Cash Withdrawal Counter</span>
        </button>
      </div>

      {/* Main Processing Box */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="border-b border-slate-100 pb-4 mb-5">
          <h3 className="font-bold text-slate-900 text-base">
            {mode === 'DEPOSIT' ? 'Process Counter Deposit' : 'Process Counter Cash Withdrawal'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant balance credit/debit with row-level transaction verification and receipt logging
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Account Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Bank Account *
            </label>
            <TypeableSelect
              required
              allowCustom={false}
              value={effectiveAccountId}
              onChange={(val) => setSelectedAccountId(val)}
              placeholder="Type or select bank account"
              options={accounts.map((acc) => ({
                value: acc.id,
                label: `${acc.accountNumber} — ${acc.customerName} (${acc.accountType}) [Bal: ${formatCurrency(acc.balance)}]`,
              }))}
            />
          </div>

          {/* Account Details Callout */}
          {selectedAccount && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Account Holder:</span>
                <span className="font-semibold text-slate-900 ml-1.5">{selectedAccount.customerName}</span>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Min. Balance: {formatCurrency(selectedAccount.minimumBalance)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Current Balance</span>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(selectedAccount.balance)}</span>
                {mode === 'WITHDRAW' && (
                  <div className="text-[11px] text-emerald-600 font-semibold">
                    Max Allowed: {formatCurrency(maxWithdraw)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {mode === 'DEPOSIT' ? 'Deposit Amount ($) *' : 'Withdrawal Amount ($) *'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Quick preset amounts */}
          <div className="flex flex-wrap gap-2">
            {[100, 250, 500, 1000, 2500, 5000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset.toString())}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium"
              >
                +${preset}
              </button>
            ))}
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Purpose / Remarks</label>
            <input
              type="text"
              placeholder={mode === 'DEPOSIT' ? 'e.g. Cash Deposit via Teller' : 'e.g. ATM or Counter Cash Payout'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-sm transition flex items-center justify-center gap-2 ${
                mode === 'DEPOSIT'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {mode === 'DEPOSIT' ? (
                <>
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Execute Cash Deposit</span>
                </>
              ) : (
                <>
                  <ArrowUpFromLine className="w-4 h-4" />
                  <span>Execute Cash Withdrawal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Transaction Receipt */}
      {lastReceipt && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-200 mb-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Transaction Receipt Generated</span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-900">{lastReceipt.referenceId}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 mb-4">
            <div>
              <span className="text-slate-500 block">Account</span>
              <span className="font-mono font-semibold">{lastReceipt.accountNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Account Holder</span>
              <span className="font-semibold">{lastReceipt.customerName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Operation</span>
              <span className="font-semibold text-emerald-800">{lastReceipt.type}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Amount</span>
              <span className="font-bold text-base text-slate-900">{formatCurrency(lastReceipt.amount)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Balance After</span>
              <span className="font-semibold text-slate-900">{formatCurrency(lastReceipt.balanceAfter)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Timestamp</span>
              <span>{new Date(lastReceipt.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
