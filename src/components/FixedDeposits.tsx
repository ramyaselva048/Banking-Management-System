import React, { useState } from 'react';
import {
  PiggyBank,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { FixedDeposit, BankAccount, Customer } from '../types/banking';
import { calculateFDMaturity, formatCurrency } from '../utils/finance';
import { TypeableSelect } from './TypeableSelect';

interface FixedDepositsProps {
  fixedDeposits: FixedDeposit[];
  accounts: BankAccount[];
  customers: Customer[];
  onOpenFD: (
    customerId: string,
    linkedAccountId: string,
    principal: number,
    tenureMonths: number,
    rate: number
  ) => void;
  onCloseFD: (fdId: string) => void;
}

export const FixedDeposits: React.FC<FixedDepositsProps> = ({
  fixedDeposits,
  accounts,
  customers,
  onOpenFD,
  onCloseFD,
}) => {
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [principalAmount, setPrincipalAmount] = useState<number>(5000);
  const [tenureMonths, setTenureMonths] = useState<number>(6);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const effectiveCustomerId = selectedCustomerId || customers[0]?.id || '';
  const customerAccounts = accounts.filter((a) => a.customerId === effectiveCustomerId);
  const effectiveAccountId =
    customerAccounts.some((a) => a.id === selectedAccountId)
      ? selectedAccountId
      : customerAccounts[0]?.id || accounts[0]?.id || '';

  const ratesMap: Record<number, number> = {
    6: 5.5,
    12: 6.5,
    24: 7.0,
    36: 7.25,
    60: 7.5,
  };

  const selectedRate = ratesMap[tenureMonths] || 6.5;
  const projection = calculateFDMaturity(principalAmount, selectedRate, tenureMonths);

  const handleOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (principalAmount <= 0) {
      setErrorMessage('Please enter a valid deposit principal amount greater than zero.');
      return;
    }

    try {
      onOpenFD(
        effectiveCustomerId,
        effectiveAccountId,
        principalAmount,
        tenureMonths,
        selectedRate
      );
      setShowOpenModal(false);
      setSuccessMessage(
        `Fixed Deposit Certificate opened for ${formatCurrency(principalAmount)} (${tenureMonths} Months @ ${selectedRate}% p.a. — Maturity: ${formatCurrency(projection.maturityAmount)}).`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to open Fixed Deposit.');
    }
  };

  const totalFDVal = fixedDeposits
    .filter((f) => f.status === 'ACTIVE')
    .reduce((sum, f) => sum + f.principalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fixed Deposits & Term Savings</h2>
          <p className="text-xs text-slate-500">
            High-yield compounding investment certificates, maturity projections, and portfolio liquidation
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMessage('');
            setShowOpenModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white flex items-center gap-1.5 shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Open Fixed Deposit</span>
        </button>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            ACTIVE FD PORTFOLIO
          </span>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalFDVal)}</div>
          <span className="text-xs text-emerald-600 font-medium mt-1 block">Compounded Quarterly</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            HIGHEST OFFERED APY
          </span>
          <div className="text-2xl font-bold text-blue-600">7.50% p.a.</div>
          <span className="text-xs text-slate-500 mt-1 block">For 5-year senior terms</span>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            TOTAL CERTIFICATES
          </span>
          <div className="text-2xl font-bold text-slate-900">{fixedDeposits.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">Across retail customers</span>
        </div>
      </div>

      {/* Active Fixed Deposits List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Active Fixed Deposit Certificates</h3>
          <span className="text-xs text-slate-500">Government insured up to $250,000</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Certificate ID</th>
                <th className="py-3 px-4">Account Holder</th>
                <th className="py-3 px-4">Principal Amount</th>
                <th className="py-3 px-4">Rate & Tenure</th>
                <th className="py-3 px-4">Projected Maturity</th>
                <th className="py-3 px-4">Maturity Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {fixedDeposits.map((fd) => (
                <tr key={fd.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{fd.fdNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{fd.customerName}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(fd.principalAmount)}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-blue-700">{fd.interestRate}%</span>
                    <span className="text-slate-500 ml-1">({fd.tenureMonths} Months)</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-emerald-700">{formatCurrency(fd.maturityAmount)}</div>
                    <div className="text-[10px] text-slate-400">
                      Interest: +{formatCurrency(fd.totalInterest)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{fd.maturityDate}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        fd.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : fd.status === 'MATURED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {fd.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {fd.status === 'ACTIVE' && (
                      <button
                        onClick={() => {
                          try {
                            onCloseFD(fd.id);
                            setSuccessMessage(`Fixed Deposit #${fd.fdNumber} settled and liquidated.`);
                          } catch (err: any) {
                            setErrorMessage(err?.message || 'Failed to liquidate Fixed Deposit.');
                          }
                        }}
                        className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 font-semibold text-[11px] transition shadow-2xs"
                      >
                        Liquidate / Close
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {fixedDeposits.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No fixed deposit certificates registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open FD Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Open Fixed Deposit Certificate</h3>
              </div>
              <button
                onClick={() => setShowOpenModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer *</label>
                <TypeableSelect
                  required
                  allowCustom={false}
                  value={effectiveCustomerId}
                  onChange={(nextCustomerId) => {
                    setSelectedCustomerId(nextCustomerId);
                    const nextAccounts = accounts.filter((a) => a.customerId === nextCustomerId);
                    setSelectedAccountId(nextAccounts[0]?.id || '');
                  }}
                  placeholder="Type or select customer"
                  options={customers.map((c) => ({
                    value: c.id,
                    label: `${c.fullName} (${c.customerId})`,
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Funding Account *</label>
                <TypeableSelect
                  allowCustom={false}
                  value={effectiveAccountId}
                  onChange={(val) => setSelectedAccountId(val)}
                  placeholder="Type or select funding account"
                  options={
                    accounts.length > 0
                      ? (customerAccounts.length > 0 ? customerAccounts : accounts).map((acc) => ({
                          value: acc.id,
                          label: `${acc.accountNumber} (${acc.accountType}) [Bal: ${formatCurrency(acc.balance)}]`,
                        }))
                      : [{ value: '', label: 'Direct Term Deposit (No linked account)' }]
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deposit Principal ($)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="Enter principal amount"
                    value={principalAmount === 0 ? '' : principalAmount}
                    onChange={(e) =>
                      setPrincipalAmount(e.target.value === '' ? 0 : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tenure Period (Months)</label>
                  <TypeableSelect
                    value={tenureMonths}
                    onChange={(val) => {
                      const parsed = parseInt(String(val), 10);
                      if (!isNaN(parsed) && parsed > 0) {
                        setTenureMonths(parsed);
                      }
                    }}
                    placeholder="Type months or select tenure"
                    options={[
                      { value: 6, label: '6 Months @ 5.50%' },
                      { value: 12, label: '12 Months @ 6.50%' },
                      { value: 24, label: '24 Months @ 7.00%' },
                      { value: 36, label: '36 Months @ 7.25%' },
                      { value: 60, label: '60 Months @ 7.50%' },
                    ]}
                  />
                </div>
              </div>

              {/* Live Maturity Preview Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected Annual Rate:</span>
                  <span className="font-semibold text-slate-900">{selectedRate}% p.a.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Compounding Frequency:</span>
                  <span className="font-semibold text-slate-900">Quarterly (4x/year)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Interest Earned:</span>
                  <span className="font-bold text-emerald-600">+{formatCurrency(projection.totalInterest)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold">
                  <span className="text-slate-900">Guaranteed Maturity Value:</span>
                  <span className="text-emerald-700">{formatCurrency(projection.maturityAmount)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
                  Confirm & Open FD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
