import React, { useState } from 'react';
import {
  UserCheck,
  UserPlus,
  Search,
  Filter,
  ArrowRightLeft,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Building,
  ShieldCheck,
  FileSpreadsheet,
  X,
  Phone,
  Mail,
  Briefcase,
  DollarSign,
  UserX,
  BadgePercent,
  Layers,
  Lock,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StaffMember, Branch, StaffStatus } from '../types/banking';
import { formatCurrency } from '../utils/finance';

interface StaffManagementProps {
  staffMembers: StaffMember[];
  branches: Branch[];
  onAddStaff: (
    staffData: Omit<StaffMember, 'id' | 'employeeId' | 'joinedAt'>,
    initialPassword?: string
  ) => void;
  onUpdateStaff: (id: string, updates: Partial<StaffMember>, newPassword?: string) => void;
  onTransferStaff: (staffId: string, newBranchId: string) => void;
  onDeleteStaff: (id: string) => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
  staffMembers,
  branches,
  onAddStaff,
  onUpdateStaff,
  onTransferStaff,
  onDeleteStaff,
}) => {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState<StaffMember | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // New staff form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [department, setDepartment] = useState('Credit & Loans');
  const [designation, setDesignation] = useState('Credit & Loan Officer');
  const [approvalLimit, setApprovalLimit] = useState(0);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Edit password state
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Credentials notification banner
  const [allocatedNotice, setAllocatedNotice] = useState<{
    name: string;
    email: string;
    password: string;
    employeeId?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Helper to generate a random strong password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'Apex@';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  // Transfer branch state
  const [newBranchId, setNewBranchId] = useState(branches[0]?.id || '');

  const departments = [
    'Credit & Loans',
    'Counter Operations',
    'Risk & Compliance',
    'Executive Management',
    'Wealth Advisory',
  ];

  const designations = [
    'Senior Branch Manager',
    'Assistant Branch Manager',
    'Credit & Loan Officer',
    'Loan Underwriter',
    'Head Cashier / Operations Officer',
    'Teller / Customer Service Agent',
    'KYC & AML Compliance Analyst',
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password.trim()) return;

    const assignedBranch = branches.find((b) => b.id === branchId) || branches[0];
    const initialPass = password.trim();

    onAddStaff(
      {
        userId: `user-${Date.now()}`,
        fullName,
        email,
        phone,
        branchId: assignedBranch?.id || '',
        branchName: assignedBranch?.name || 'Unassigned',
        department,
        designation,
        approvalLimit: Number(approvalLimit) || 0,
        status: 'ACTIVE',
        password: initialPass,
      },
      initialPass
    );

    setAllocatedNotice({
      name: fullName,
      email,
      password: initialPass,
    });

    setShowAddModal(false);
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setApprovalLimit(0);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget || !newBranchId) return;
    onTransferStaff(transferTarget.id, newBranchId);
    setTransferTarget(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    onUpdateStaff(editingStaff.id, editingStaff, editPassword ? editPassword.trim() : undefined);
    setEditingStaff(null);
    setEditPassword('');
  };

  const exportStaffExcel = () => {
    const rows = staffMembers.map((s) => ({
      'Employee ID': s.employeeId,
      'Full Name': s.fullName,
      'Email': s.email,
      'Phone': s.phone,
      'Branch': s.branchName,
      'Department': s.department,
      'Designation': s.designation,
      'Approval Limit ($)': s.approvalLimit,
      'Status': s.status,
      'Joined Date': s.joinedAt,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bank Staff Roster');
    XLSX.writeFile(wb, 'apex_bank_staff_directory.xlsx');
  };

  // Filtered staff records
  const filteredStaff = staffMembers.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      s.designation.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = branchFilter === 'ALL' || s.branchId === branchFilter;
    const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesBranch && matchesDept && matchesStatus;
  });

  const totalStaff = staffMembers.length;
  const activeStaff = staffMembers.filter((s) => s.status === 'ACTIVE').length;
  const uniqueBranchesCovered = new Set(staffMembers.map((s) => s.branchId)).size;
  const totalApprovalAuthority = staffMembers.reduce((sum, s) => sum + s.approvalLimit, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 uppercase tracking-wider">
              Admin Exclusive Portal
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Staff Allocation & Branch Management Dashboard
          </h2>
          <p className="text-xs text-slate-500">
            Allocate bank officers, assign branch postings, designate credit underwriting limits, and manage staff credentials
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportStaffExcel}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold text-xs text-slate-700 flex items-center gap-1.5 shadow-2xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Roster</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Allocate New Staff</span>
          </button>
        </div>
      </div>

      {/* Allocated Credentials Notification Banner */}
      {allocatedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 text-xs">
                Officer {allocatedNotice.name} Allocated Successfully!
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Login Email:{' '}
                <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                  {allocatedNotice.email}
                </code>{' '}
                &bull; Password:{' '}
                <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                  {allocatedNotice.password}
                </code>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `Username: ${allocatedNotice.email}\nPassword: ${allocatedNotice.password}`
                );
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
              className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-semibold text-xs flex items-center gap-1 hover:bg-emerald-100 transition"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied' : 'Copy Credentials'}</span>
            </button>
            <button
              onClick={() => setAllocatedNotice(null)}
              className="p-1 rounded text-emerald-600 hover:text-emerald-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            TOTAL BANK OFFICERS
          </span>
          <div className="text-2xl font-bold text-slate-900">{totalStaff}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{activeStaff} On Duty &bull; {totalStaff - activeStaff} Off Duty</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            BRANCHES ALLOCATED
          </span>
          <div className="text-2xl font-bold text-blue-600">{uniqueBranchesCovered} / {branches.length}</div>
          <div className="text-xs text-slate-500 mt-1">100% Core coverage</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            TOTAL APPROVAL AUTHORITY
          </span>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalApprovalAuthority)}</div>
          <div className="text-xs text-slate-500 mt-1">Aggregate loan limits</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            SECURITY & COMPLIANCE
          </span>
          <div className="text-2xl font-bold text-purple-700">RBAC Verified</div>
          <div className="text-xs text-slate-500 mt-1">Role separation active</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search officer by name, email, Employee ID, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Branch filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Department filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Staff Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Officer / ID</th>
                <th className="py-3 px-4">Assigned Branch</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Approval Cap</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50/70 transition">
                  {/* Name and Employee ID */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{staff.fullName}</div>
                    <span className="font-mono text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      {staff.employeeId}
                    </span>
                  </td>

                  {/* Branch */}
                  <td className="py-3 px-4 max-w-[160px]">
                    <div className="font-semibold text-slate-900 truncate" title={staff.branchName}>
                      {staff.branchName}
                    </div>
                    <span className="text-[10px] text-slate-400">Allocated Branch</span>
                  </td>

                  {/* Department & Designation */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{staff.designation}</div>
                    <span className="text-[10px] text-slate-400 block">{staff.department}</span>
                  </td>

                  {/* Contact */}
                  <td className="py-3 px-4">
                    <div className="text-slate-900 font-medium">{staff.email}</div>
                    <div className="text-[11px] text-slate-400">{staff.phone}</div>
                  </td>

                  {/* Approval Limit */}
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {formatCurrency(staff.approvalLimit)}
                    <span className="text-[10px] text-slate-400 block font-normal">Per Transaction</span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        staff.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : staff.status === 'ON_LEAVE'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {staff.status.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Admin Actions: Transfer, Edit, Remove */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Transfer Branch Button */}
                      <button
                        onClick={() => {
                          setTransferTarget(staff);
                          setNewBranchId(branches.find((b) => b.id !== staff.branchId)?.id || branches[0]?.id);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-blue-600 transition"
                        title="Transfer Staff to Another Branch"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Details Button */}
                      <button
                        onClick={() => setEditingStaff({ ...staff })}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        title="Edit Designation / Department / Limit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete / Offboard Staff */}
                      <button
                        onClick={() => {
                          if (confirm(`Offboard staff officer ${staff.fullName} (${staff.employeeId})?`)) {
                            onDeleteStaff(staff.id);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 transition"
                        title="Deallocate / Remove Staff"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No bank staff found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocate New Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Allocate & Onboard Bank Officer</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full legal name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Bank Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter official email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (212) 555-0188"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assign to Branch *</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.branchCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation Role</label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                  >
                    {designations.map((des) => (
                      <option key={des} value={des}>
                        {des}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Login Password Input Field */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    <span>Staff Login Password *</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline"
                  >
                    Auto-Generate Password
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    placeholder="Enter login password (e.g. Staff@2026)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  The officer will use this password and their bank email to authenticate into the banking portal.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Credit / Approval Authorization Cap ($)
                </label>
                <input
                  type="number"
                  step="5000"
                  min="5000"
                  value={approvalLimit}
                  onChange={(e) => setApprovalLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Maximum daily transaction or loan disbursement threshold this officer can authorize
                </span>
              </div>

              <div className="sticky bottom-0 bg-white pt-4 pb-1 border-t border-slate-100 flex items-center justify-end gap-3 mt-4 shrink-0">
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
                  Confirm Staff Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Staff Modal */}
      {transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Transfer Officer Branch Posting</h3>
              </div>
              <button onClick={() => setTransferTarget(null)} className="p-1.5 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs">
                <div>
                  Transferring officer <strong>{transferTarget.fullName}</strong> ({transferTarget.employeeId})
                </div>
                <div className="text-slate-500 mt-0.5">Current branch: {transferTarget.branchName}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select New Destination Branch *
                </label>
                <select
                  required
                  value={newBranchId}
                  onChange={(e) => setNewBranchId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.branchCode}) &bull; {b.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferTarget(null)}
                  className="px-3 py-1.5 rounded-lg border text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-sm"
                >
                  Authorize Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Details Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="font-bold text-slate-900">Edit Officer: {editingStaff.fullName}</h3>
              <button onClick={() => setEditingStaff(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                <select
                  value={editingStaff.designation}
                  onChange={(e) => setEditingStaff({ ...editingStaff, designation: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  {designations.map((des) => (
                    <option key={des} value={des}>
                      {des}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={editingStaff.department}
                  onChange={(e) => setEditingStaff({ ...editingStaff, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Approval Cap ($)</label>
                <input
                  type="number"
                  step="5000"
                  value={editingStaff.approvalLimit}
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, approvalLimit: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editingStaff.status}
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, status: e.target.value as StaffStatus })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              {/* Reset Login Password */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Reset Login Password (Optional)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Leave blank to keep current password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Enter new password to update this officer's portal sign-in credentials
                </span>
              </div>

              <div className="sticky bottom-0 bg-white pt-3 pb-1 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-3 py-1.5 rounded-lg border text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-500"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
