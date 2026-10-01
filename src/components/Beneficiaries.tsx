import React, { useState } from 'react';
import {
  UserCheck,
  UserPlus,
  ArrowLeftRight,
  Trash2,
  Building,
  Mail,
  Phone,
  X,
} from 'lucide-react';
import { Beneficiary, Customer } from '../types/banking';

interface BeneficiariesProps {
  beneficiaries: Beneficiary[];
  customers: Customer[];
  onAddBeneficiary: (ben: Omit<Beneficiary, 'id' | 'createdAt'>) => void;
  onDeleteBeneficiary: (id: string) => void;
  onInitiateTransfer: (accountNumber: string) => void;
}

export const Beneficiaries: React.FC<BeneficiariesProps> = ({
  beneficiaries,
  customers,
  onAddBeneficiary,
  onDeleteBeneficiary,
  onInitiateTransfer,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('Apex National Bank');
  const [ifscCode, setIfscCode] = useState('APEX0001001');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficiaryName || !accountNumber) return;
    onAddBeneficiary({
      customerId: customers[0]?.id || 'cust-1',
      beneficiaryName,
      accountNumber: accountNumber.trim(),
      bankName,
      ifscCode,
      email,
      phone,
    });
    setShowAddModal(false);
    setBeneficiaryName('');
    setAccountNumber('');
    setEmail('');
    setPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Beneficiary Management</h2>
          <p className="text-xs text-slate-500">
            Saved payees for fast 1-click fund transfers across internal and external banking networks
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white flex items-center gap-1.5 shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Beneficiary</span>
        </button>
      </div>

      {/* Beneficiaries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {beneficiaries.map((ben) => (
          <div
            key={ben.id}
            className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {ben.beneficiaryName[0]}
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Remove beneficiary ${ben.beneficiaryName}?`)) {
                      onDeleteBeneficiary(ben.id);
                    }
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Delete Beneficiary"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h4 className="font-bold text-slate-900 text-sm">{ben.beneficiaryName}</h4>
              <div className="font-mono text-xs text-slate-500 mt-0.5">Acc: #{ben.accountNumber}</div>

              <div className="mt-3 space-y-1 text-xs text-slate-500 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{ben.bankName}</span>
                </div>
                {ben.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{ben.email}</span>
                  </div>
                )}
                {ben.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ben.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => onInitiateTransfer(ben.accountNumber)}
                className="w-full py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Send Money</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {beneficiaries.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200">
          No registered payees found. Click "Add New Beneficiary" to register frequent recipients.
        </div>
      )}

      {/* Add Beneficiary Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Add Registered Payee</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emily Chen"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number *</label>
                <input
                  type="text"
                  required
                  placeholder="12-digit account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Optional"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="Optional"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm"
                >
                  Save Payee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
