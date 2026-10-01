import React, { useState } from 'react';
import {
  Building,
  PlusCircle,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Branch } from '../types/banking';

interface BranchManagementProps {
  branches: Branch[];
  onAddBranch: (branch: Omit<Branch, 'id'>) => void;
}

export const BranchManagement: React.FC<BranchManagementProps> = ({
  branches,
  onAddBranch,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [managerName, setManagerName] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !branchCode) return;
    onAddBranch({
      name,
      branchCode: branchCode.toUpperCase(),
      ifscCode: ifscCode.toUpperCase() || `APEX000${Math.floor(100 + Math.random() * 900)}`,
      address,
      city,
      state,
      phone,
      email,
      managerName,
      isActive: true,
    });
    setShowAddModal(false);
    setName('');
    setBranchCode('');
    setAddress('');
    setCity('');
    setState('');
    setPhone('');
    setEmail('');
    setManagerName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Branch Network Directory</h2>
          <p className="text-xs text-slate-500">
            Regional banking hubs, automated clearing IFSC codes, and executive branch manager points
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white flex items-center gap-1.5 shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Bank Branch</span>
        </button>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {b.branchCode}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-base">{b.name}</h4>
              <div className="font-mono text-xs text-blue-600 font-semibold mt-0.5">IFSC: {b.ifscCode}</div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>{b.address}, {b.city}, {b.state}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{b.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{b.email}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Branch Manager:</span>
              <span className="font-semibold text-slate-900">{b.managerName || 'Assigned Officer'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Branch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Register New Branch</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Midtown Hub"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. APEX-004"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. APEX0004004"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Manager</label>
                  <input
                    type="text"
                    placeholder="e.g. Robert Smith"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="Street address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State / Zip</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telephone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  Register Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
