import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  UserCheck,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { BankAccount, Beneficiary, Transaction } from '../types/banking';
import { formatCurrency } from '../utils/finance';
import { TypeableSelect } from './TypeableSelect';

interface FundTransferProps {
  accounts: BankAccount[];
  beneficiaries: Beneficiary[];
  onTransfer: (
    sourceAccountId: string,
    destinationAccountNumber: string,
    amount: number,
    description: string
  ) => Transaction;
  onNavigateToBeneficiaries: () => void;
}

export const FundTransfer: React.FC<FundTransferProps> = ({
  accounts,
  beneficiaries,
  onTransfer,
  onNavigateToBeneficiaries,
}) => {
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id || '');
  const [destAccountNumber, setDestAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [transferReceipt, setTransferReceipt] = useState<Transaction | null>(null);

  const effectiveSourceAccountId = sourceAccountId || accounts[0]?.id || '';
  const sourceAccount = accounts.find((a) => a.id === effectiveSourceAccountId);
  const destAccount = accounts.find((a) => a.accountNumber === destAccountNumber.trim());

  const numAmount = parseFloat(amount) || 0;
  const availableBal = sourceAccount
    ? Math.max(0, sourceAccount.balance - sourceAccount.minimumBalance)
    : 0;

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTransferReceipt(null);

    if (numAmount <= 0) {
      setError('Please provide a transfer amount greater than $0.00.');
      return;
    }

    if (!destAccountNumber.trim()) {
      setError('Please enter a destination account number.');
      return;
    }

    if (sourceAccount && destAccountNumber.trim() === sourceAccount.accountNumber) {
      setError('Source account and destination account cannot be identical.');
      return;
    }

    if (numAmount > availableBal) {
      setError(`Insufficient funds. Maximum available transfer amount is ${formatCurrency(availableBal)}.`);
      return;
    }

    try {
      const txn = onTransfer(
        effectiveSourceAccountId,
        destAccountNumber.trim(),
        numAmount,
        description || 'Online Bank Transfer'
      );
      setTransferReceipt(txn);
      setAmount('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Fund transfer could not be completed.');
    }
  };

  const handleSelectBeneficiary = (ben: Beneficiary) => {
    setDestAccountNumber(ben.accountNumber);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Instant Fund Transfer</h3>
            <p className="text-xs text-slate-500">
              Real-time atomic transfer with balance locks and fraud validation
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleTransferSubmit} className="space-y-4">
          {/* Source Account */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Debit Account *
            </label>
            <TypeableSelect
              required
              allowCustom={false}
              value={effectiveSourceAccountId}
              onChange={(val) => setSourceAccountId(val)}
              placeholder="Type or select debit account"
              options={accounts.map((acc) => ({
                value: acc.id,
                label: `${acc.accountNumber} — ${acc.customerName} (${acc.accountType}) [Bal: ${formatCurrency(acc.balance)}]`,
              }))}
            />
          </div>

          {/* Source Account Summary */}
          {sourceAccount && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block">Available to Transfer</span>
                <span className="text-base font-bold text-emerald-600">{formatCurrency(availableBal)}</span>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                <div>Total: {formatCurrency(sourceAccount.balance)}</div>
                <div>Min. Reserve: {formatCurrency(sourceAccount.minimumBalance)}</div>
              </div>
            </div>
          )}

          {/* Beneficiary Quick Select */}
          {beneficiaries.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">Quick Beneficiaries</span>
                <button
                  type="button"
                  onClick={onNavigateToBeneficiaries}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Manage &rarr;
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {beneficiaries.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBeneficiary(b)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>{b.beneficiaryName}</span>
                    <span className="font-mono text-slate-400 text-[10px]">({b.accountNumber.slice(-4)})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Destination Account Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Destination 12-Digit Account Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 100889900333"
              value={destAccountNumber}
              onChange={(e) => setDestAccountNumber(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-semibold focus:ring-2 focus:ring-blue-500/20"
            />
            {destAccount && (
              <div className="mt-1 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Recipient Verified: {destAccount.customerName} ({destAccount.accountType})</span>
              </div>
            )}
          </div>

          {/* Transfer Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Amount ($) *</label>
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

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Purpose / Remarks</label>
            <input
              type="text"
              placeholder="e.g. Monthly rent, Supplier invoice, Family allowance"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-sm transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Authorize & Execute Transfer</span>
            </button>
          </div>
        </form>
      </div>

      {/* Transfer Receipt */}
      {transferReceipt && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-200 mb-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Fund Transfer Confirmed</span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-900">{transferReceipt.referenceId}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 mb-4">
            <div>
              <span className="text-slate-500 block">From Account</span>
              <span className="font-mono font-semibold">{transferReceipt.accountNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">To Account</span>
              <span className="font-mono font-semibold">{transferReceipt.recipientAccountNumber || destAccountNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Transferred Amount</span>
              <span className="font-bold text-base text-slate-900">{formatCurrency(transferReceipt.amount)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Source Balance After</span>
              <span className="font-semibold text-slate-900">{formatCurrency(transferReceipt.balanceAfter)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Description</span>
              <span>{transferReceipt.description}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Transfer Advice</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
