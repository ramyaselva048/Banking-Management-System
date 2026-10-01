import React from 'react';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Coins,
  ShieldAlert,
  Clock,
  CheckCheck,
} from 'lucide-react';
import { NotificationItem } from '../types/banking';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Notification Center</h2>
          <p className="text-xs text-slate-500">
            System security notices, loan decisions, and transaction alerts
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-blue-600 flex items-center gap-1.5 shadow-2xs transition"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden divide-y divide-slate-100">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => onMarkRead(notif.id)}
            className={`p-4 sm:p-5 flex items-start gap-3.5 cursor-pointer hover:bg-slate-50/80 transition ${
              !notif.isRead ? 'bg-blue-50/30' : ''
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                notif.type === 'LOAN'
                  ? 'bg-amber-100 text-amber-600'
                  : notif.type === 'SECURITY'
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              {notif.type === 'LOAN' ? (
                <Coins className="w-4 h-4" />
              ) : notif.type === 'SECURITY' ? (
                <ShieldAlert className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className={`text-xs font-bold ${!notif.isRead ? 'text-blue-950 font-extrabold' : 'text-slate-900'}`}>
                  {notif.title}
                </h4>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(notif.createdAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
            </div>

            {!notif.isRead && (
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-xs">
            No notifications available. All systems are operational.
          </div>
        )}
      </div>
    </div>
  );
};
