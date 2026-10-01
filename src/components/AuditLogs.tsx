import React, { useState } from 'react';
import {
  Lock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Download,
} from 'lucide-react';
import { AuditLog } from '../types/banking';
import { TypeableSelect } from './TypeableSelect';

interface AuditLogsProps {
  logs: AuditLog[];
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const actions = Array.from(new Set(logs.map((l) => l.action)));

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.description.toLowerCase().includes(search.toLowerCase()) ||
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Audit & Compliance Log</h2>
          <p className="text-xs text-slate-500">
            Immutable system security trail capturing all transactions, logins, role adjustments, and approvals
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, user, or log description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-64">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <TypeableSelect
            allowCustom={false}
            value={actionFilter}
            onChange={(val) => setActionFilter(val)}
            placeholder="Filter by event..."
            options={[
              { value: 'ALL', label: 'All Event Types' },
              ...actions.map((act) => ({ value: act, label: act })),
            ]}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{log.userName}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-md text-slate-700">{log.description}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{log.ipAddress}</td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No audit records found matching criteria.
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
