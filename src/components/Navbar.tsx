import React, { useState } from 'react';
import {
  Building2,
  Bell,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  RefreshCw,
  UserCheck,
  Briefcase,
  User as UserIcon,
  ChevronDown,
  Printer,
} from 'lucide-react';
import { User, UserRole, NotificationItem } from '../types/banking';
import { BankingStorage } from '../services/storage';

interface NavbarProps {
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onResetData: () => void;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
  onOpenPrintReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users,
  onSwitchUser,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onResetData,
  onNavigate,
  onLogout,
  onOpenPrintReport,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const roleColors: Record<UserRole, { bg: string; text: string; label: string }> = {
    ADMIN: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-600', label: 'Bank Admin' },
    STAFF: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-600', label: 'Bank Officer' },
    CUSTOMER: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-600', label: 'Customer' },
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-slate-900 to-blue-900 flex items-center justify-center text-white shadow-md shadow-blue-950/20">
            <Building2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-lg">APEX BANK</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Core Banking
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Enterprise Python Django Architecture</p>
          </div>
        </div>

        {/* Center / Role Switcher for seamless testing */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition"
              title="Switch user role to test Admin, Staff, or Customer view"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden md:inline text-slate-500">Active Role:</span>
              <span className="font-semibold text-slate-900">{currentUser.firstName} ({currentUser.role})</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Role-Based Access Switcher
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Switch persona to test permissions instantly</p>
                </div>
                {users.map((u) => {
                  const roleConfig = roleColors[u.role];
                  const isSelected = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition text-xs ${
                        isSelected ? 'bg-blue-50/70 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            u.role === 'ADMIN'
                              ? 'bg-red-100 text-red-700'
                              : u.role === 'STAFF'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.firstName[0]}
                        </div>
                        <div>
                          <div className="text-slate-900">{u.firstName} {u.lastName}</div>
                          <div className="text-[10px] text-slate-500">{u.email}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleConfig.bg} ${roleConfig.text}`}
                      >
                        {u.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Print Report Quick Action */}
          <button
            onClick={onOpenPrintReport}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-blue-600 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Open official print report generator"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Print Report</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={() => {
              if (window.confirm('Reset banking records to initial demo seed state?')) {
                onResetData();
              }
            }}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition"
            title="Reset database to default seed records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition relative"
              title="System Alerts & Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                  <div className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span>Banking Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead(n.id)}
                      className={`px-4 py-2.5 hover:bg-slate-50 transition cursor-pointer text-xs ${
                        !n.isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-semibold ${!n.isRead ? 'text-blue-950 font-bold' : 'text-slate-800'}`}>
                          {n.title}
                        </span>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0" />}
                      </div>
                      <p className="text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400">No notifications</div>
                  )}
                </div>

                <div className="px-4 pt-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      onNavigate('notifications');
                      setShowNotifs(false);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    View All Notifications &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <button
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              {currentUser.firstName[0]}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUser.firstName} {currentUser.lastName}
              </div>
              <div className="text-[10px] text-slate-500 leading-none">{currentUser.role}</div>
            </div>
          </button>

          {/* Dedicated Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
            title="Log out of the banking system"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
