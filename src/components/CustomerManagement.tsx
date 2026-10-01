import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  CreditCard,
  Briefcase,
  Calendar,
  Building,
  Phone,
  Mail,
} from 'lucide-react';
import { Customer, BankAccount, Loan, Branch, KYCStatus } from '../types/banking';
import { exportCustomersToExcel } from '../utils/export';
import { formatCurrency } from '../utils/finance';
import { TypeableSelect } from './TypeableSelect';

interface CustomerManagementProps {
  customers: Customer[];
  branches: Branch[];
  accounts: BankAccount[];
  loans: Loan[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'customerId' | 'createdAt'>) => void;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
  onOpenAccountForCustomer: (customerId: string) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  branches,
  accounts,
  loans,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onOpenAccountForCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  // New customer form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Male' as const,
    idType: 'Passport',
    idNumber: '',
    address: '',
    city: '',
    state: '',
    occupation: '',
    annualIncome: 0,
    branchId: branches[0]?.id || '',
    branchName: branches[0]?.name || '',
    kycStatus: 'VERIFIED' as KYCStatus,
  });

  const handleBranchChange = (branchValue: string) => {
    const selected = branches.find(
      (b) => b.id === branchValue || b.name.toLowerCase() === branchValue.toLowerCase()
    );
    setFormData((prev) => ({
      ...prev,
      branchId: selected ? selected.id : branchValue,
      branchName: selected ? selected.name : branchValue,
    }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      alert('Please fill in required name and email.');
      return;
    }
    onAddCustomer({
      ...formData,
      userId: `user-${Date.now()}`,
    });
    setShowAddModal(false);
    // Reset
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'Male',
      idType: 'Passport',
      idNumber: '',
      address: '',
      city: '',
      state: '',
      occupation: '',
      annualIncome: 0,
      branchId: branches[0]?.id || '',
      branchName: branches[0]?.name || '',
      kycStatus: 'VERIFIED',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    onUpdateCustomer(editingCustomer.id, editingCustomer);
    setEditingCustomer(null);
  };

  // Filtered customer records
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.customerId.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchesKyc = kycFilter === 'ALL' || c.kycStatus === kycFilter;
    const matchesBranch = branchFilter === 'ALL' || c.branchId === branchFilter;
    return matchesSearch && matchesKyc && matchesBranch;
  });

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Management</h2>
          <p className="text-xs text-slate-500">
            Search, onboard, verify KYC credentials, and manage customer portfolios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCustomersToExcel(filteredCustomers)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white flex items-center gap-1.5 shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard Customer</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or customer ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>KYC:</span>
          </div>
          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
          >
            <option value="ALL">All KYC</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">KYC Status</th>
                <th className="py-3 px-4">Annual Income</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{cust.customerId}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{cust.fullName}</div>
                    <div className="text-[11px] text-slate-500">{cust.occupation}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-900">{cust.email}</div>
                    <div className="text-slate-500">{cust.phone}</div>
                  </td>
                  <td className="py-3 px-4 max-w-[140px] truncate" title={cust.branchName}>
                    {cust.branchName}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        cust.kycStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : cust.kycStatus === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {cust.kycStatus === 'VERIFIED' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                      )}
                      {cust.kycStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {formatCurrency(cust.annualIncome)}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewingCustomer(cust)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-blue-600 transition"
                        title="View Customer Dossier"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingCustomer({ ...cust })}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        title="Edit Customer Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteCustomer(cust.id)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 transition"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No customers match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Onboard New Customer</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter full legal name"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Branch</label>
                  <TypeableSelect
                    value={formData.branchId || formData.branchName || branches[0]?.id || ''}
                    onChange={(val) => handleBranchChange(val)}
                    placeholder="Type or select branch"
                    options={branches.map((b) => ({
                      value: b.id,
                      label: `${b.name} (${b.branchCode})`,
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <TypeableSelect
                    value={formData.gender}
                    onChange={(val) => setFormData({ ...formData, gender: val as any })}
                    placeholder="Type or select gender"
                    options={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                      { value: 'Other', label: 'Other' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ID Document Type</label>
                  <TypeableSelect
                    value={formData.idType}
                    onChange={(val) => setFormData({ ...formData, idType: val })}
                    placeholder="Type or select ID type"
                    options={[
                      { value: 'Passport', label: 'Passport' },
                      { value: 'Drivers License', label: "Driver's License" },
                      { value: 'National Identity Card', label: 'National Identity Card' },
                      { value: 'Aadhaar / PAN Card', label: 'Aadhaar / PAN Card' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ID Number</label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    placeholder="Enter ID document number"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="Enter occupation"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Income ($)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Enter annual income"
                    value={formData.annualIncome === 0 ? '' : formData.annualIncome}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        annualIncome: e.target.value === '' ? 0 : Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, apartment, suite..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Edit Customer: {editingCustomer.fullName}</h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.fullName}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editingCustomer.email}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">KYC Status</label>
                  <TypeableSelect
                    value={editingCustomer.kycStatus}
                    onChange={(val) =>
                      setEditingCustomer({ ...editingCustomer, kycStatus: val as KYCStatus })
                    }
                    placeholder="Type or select KYC status"
                    options={[
                      { value: 'VERIFIED', label: 'VERIFIED' },
                      { value: 'PENDING', label: 'PENDING' },
                      { value: 'REJECTED', label: 'REJECTED' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={editingCustomer.occupation}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, occupation: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Income ($)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Enter annual income"
                    value={editingCustomer.annualIncome === 0 ? '' : editingCustomer.annualIncome}
                    onChange={(e) =>
                      setEditingCustomer({
                        ...editingCustomer,
                        annualIncome: e.target.value === '' ? 0 : Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Dossier / Details Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {viewingCustomer.customerId}
                </span>
                <h3 className="text-xl font-bold mt-1.5">{viewingCustomer.fullName}</h3>
                <p className="text-xs text-slate-300">{viewingCustomer.occupation} &bull; {viewingCustomer.branchName}</p>
              </div>
              <button
                onClick={() => setViewingCustomer(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* KYC and Personal Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 block">KYC Status</span>
                  <span className="font-bold text-emerald-600">{viewingCustomer.kycStatus}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">ID Type & Number</span>
                  <span className="font-semibold text-slate-900">{viewingCustomer.idType}: {viewingCustomer.idNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Annual Income</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(viewingCustomer.annualIncome)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email</span>
                  <span className="font-semibold text-slate-900">{viewingCustomer.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone</span>
                  <span className="font-semibold text-slate-900">{viewingCustomer.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Registered Date</span>
                  <span className="font-semibold text-slate-900">{new Date(viewingCustomer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Linked Accounts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-slate-900">Registered Accounts</h4>
                  <button
                    onClick={() => {
                      onOpenAccountForCustomer(viewingCustomer.id);
                      setViewingCustomer(null);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    + Open Account
                  </button>
                </div>
                <div className="space-y-2">
                  {accounts
                    .filter((a) => a.customerId === viewingCustomer.id)
                    .map((acc) => (
                      <div
                        key={acc.id}
                        className="p-3 rounded-lg border border-slate-200 flex items-center justify-between bg-white text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            {acc.accountType.replace('_', ' ')} &bull; <span className="font-mono">{acc.accountNumber}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Status: {acc.status}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 text-sm">{formatCurrency(acc.balance)}</span>
                        </div>
                      </div>
                    ))}
                  {accounts.filter((a) => a.customerId === viewingCustomer.id).length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                      No bank accounts opened yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Linked Loans */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-2">Credit & Loan Facilities</h4>
                <div className="space-y-2">
                  {loans
                    .filter((l) => l.customerId === viewingCustomer.id)
                    .map((loan) => (
                      <div
                        key={loan.id}
                        className="p-3 rounded-lg border border-slate-200 flex items-center justify-between bg-white text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-900">{loan.loanId}</span>
                          <span className="text-slate-500 ml-2">({loan.loanType} Loan)</span>
                          <div className="text-[10px] text-slate-400">Monthly EMI: {formatCurrency(loan.monthlyEmi)}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 text-sm">{formatCurrency(loan.amount)}</span>
                          <div className="text-[10px] font-semibold text-amber-600">{loan.status}</div>
                        </div>
                      </div>
                    ))}
                  {loans.filter((l) => l.customerId === viewingCustomer.id).length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                      No active loan obligations.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setViewingCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
