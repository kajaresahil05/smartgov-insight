import React, { useState } from 'react';
import { Globe, Bell, MapPin, Sun, Shield, Lock, LogOut, CheckCircle2 } from 'lucide-react';

export default function Settings({ onLogout }) {
  const [language, setLanguage] = useState('English');
  const [notifyComplaints, setNotifyComplaints] = useState(true);
  const [notifyProjects, setNotifyProjects] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [savedToast, setSavedToast] = useState('');

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setSavedToast(`Language changed to ${lang}`);
    setTimeout(() => setSavedToast(''), 3000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xs max-w-xl mx-auto space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500 text-xs font-medium mt-0.5">Customize your language, notifications, and portal preferences.</p>
      </div>

      {savedToast && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedToast}</span>
        </div>
      )}

      {/* Language Preferences */}
      <div className="space-y-3 pt-1">
        <div className="text-xs font-extrabold text-slate-900 flex items-center space-x-2">
          <Globe className="w-4 h-4 text-emerald-600" />
          <span>Portal Language</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'English', label: 'English' },
            { id: 'Hindi', label: 'हिंदी (Hindi)' },
            { id: 'Marathi', label: 'मराठी (Marathi)' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleLanguageChange(item.id)}
              className={`py-2.5 px-3 rounded-2xl text-xs font-extrabold border transition-all ${
                language === item.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        <div className="text-xs font-extrabold text-slate-900 flex items-center space-x-2">
          <Bell className="w-4 h-4 text-emerald-600" />
          <span>Notification Preferences</span>
        </div>

        <div className="space-y-2 text-xs font-semibold text-slate-700">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-150 cursor-pointer">
            <span>Complaint status updates</span>
            <input
              type="checkbox"
              checked={notifyComplaints}
              onChange={(e) => setNotifyComplaints(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-150 cursor-pointer">
            <span>Local government project updates</span>
            <input
              type="checkbox"
              checked={notifyProjects}
              onChange={(e) => setNotifyProjects(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-150 cursor-pointer">
            <span>Email notifications (SMTP Gmail)</span>
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
          </label>
        </div>
      </div>

      {/* Appearance & Security */}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        <div className="text-xs font-extrabold text-slate-900 flex items-center space-x-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Appearance & Theme</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150 flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Active Theme</span>
          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[10px] font-extrabold">Light Mode</span>
        </div>
      </div>

      {/* Logout Action */}
      <div className="border-t border-slate-100 pt-4">
        <button
          onClick={onLogout}
          className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 border border-rose-200 transition-colors"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>Logout Account</span>
        </button>
      </div>

    </div>
  );
}
