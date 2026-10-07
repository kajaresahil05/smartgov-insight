import React, { useState } from 'react';
import { Landmark, User, Lock, Eye, EyeOff, Globe, ArrowRight } from 'lucide-react';

export default function Login({ onNavigateRegister, onNavigateDashboard, onNavigateHome }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    showToast('Authenticating...', 'info');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.requires_verification) {
          showToast('Please verify your email address before logging in.', 'error');
        } else {
          showToast(data.message || 'Invalid credentials.', 'error');
        }
        return;
      }

      showToast(`Welcome back, ${data.user.full_name}!`, 'success');
      localStorage.setItem('smartgov_user', JSON.stringify(data.user));

      setTimeout(() => {
        onNavigateDashboard(data.user.id);
      }, 1000);

    } catch (err) {
      showToast('Error connecting to authentication server.', 'error');
    }
  };

  return (
    <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 mx-auto my-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* LEFT HERO PANEL */}
        <div className="lg:col-span-6 bg-gradient-to-b from-[#0b1b36] via-[#102a4d] to-[#1a3d68] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg">
                <Landmark className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold tracking-tight">
                <span>SmartGov</span> <span className="text-emerald-400 font-semibold">Insight</span>
              </div>
            </div>

            <div className="w-10 h-1 bg-emerald-400 rounded-full mb-6"></div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
              Together, We Build <br />
              <span className="text-emerald-400">Better Communities</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
              Report issues, track progress, and stay informed about government projects in your area.
            </p>
          </div>
        </div>

        {/* RIGHT LOGIN PANEL */}
        <div className="lg:col-span-6 bg-slate-50/70 p-8 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            {onNavigateHome && (
              <button onClick={onNavigateHome} className="text-xs font-bold text-blue-600 hover:underline">
                ← Back to Home
              </button>
            )}
            <button type="button" className="inline-flex items-center gap-x-2 rounded-xl bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200">
              <Globe className="w-4 h-4 text-slate-500" />
              <span>English</span>
            </button>
          </div>

          <div className="max-w-md mx-auto w-full my-auto py-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back!</h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1.5">Login to continue to SmartGov Insight</p>
            </div>

            {toast.message && (
              <div className={`mb-4 p-3.5 rounded-xl text-xs sm:text-sm font-medium ${toast.type === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'}`}>
                {toast.message}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Email or Mobile Number</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your email or mobile number"
                    className="block w-full rounded-xl border-0 py-3.5 pl-10 pr-4 text-slate-900 ring-1 ring-slate-200 text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="block w-full rounded-xl border-0 py-3.5 pl-10 pr-11 text-slate-900 ring-1 ring-slate-200 text-sm bg-white"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-slate-400">
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 px-4 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition-all mt-6"
              >
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-8 text-center text-xs sm:text-sm text-slate-500 font-medium">
              Don't have an account?{' '}
              <button type="button" onClick={onNavigateRegister} className="font-bold text-blue-600 hover:underline ml-1">
                Register as Citizen
              </button>
            </div>
          </div>

          <div></div>
        </div>

      </div>
    </div>
  );
}
