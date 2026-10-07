import React, { useState } from 'react';
import { Landmark, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Building2 } from 'lucide-react';

const FIXED_GOVT_EMAIL = 'admin@smartgov.gov.in';
const FIXED_GOVT_PASSWORD = 'SmartGov@2026';

export default function GovernmentLogin({ onNavigateDashboard, onNavigateHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    showToast('Authenticating with Government Portal...', 'info');

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1200));

    if (email === FIXED_GOVT_EMAIL && password === FIXED_GOVT_PASSWORD) {
      showToast('Welcome, Government Administrator!', 'success');
      localStorage.setItem('smartgov_govt_user', JSON.stringify({
        id: 'GOV-001',
        role: 'government',
        name: 'Government Admin',
        email: FIXED_GOVT_EMAIL,
        department: 'Municipal Corporation'
      }));
      setTimeout(() => {
        setIsLoading(false);
        onNavigateDashboard();
      }, 800);
    } else {
      setIsLoading(false);
      showToast('Invalid credentials. Please contact the system administrator for access.', 'error');
    }
  };

  return (
    <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 mx-auto my-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* LEFT HERO PANEL - Government themed dark navy + gold accent */}
        <div className="lg:col-span-6 bg-gradient-to-b from-[#0a1628] via-[#0f2240] to-[#152e54] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold tracking-tight">
                <span>SmartGov</span> <span className="text-amber-400 font-semibold">Insight</span>
              </div>
            </div>

            <div className="w-10 h-1 bg-amber-400 rounded-full mb-6"></div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Government Authority Portal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
              Manage, Prioritize &<br />
              <span className="text-amber-400">Monitor Projects</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
              Review prioritized projects, manage vendors, track milestones, and ensure transparent governance with AI-powered insights.
            </p>
          </div>

          <div className="relative pt-6 border-t border-slate-700/40 z-10">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/70 border border-amber-500/20 rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-amber-400">247</div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Active Projects</div>
              </div>
              <div className="bg-slate-800/70 border border-amber-500/20 rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-amber-400">89</div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Vendors</div>
              </div>
              <div className="bg-slate-800/70 border border-amber-500/20 rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-amber-400">93%</div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">On Track</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT LOGIN PANEL */}
        <div className="lg:col-span-6 bg-slate-50/70 p-8 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center text-white">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm">Government <span className="text-amber-600">Portal</span></span>
            </div>
            {onNavigateHome && (
              <button onClick={onNavigateHome} className="text-xs font-bold text-blue-600 hover:underline">
                ← Back to Home
              </button>
            )}
          </div>

          <div className="max-w-md mx-auto w-full my-auto py-4">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-200">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Government Login</h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1.5">Authorized personnel only. Use your official credentials.</p>
            </div>

            {toast.message && (
              <div className={`mb-4 p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 border shadow-sm transition-all ${
                toast.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <span>{toast.message}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Official Email ID</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your official email"
                    className="block w-full rounded-xl border-0 py-3.5 pl-10 pr-4 text-slate-900 ring-1 ring-slate-200 text-sm bg-white focus:ring-2 focus:ring-amber-500"
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
                    className="block w-full rounded-xl border-0 py-3.5 pl-10 pr-11 text-slate-900 ring-1 ring-slate-200 text-sm bg-white focus:ring-2 focus:ring-amber-500"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600">
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-sm font-semibold text-white shadow-md transition-all mt-6 ${
                  isLoading
                    ? 'bg-amber-400 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Secure Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 text-amber-800 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold mb-0.5">Restricted Access</div>
                <span>This portal is exclusively for authorized government officials. Contact IT administrator for access credentials.</span>
              </div>
            </div>
          </div>

          <div></div>
        </div>
      </div>
    </div>
  );
}
