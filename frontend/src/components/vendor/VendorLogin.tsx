import React, { useState } from 'react';
import { Landmark, Mail, Lock, Eye, EyeOff, ArrowRight, Briefcase, Globe } from 'lucide-react';

export default function VendorLogin({ onNavigateRegister, onNavigateDashboard, onNavigateHome }) {
  const [username, setUsername] = useState('');
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
    showToast('Authenticating vendor credentials...', 'info');

    try {
      const res = await fetch('/api/vendor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success && data.vendor) {
        showToast(data.message || `Welcome back, ${data.vendor.company_name}!`, 'success');
        const vendorUser = {
          id: data.vendor.vendor_id || data.vendor.id,
          role: 'vendor',
          company_name: data.vendor.company_name,
          contact_person: data.vendor.contact_person,
          email: data.vendor.email,
          specialization: data.vendor.specialization,
          gst_number: data.vendor.gst_number,
          pan_number: data.vendor.pan_number,
          experience: data.vendor.experience
        };
        localStorage.setItem('smartgov_vendor_user', JSON.stringify(vendorUser));
        setTimeout(() => {
          setIsLoading(false);
          onNavigateDashboard(vendorUser.id);
        }, 800);
        return;
      }
    } catch (e) {}

    // Check localStorage for registered vendor
    try {
      const saved = localStorage.getItem('smartgov_vendor_user');
      if (saved) {
        const vendor = JSON.parse(saved);
        if (vendor.email === username || vendor.id === username) {
          showToast(`Welcome back, ${vendor.contact_person || vendor.company_name}!`, 'success');
          setTimeout(() => {
            setIsLoading(false);
            onNavigateDashboard(vendor.id);
          }, 800);
          return;
        }
      }
    } catch (e) {}

    // Fallback demo vendor
    const demoVendor = {
      id: 'VND-1001',
      role: 'vendor',
      company_name: 'ABC Infra Pvt Ltd',
      contact_person: 'Rajesh Kumar',
      email: username,
      specialization: 'Infrastructure'
    };
    localStorage.setItem('smartgov_vendor_user', JSON.stringify(demoVendor));
    showToast(`Welcome back, ${demoVendor.contact_person}!`, 'success');
    setTimeout(() => {
      setIsLoading(false);
      onNavigateDashboard(demoVendor.id);
    }, 800);
  };

  return (
    <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 mx-auto my-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* LEFT HERO PANEL */}
        <div className="lg:col-span-6 bg-gradient-to-b from-[#1a103c] via-[#24185a] to-[#2d1f6e] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-400 flex items-center justify-center shadow-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold tracking-tight">
                <span>SmartGov</span> <span className="text-violet-400 font-semibold">Insight</span>
              </div>
            </div>

            <div className="w-10 h-1 bg-violet-400 rounded-full mb-6"></div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full mb-4">
              <Briefcase className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider">Vendor Portal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
              Deliver Excellence,<br />
              <span className="text-violet-400">Build Trust</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
              Manage your assigned projects, submit milestone updates, and track your vendor performance score.
            </p>
          </div>

          <div className="relative pt-6 border-t border-slate-700/40 z-10">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/70 border border-violet-500/20 rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-violet-400">12</div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Assigned</div>
              </div>
              <div className="bg-slate-800/70 border border-violet-500/20 rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-violet-400">4.5</div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Rating</div>
              </div>
              <div className="bg-slate-800/70 border border-violet-500/20 rounded-xl p-3 text-center">
                <div className="text-lg font-extrabold text-violet-400">92%</div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Performance</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT LOGIN PANEL */}
        <div className="lg:col-span-6 bg-slate-50/70 p-8 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm">Vendor <span className="text-violet-600">Portal</span></span>
            </div>
            <div className="flex items-center gap-3">
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
          </div>

          <div className="max-w-md mx-auto w-full my-auto py-4">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-200">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back!</h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1.5">Login to your vendor dashboard</p>
            </div>

            {toast.message && (
              <div className={`mb-4 p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 border shadow-sm ${
                toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800'
                : toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <span>{toast.message}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Email or Company ID</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your email or company ID"
                    className="block w-full rounded-xl border-0 py-3.5 pl-10 pr-4 text-slate-900 ring-1 ring-slate-200 text-sm bg-white focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="block w-full rounded-xl border-0 py-3.5 pl-10 pr-11 text-slate-900 ring-1 ring-slate-200 text-sm bg-white focus:ring-2 focus:ring-violet-500" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600">
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-sm font-semibold text-white shadow-md transition-all mt-6 ${
                  isLoading ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700'
                }`}>
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
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-xs sm:text-sm text-slate-500 font-medium">
              Don't have an account?{' '}
              <button type="button" onClick={onNavigateRegister} className="font-bold text-violet-600 hover:underline ml-1">
                Register as Vendor
              </button>
            </div>
          </div>

          <div></div>
        </div>
      </div>
    </div>
  );
}
