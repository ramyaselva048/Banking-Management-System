import React from 'react';
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Coins,
  ShieldCheck,
  Building,
  BarChart3,
  Bell,
  Lock,
  UserCheck,
  Code2,
  FileSpreadsheet,
  PiggyBank,
  Printer,
  LogOut,
} from 'lucide-react';
import { UserRole } from '../types/banking';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole: UserRole;
  pendingLoansCount: number;
  unreadNotifsCount: number;
  onLogout: () => void;
  onOpenPrintReport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  pendingLoansCount,
  unreadNotifsCount,
  onLogout,
  onOpenPrintReport,
}) => {
  const isStaffOrAdmin = userRole === 'ADMIN' || userRole === 'STAFF';

  interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
    roles?: UserRole[];
  }

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: 'CORE OVERVIEW',
      items: [
        {
          id: 'dashboard',
          label: 'Executive Dashboard',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'BANKING OPERATIONS',
      items: [
        {
          id: 'accounts',
          label: 'Account Directory',
          icon: <Wallet className="w-4 h-4" />,
        },
        {
          id: 'transfer',
          label: 'Fund Transfer',
          icon: <ArrowLeftRight className="w-4 h-4" />,
        },
        ...(isStaffOrAdmin
          ? [
              {
                id: 'deposit',
                label: 'Cash Deposit',
                icon: <ArrowDownToLine className="w-4 h-4 text-emerald-500" />,
              },
              {
                id: 'withdraw',
                label: 'Cash Withdrawal',
                icon: <ArrowUpFromLine className="w-4 h-4 text-rose-500" />,
              },
            ]
          : []),
        {
          id: 'transactions',
          label: 'Passbook & Statement',
          icon: <History className="w-4 h-4" />,
        },
        {
          id: 'beneficiaries',
          label: 'Beneficiaries',
          icon: <UserCheck className="w-4 h-4" />,
          roles: ['CUSTOMER'],
        },
      ],
    },
    {
      title: 'CREDIT & WEALTH',
      items: [
        {
          id: 'loans',
          label: 'Loans & EMI Manager',
          icon: <Coins className="w-4 h-4" />,
          badge: isStaffOrAdmin && pendingLoansCount > 0 ? pendingLoansCount : undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'deposits',
          label: 'Fixed Deposits (FD/RD)',
          icon: <PiggyBank className="w-4 h-4" />,
        },
      ],
    },
    ...(isStaffOrAdmin
      ? [
          {
            title: 'ADMINISTRATION & COMPLIANCE',
            items: [
              ...(userRole === 'ADMIN'
                ? [
                    {
                      id: 'staff',
                      label: 'Staff Allocation',
                      icon: <UserCheck className="w-4 h-4 text-blue-400" />,
                      badge: 'Admin',
                      badgeColor: 'bg-red-500/80 text-white',
                    },
                  ]
                : []),
              {
                id: 'customers',
                label: 'Customer Management',
                icon: <Users className="w-4 h-4" />,
              },
              {
                id: 'branches',
                label: 'Bank Branches',
                icon: <Building className="w-4 h-4" />,
              },
              {
                id: 'reports',
                label: 'Reports & Analytics',
                icon: <BarChart3 className="w-4 h-4" />,
              },
              {
                id: 'audit',
                label: 'Audit Trail Logs',
                icon: <Lock className="w-4 h-4" />,
              },
            ],
          },
        ]
      : []),
    {
      title: 'SYSTEM & DEVELOPER',
      items: [
        {
          id: 'print_report',
          label: 'Print Report / Advice',
          icon: <Printer className="w-4 h-4 text-emerald-400" />,
        },
        {
          id: 'notifications',
          label: 'Notification Center',
          icon: <Bell className="w-4 h-4" />,
          badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
          badgeColor: 'bg-red-500 text-white',
        },
        {
          id: 'profile',
          label: 'My Account & Security',
          icon: <ShieldCheck className="w-4 h-4" />,
        },
        {
          id: 'django_project',
          label: 'Django & VS Code Guide',
          icon: <Code2 className="w-4 h-4 text-blue-400" />,
          badge: 'Python',
          badgeColor: 'bg-blue-600 text-white font-bold',
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-57px)]">
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h6 className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">
              {section.title}
            </h6>
            <nav className="space-y-0.5">
              {section.items
                .filter((item) => !item.roles || item.roles.includes(userRole))
                .map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'print_report') {
                          onOpenPrintReport();
                        } else {
                          onSelectTab(item.id);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition group ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                            item.badgeColor || 'bg-slate-700 text-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom User & Logout Controls */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <button
          onClick={onLogout}
          className="w-full py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Sign Out / Logout</span>
        </button>

        <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Core Active</span>
          </div>
          <span className="text-[10px] text-slate-500">v2.4.0</span>
        </div>
      </div>
    </aside>
  );
};
