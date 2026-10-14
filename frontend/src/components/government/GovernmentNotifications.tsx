import React, { useEffect, useState } from 'react';
import {
  Bell, CheckCircle2, Clock, AlertTriangle, Users, FolderKanban,
  FileText, ShieldAlert, Check, RefreshCw
} from 'lucide-react';

interface NotificationsProps {
  onNavigate?: (tabId: string) => void;
}

export const GovernmentNotifications: React.FC<NotificationsProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/government/notifications');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setNotifications(json.notifications || []);
        setUnreadCount(json.unread_count || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch('/api/government/notifications/read-all', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingleAsRead = async (id: string) => {
    try {
      await fetch(`/api/government/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'All') return true;
    return (n.category || '').toLowerCase() === filter.toLowerCase();
  });

  const getIcon = (type: string, category: string) => {
    if (category === 'Complaints') {
      return <FileText className="w-4 h-4 text-orange-600" />;
    }
    if (category === 'Vendors') {
      return <Users className="w-4 h-4 text-blue-600" />;
    }
    if (category === 'Projects') {
      return <FolderKanban className="w-4 h-4 text-purple-600" />;
    }
    return <AlertTriangle className="w-4 h-4 text-amber-600" />;
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-600" />
            <span>Notifications & Broadcasts</span>
          </h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Stay updated with real-time municipal alerts, vendor submissions, and AI urgency escalations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-2xs disabled:opacity-40 transition-all"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark All as Read</span>
          </button>
          <button
            onClick={fetchNotifications}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-1">
          {['All', 'Complaints', 'Vendors', 'Projects'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === cat
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
          {unreadCount} Unread
        </span>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-600" />
            <span>Fetching real-time notifications...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <span>No notifications in this category. You're all caught up!</span>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.unread) handleMarkSingleAsRead(item.id);
                if (onNavigate && item.link_tab) onNavigate(item.link_tab);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                item.unread
                  ? 'bg-gradient-to-r from-amber-50/50 to-white border-amber-200/80 shadow-2xs hover:shadow-md'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              {/* Icon Container */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.category === 'Complaints'
                    ? 'bg-orange-100'
                    : item.category === 'Vendors'
                    ? 'bg-blue-100'
                    : item.category === 'Projects'
                    ? 'bg-purple-100'
                    : 'bg-amber-100'
                }`}
              >
                {getIcon(item.type, item.category)}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.time}
                    </span>
                    {item.unread && (
                      <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" title="Unread" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.message}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  {item.link_tab && (
                    <span className="text-[10px] font-semibold text-amber-700 hover:underline">
                      View in {item.link_tab} →
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
