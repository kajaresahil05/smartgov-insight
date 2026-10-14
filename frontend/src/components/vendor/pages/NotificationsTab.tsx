import React, { useState, useEffect } from 'react';
import {
  Bell, CheckCheck, Clock, CheckCircle2, AlertTriangle,
  FolderKanban, Target, UploadCloud, Info
} from 'lucide-react';
import EmptyState from './EmptyState';
import { TableSkeleton, ErrorState } from './SkeletonLoader';

interface NotificationsTabProps {
  vendorId: string;
}

export default function NotificationsTab({ vendorId }: NotificationsTabProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/vendor/notifications/${vendorId}?category=${activeCategory}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } else {
        throw new Error(data.detail || 'Could not fetch notifications');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [vendorId, activeCategory]);

  const handleMarkAsRead = async (notificationId?: number, markAll: boolean = false) => {
    try {
      await fetch(`/api/vendor/notifications/${vendorId}/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_id: notificationId,
          mark_all: markAll
        })
      });
      fetchNotifications();
    } catch (e) {
      // ignore
    }
  };

  const getCategoryIcon = (cat: string, type: string) => {
    if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    if (type === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (cat.includes('Milestone')) return <Target className="w-4 h-4 text-violet-600" />;
    if (cat.includes('Evidence')) return <UploadCloud className="w-4 h-4 text-blue-600" />;
    if (cat.includes('Project')) return <FolderKanban className="w-4 h-4 text-purple-600" />;
    return <Info className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notifications</h2>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Stay updated with project assignments, milestone approvals, and alerts
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => handleMarkAsRead(undefined, true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
          >
            <CheckCheck className="w-3.5 h-3.5 text-violet-600" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All' },
          { id: 'Project Updates', label: 'Project Updates' },
          { id: 'Milestone Approvals', label: 'Milestone Approvals' },
          { id: 'Evidence Requests', label: 'Evidence Requests' },
          { id: 'General', label: 'General' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeCategory === tab.id
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchNotifications} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="bell"
          title="No notifications yet"
          description="You will receive important updates and announcements here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkAsRead(n.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                !n.is_read
                  ? 'bg-violet-50/40 border-violet-200/90 shadow-2xs'
                  : 'bg-white border-slate-100 hover:bg-slate-50'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                n.type === 'warning'
                  ? 'bg-amber-100'
                  : n.type === 'success'
                  ? 'bg-emerald-100'
                  : 'bg-violet-100'
              }`}>
                {getCategoryIcon(n.category, n.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{n.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium">{n.created_at}</span>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-violet-600"></span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.text}</p>
                <div className="mt-2 inline-block text-[10px] font-bold text-violet-700 bg-violet-100/70 px-2 py-0.5 rounded-md">
                  {n.category}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
