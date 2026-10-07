import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Key, Save, CheckCircle2, ShieldCheck, Globe } from 'lucide-react';

export default function MyProfile({ userId, user, onUpdateProfile }) {
  const [fullName, setFullName] = useState(user?.full_name || 'Raj Sanjay Kadam');
  const [email, setEmail] = useState(user?.email || 'kadamraj129@gmail.com');
  const [mobile, setMobile] = useState(user?.mobile || '8591763637');
  const [location, setLocation] = useState(user?.location || 'Kothrud, Pune, Maharashtra 411038');
  const [language, setLanguage] = useState('English');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setMobile(user.mobile || '');
      setLocation(user.location || '');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/citizen/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId || 1,
          full_name: fullName,
          mobile,
          location
        })
      });

      const json = await res.json();
      if (json.success) {
        setMessage('Profile updated successfully!');
        if (onUpdateProfile) onUpdateProfile(json.profile);
      } else {
        setMessage(json.message || 'Error updating profile');
      }
    } catch (err) {
      setMessage('Network error updating profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xs max-w-xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">My Profile</h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">Manage your personal details and account security.</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
          {fullName ? fullName[0] : 'C'}
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600"
              required
            />
          </div>
        </div>

        {/* Email Address (Verified) */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-slate-700">Email Address</label>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Verified via Gmail SMTP</span>
            </span>
          </div>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={email}
              disabled
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Locality Address */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Locality / Address</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Preferred Language */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Language</label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Marathi">Marathi (मराठी)</option>
            </select>
          </div>
        </div>

        {/* Change Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Change Password (Optional)</label>
          <div className="relative">
            <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="password"
              placeholder="Leave blank to keep current password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition-all mt-2"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
        </button>

      </form>

    </div>
  );
}
