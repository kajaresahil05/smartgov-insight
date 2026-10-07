import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function Notifications({ userId, onSelectComplaint }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/citizen/notifications?user_id=${userId || 1}`);
      const json = await res.json();
      if (json.success) {
        setNotifications(json.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xs max-w-xl mx-auto space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Notifications</h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Stay updated on your complaints and community updates.</p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-10 text-xs font-bold text-slate-400">Loading notifications...</div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectComplaint && onSelectComplaint(item.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between ${
                item.read
                  ? 'bg-white border-slate-100 opacity-75'
                  : 'bg-[#eefdf5]/60 border-emerald-100 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900 leading-snug">{item.text}</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>

              {!item.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 mt-1"></span>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Professional Empty State when 0 notifications exist */
        <div className="py-12 px-6 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl">
            🔔
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">You're all caught up!</h3>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1 leading-relaxed">
              No notifications yet. Status updates for your submitted complaints will appear here.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
