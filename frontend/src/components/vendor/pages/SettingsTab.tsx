import React, { useState, useEffect } from 'react';
import {
  Settings, User, Lock, Sun, Moon, Bell, Save, Check,
  KeyRound, ShieldCheck
} from 'lucide-react';
import { ErrorState } from './SkeletonLoader';

interface SettingsTabProps {
  vendorId: string;
}

export default function SettingsTab({ vendorId }: SettingsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'account' | 'password' | 'theme' | 'notifications'>('account');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Account state
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [location, setLocation] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences state
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [milestoneReminders, setMilestoneReminders] = useState(true);
  const [perfAlerts, setPerfAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendor/profile/${vendorId}`);
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      if (data.success && data.vendor) {
        setContactPerson(data.vendor.contact_person || '');
        setMobile(data.vendor.mobile || '');
        setLocation(data.vendor.location || '');
        if (data.vendor.settings) {
          setEmailNotifs(data.vendor.settings.email_notifications ?? true);
          setMilestoneReminders(data.vendor.settings.milestone_reminders ?? true);
          setPerfAlerts(data.vendor.settings.performance_alerts ?? true);
          setDarkMode(data.vendor.settings.dark_mode ?? false);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [vendorId]);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/vendor/profile/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_person: contactPerson,
          mobile: mobile,
          location: location
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Account details updated successfully!', 'success');
      } else {
        showToast(data.detail || 'Failed to update account.', 'error');
      }
    } catch (e) {
      showToast('Error saving changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirm password do not match.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/vendor/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Password changed successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(data.detail || 'Failed to update password.', 'error');
      }
    } catch (e) {
      showToast('Error communicating with server.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async (customDark?: boolean) => {
    const isDark = customDark !== undefined ? customDark : darkMode;
    setSaving(true);
    try {
      const res = await fetch(`/api/vendor/settings/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_notifications: emailNotifs,
          milestone_reminders: milestoneReminders,
          performance_alerts: perfAlerts,
          dark_mode: isDark
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Preferences saved successfully!', 'success');
      } else {
        showToast(data.detail || 'Failed to save preferences.', 'error');
      }
    } catch (e) {
      showToast('Network error saving preferences.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-64 rounded-3xl bg-slate-100 animate-pulse"></div>;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchSettings} />;
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-sm ${
          toastMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-slate-500 text-xs font-medium mt-1">
          Manage your account credentials, notifications, and portal preferences
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2 overflow-x-auto">
        {[
          { id: 'account', label: 'Account Settings', icon: User },
          { id: 'password', label: 'Change Password', icon: Lock },
          { id: 'theme', label: 'Theme Preferences', icon: Sun },
          { id: 'notifications', label: 'Notification Preferences', icon: Bell },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. Account Settings */}
      {activeSubTab === 'account' && (
        <form onSubmit={handleSaveAccount} className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6 space-y-4 max-w-xl">
          <h3 className="text-sm font-extrabold text-slate-900">Personal & Contact Info</h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Contact Person</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Mobile Number</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Operational City / Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md shadow-violet-200 transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Account Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 2. Change Password */}
      {activeSubTab === 'password' && (
        <form onSubmit={handleChangePassword} className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6 space-y-4 max-w-xl">
          <h3 className="text-sm font-extrabold text-slate-900">Security Credentials</h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Current Password</label>
            <input
              type="password"
              placeholder="Enter existing password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">New Password</label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md shadow-violet-200 transition-all flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{saving ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. Theme Preferences */}
      {activeSubTab === 'theme' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6 space-y-4 max-w-xl">
          <h3 className="text-sm font-extrabold text-slate-900">Display Theme</h3>

          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => {
                setDarkMode(false);
                handleSavePreferences(false);
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                !darkMode
                  ? 'border-violet-600 bg-violet-50/50 ring-2 ring-violet-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Sun className="w-6 h-6 text-amber-500 mb-2" />
              <div className="text-xs font-bold text-slate-800">Light Mode</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Classic clean lavender theme</div>
            </div>

            <div
              onClick={() => {
                setDarkMode(true);
                handleSavePreferences(true);
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                darkMode
                  ? 'border-violet-600 bg-slate-900 text-white ring-2 ring-violet-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Moon className="w-6 h-6 text-violet-400 mb-2" />
              <div className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Dark Mode</div>
              <div className="text-[11px] text-slate-400 mt-0.5">High-contrast nighttime view</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Notification Preferences */}
      {activeSubTab === 'notifications' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6 space-y-5 max-w-xl">
          <h3 className="text-sm font-extrabold text-slate-900">Communication Alerts</h3>

          <div className="space-y-4">
            {[
              {
                title: 'Email Notifications',
                desc: 'Receive alerts when new projects or reviews are posted',
                state: emailNotifs,
                setter: setEmailNotifs
              },
              {
                title: 'Milestone Reminders',
                desc: 'Get automated reminders 7 days before milestone deadlines',
                state: milestoneReminders,
                setter: setMilestoneReminders
              },
              {
                title: 'Performance Alerts',
                desc: 'Get notified whenever your vendor score is re-evaluated',
                state: perfAlerts,
                setter: setPerfAlerts
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0">
                <div>
                  <div className="text-xs font-bold text-slate-800">{item.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                </div>

                <div
                  onClick={() => {
                    item.setter(!item.state);
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 cursor-pointer transition-colors ${
                    item.state ? 'bg-violet-600' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      item.state ? 'transform translate-x-5' : ''
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => handleSavePreferences()}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md shadow-violet-200 transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Notification Preferences'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
