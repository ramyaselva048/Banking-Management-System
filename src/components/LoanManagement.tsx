import React, { useState } from 'react';
import {
  Coins,
  Calculator,
  PlusCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  X,
  CreditCard,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { Loan, BankAccount, Customer, LoanType, UserRole } from '../types/banking';
import { calculateEMI, formatCurrency } from '../utils/finance';
import { exportLoansToExcel } from '../utils/export';

interface LoanManagementProps {
  loans: Loan[];
  accounts: BankAccount[];
  customers: Customer[];
  userRole: UserRole;
  currentUserId?: string;
  onApplyLoan: (
    customerId: string,
    loanType: LoanType,
    amount: number,
    tenureMonths: number,
    interestRate: number,
    purpose: string
  ) => void;
  onApproveLoan: (loanId: string) => void;
  onRejectLoan: (loanId: string, reason: string) => void;
  onDisburseLoan: (loanId: string, targetAccountId: string) => void;
  onRepayEMI: (loanId: string, sourceAccountId: string) => void;
}

export const LoanManagement: React.FC<LoanManagementProps> = ({
  loans,
  accounts,
  customers,
  userRole,
  onApplyLoan,
  onApproveLoan,
  onRejectLoan,
  onDisburseLoan,
  onRepayEMI,
}) => {
  const isStaffOrAdmin = userRole === 'ADMIN' || userRole === 'STAFF';

  // Calculator state
  const [calcPrincipal, setCalcPrincipal] = useState<number>(25000);
  const [calcRate, setCalcRate] = useState<number>(7.5);
  const [calcTenure, setCalcTenure] = useState<number>(36);

  const emiResult = calculateEMI(calcPrincipal, calcRate, calcTenure);

  // Application modal
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [appLoanType, setAppLoanType] = useState<LoanType>('PERSONAL');
  const [appAmount, setAppAmount] = useState<number>(15000);
  const [appRate, setAppRate] = useState<number>(8.5);
  const [appTenure, setAppTenure] = useState<number>(24);
  const [appPurpose, setAppPurpose] = useState<string>('');

  // Disburse modal
  const [disburseTargetLoan, setDisburseTargetLoan] = useState<Loan | null>(null);
  const [disburseAccountId, setDisburseAccountId] = useState<string>('');

  // Repay modal
  const [repayTargetLoan, setRepayTargetLoan] = useState<Loan | null>(null);
  const [repayAccountId, setRepayAccountId] = useState<string>('');

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredLoans = loans.filter((l) => {
    return statusFilter === 'ALL' || l.status === statusFilter;
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (appAmount <= 0) return;
    onApplyLoan(selectedCustomerId, appLoanType, appAmount, appTenure, appRate, appPurpose);
    setShowApplyModal(false);
    setAppPurpose('');
  };

  const handleDisburseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disburseTargetLoan || !disburseAccountId) return;
    onDisburseLoan(disburseTargetLoan.id, disburseAccountId);
    setDisburseTargetLoan(null);
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayTargetLoan || !repayAccountId) return;
    try {
      onRepayEMI(repayTargetLoan.id, repayAccountId);
      setRepayTargetLoan(null);
    } catch (err: any) {
      alert(err.message || 'EMI Repayment failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Loans & Credit Facility</h2>
          <p className="text-xs text-slate-500">
            Interactive EMI calculator, origination approval queue, disbursement, and amortization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportLoansToExcel(filteredLoans)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Loans</span>
          </button>
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white flex items-center gap-1.5 shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply for Loan</span>
          </button>
        </div>
      </div>

      {/* Interactive EMI Calculator Widget */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
          <Calculator className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-base">Interactive EMI Financial Calculator</h3>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
            Exact Decimal Formula
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sliders */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300">Loan Principal Amount:</span>
                <span className="font-bold text-white text-sm">{formatCurrency(calcPrincipal)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="500000"
                step="1000"
                value={calcPrincipal}
                onChange={(e) => setCalcPrincipal(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>$1,000</span>
                <span>$250,000</span>
                <span>$500,000</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300">Annual Interest Rate (% p.a.):</span>
                <span className="font-bold text-white text-sm">{calcRate}%</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="24.0"
                step="0.25"
                value={calcRate}
                onChange={(e) => setCalcRate(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>3.0% (Mortgage)</span>
                <span>12.0% (Standard)</span>
                <span>24.0% (Personal)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300">Tenure Duration:</span>
                <span className="font-bold text-white text-sm">
                  {calcTenure} Months ({(calcTenure / 12).toFixed(1)} Years)
                </span>
              </div>
              <input
                type="range"
                min="6"
                max="360"
                step="6"
                value={calcTenure}
                onChange={(e) => setCalcTenure(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>6 Months</span>
                <span>5 Years (60m)</span>
                <span>30 Years (360m)</span>
              </div>
            </div>
          </div>

          {/* EMI Results Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/15 flex flex-col justify-between">
            <div>
              <span className="text-xs text-blue-200 block uppercase tracking-wider font-semibold">
                Monthly Repayment EMI
              </span>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                {formatCurrency(emiResult.monthlyEmi)}
              </div>
              <div className="text-xs text-slate-300 mt-0.5">per calendar month</div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-white/10 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Principal Amount:</span>
                <span className="font-semibold text-white">{formatCurrency(calcPrincipal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Total Interest Payable:</span>
                <span className="font-semibold text-amber-300">{formatCurrency(emiResult.totalInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Total Capital Repayment:</span>
                <span className="font-bold text-white">{formatCurrency(emiResult.totalPayable)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Applications Queue */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">Loan Applications & Repayments</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {filteredLoans.length} Loans
            </span>
          </div>

          {/* Status filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'PENDING', 'APPROVED', 'DISBURSED', 'REJECTED', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Loans Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Loan ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type & Purpose</th>
                  <th className="py-3 px-4">Principal Amount</th>
                  <th className="py-3 px-4">Monthly EMI</th>
                  <th className="py-3 px-4">Paid / Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLoans.map((loan) => {
                  const percentPaid =
                    loan.totalPayable > 0
                      ? Math.min(100, Math.round((loan.amountPaid / loan.totalPayable) * 100))
                      : 0;

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{loan.loanId}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{loan.customerName}</div>
                        <div className="text-[10px] text-slate-400">
                          Applied: {new Date(loan.appliedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-semibold text-slate-900">{loan.loanType}</span>
                        <div className="text-[11px] text-slate-500 truncate" title={loan.purpose}>
                          {loan.purpose || 'No purpose listed'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatCurrency(loan.amount)}
                        <span className="text-[10px] text-slate-400 block">{loan.interestRate}% &bull; {loan.tenureMonths}m</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">
                        {formatCurrency(loan.monthlyEmi)}/mo
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-700">{percentPaid}%</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {formatCurrency(loan.amountPaid)} / {formatCurrency(loan.totalPayable)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            loan.status === 'DISBURSED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : loan.status === 'APPROVED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : loan.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : loan.status === 'CLOSED'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Staff/Admin Approve / Reject Buttons */}
                          {isStaffOrAdmin && loan.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => onApproveLoan(loan.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition shadow-2xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Enter rejection reason:');
                                  if (reason) onRejectLoan(loan.id, reason);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 font-semibold text-[11px] transition"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Staff/Admin Disburse Button */}
                          {isStaffOrAdmin && loan.status === 'APPROVED' && (
                            <button
                              onClick={() => {
                                const customerAccs = accounts.filter((a) => a.customerId === loan.customerId);
                                setDisburseAccountId(customerAccs[0]?.id || accounts[0]?.id || '');
                                setDisburseTargetLoan(loan);
                              }}
                              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition shadow-2xs"
                            >
                              Disburse Funds &rarr;
                            </button>
                          )}

                          {/* Pay EMI button */}
                          {loan.status === 'DISBURSED' && (
                            <button
                              onClick={() => {
                                const customerAccs = accounts.filter((a) => a.customerId === loan.customerId);
                                setRepayAccountId(customerAccs[0]?.id || accounts[0]?.id || '');
                                setRepayTargetLoan(loan);
                              }}
                              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] transition shadow-2xs"
                            >
                              Pay EMI ({formatCurrency(loan.monthlyEmi)})
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredLoans.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No loan accounts found matching the status filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Apply Loan Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Submit Loan Application</h3>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Applicant *</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.customerId}) - Annual Income: {formatCurrency(c.annualIncome)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Category</label>
                  <select
                    value={appLoanType}
                    onChange={(e) => {
                      const lt = e.target.value as LoanType;
                      setAppLoanType(lt);
                      if (lt === 'HOME') setAppRate(6.75);
                      else if (lt === 'VEHICLE') setAppRate(5.5);
                      else if (lt === 'EDUCATION') setAppRate(4.8);
                      else setAppRate(8.5);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                  >
                    <option value="PERSONAL">Personal Loan</option>
                    <option value="HOME">Home Mortgage</option>
                    <option value="VEHICLE">Auto / Vehicle</option>
                    <option value="EDUCATION">Education Loan</option>
                    <option value="BUSINESS">Small Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Requested ($)</label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    required
                    value={appAmount}
                    onChange={(e) => setAppAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    min="6"
                    max="360"
                    step="6"
                    required
                    value={appTenure}
                    onChange={(e) => setAppTenure(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={appRate}
                    onChange={(e) => setAppRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Purpose & Collateral</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detail the intended use of loan capital and repayment plan..."
                  value={appPurpose}
                  onChange={(e) => setAppPurpose(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Modal */}
      {disburseTargetLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Disburse Loan #{disburseTargetLoan.loanId}</h3>
              <button onClick={() => setDisburseTargetLoan(null)} className="p-1.5 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleDisburseSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900">
                Disbursing <strong>{formatCurrency(disburseTargetLoan.amount)}</strong> directly into the applicant's account.
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Account</label>
                <select
                  required
                  value={disburseAccountId}
                  onChange={(e) => setDisburseAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  {accounts
                    .filter((a) => a.customerId === disburseTargetLoan.customerId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountNumber} ({acc.accountType}) [Bal: {formatCurrency(acc.balance)}]
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisburseTargetLoan(null)}
                  className="px-3 py-1.5 rounded-lg border text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-sm"
                >
                  Confirm Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repay Modal */}
      {repayTargetLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Pay Monthly EMI</h3>
              <button onClick={() => setRepayTargetLoan(null)} className="p-1.5 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRepaySubmit} className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                Monthly EMI Installment: <strong>{formatCurrency(repayTargetLoan.monthlyEmi)}</strong>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Debit From Account</label>
                <select
                  required
                  value={repayAccountId}
                  onChange={(e) => setRepayAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  {accounts
                    .filter((a) => a.customerId === repayTargetLoan.customerId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountNumber} ({acc.accountType}) [Bal: {formatCurrency(acc.balance)}]
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRepayTargetLoan(null)}
                  className="px-3 py-1.5 rounded-lg border text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs shadow-sm"
                >
                  Authorize Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
