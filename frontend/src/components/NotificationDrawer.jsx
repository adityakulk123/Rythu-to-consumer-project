import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Bell, CheckCheck, Clock, X } from 'lucide-react';

export default function NotificationDrawer({ isOpen, onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-amber-400 text-emerald-950 text-xs px-2 py-0.5 rounded-full font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-emerald-200 hover:text-white hover:bg-emerald-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {unreadCount > 0 && (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center text-xs">
            <span className="text-emerald-800 font-medium">Keep track of offers and orders</span>
            <button
              onClick={markAllAsRead}
              className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300 stroke-1" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markAsRead(n.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  n.is_read
                    ? 'bg-white border-gray-100 hover:border-gray-200 opacity-80'
                    : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-sm font-semibold ${n.is_read ? 'text-gray-800' : 'text-emerald-950'}`}>
                    {n.title}
                  </h4>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.message}</p>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-2">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
