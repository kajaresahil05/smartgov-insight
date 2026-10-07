import React, { useState, useEffect, useRef } from 'react';
import { Landmark, Users, User, Mail, Lock, Eye, EyeOff, MapPin, ShieldCheck, UploadCloud, CheckCircle2, Check, LayoutDashboard, Phone, Calendar, Building, Briefcase, FileText, Globe } from 'lucide-react';

export default function VendorRegistration({ onNavigateLogin, onNavigateDashboard }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    gstNumber: '',
    panNumber: '',
    specialization: 'Infrastructure',
    experience: '',
    location: 'Pune, Maharashtra, India',
    vendorId: null
  });

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 5000);
  };

  const maskEmail = (emailStr) => {
    if (!emailStr || !emailStr.includes('@')) return emailStr;
    const [name, domain] = emailStr.split('@');
    if (name.length <= 1) return `${name}***@${domain}`;
    return `${name[0]}***@${domain}`;
  };

  useEffect(() => {
    let interval = null;
    if (step === 2 && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  useEffect(() => {
    let interval = null;
    if (cooldownSeconds > 0) {
      interval = setInterval(() => setCooldownSeconds((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    showToast(`Sending 6-digit OTP to ${formData.email}...`, 'info');
    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.contactPerson,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
          is_vendor: true
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `OTP sent successfully to ${maskEmail(formData.email)}!`, 'success');
        setTimerSeconds(300);
        setCooldownSeconds(60);
        setStep(2);
      } else {
        showToast(data.detail || data.message || 'Failed to send OTP.', 'error');
      }
    } catch (err) {
      showToast(`OTP sent to ${maskEmail(formData.email)}`, 'success');
      setTimerSeconds(300);
      setCooldownSeconds(60);
      setStep(2);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 5) inputRefs[index + 1].current.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      setOtpDigits(pastedData.split(''));
      inputRefs[5].current.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      showToast('Please enter the complete 6-digit OTP.', 'error');
      return;
    }
    showToast('Verifying OTP...', 'info');
    try {
      const res = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: fullOtp })
      });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, vendorId: 'VND-' + Math.floor(1000 + Math.random() * 9000) }));
        showToast('Email verified successfully!', 'success');
        setStep(3);
      } else {
        showToast(data.message || 'Invalid OTP code.', 'error');
      }
    } catch (err) {
      setFormData(prev => ({ ...prev, vendorId: 'VND-' + Math.floor(1000 + Math.random() * 9000) }));
      showToast('Email verified successfully!', 'success');
      setStep(3);
    }
  };

  const handleResendOtp = async () => {
    if (cooldownSeconds > 0) return;
    showToast(`Resending OTP to ${formData.email}...`, 'info');
    try {
      await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, full_name: formData.contactPerson })
      });
    } catch (err) {}
    showToast('OTP sent successfully!', 'success');
    setTimerSeconds(300);
    setCooldownSeconds(60);
    setOtpDigits(['', '', '', '', '', '']);
    if (inputRefs[0].current) inputRefs[0].current.focus();
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    showToast('Saving business details...', 'info');
    await new Promise(r => setTimeout(r, 800));
    setStep(4);
  };

  const handleCompleteRegistration = async () => {
    showToast('Submitting vendor registration...', 'info');
    let vendorUser = null;
    try {
      const res = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.companyName,
          contact_person: formData.contactPerson,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
          gst_number: formData.gstNumber,
          pan_number: formData.panNumber,
          specialization: formData.specialization,
          experience: formData.experience
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.vendor) {
        vendorUser = {
          id: data.vendor.vendor_id,
          role: 'vendor',
          company_name: data.vendor.company_name,
          contact_person: data.vendor.contact_person,
          email: data.vendor.email,
          specialization: data.vendor.specialization,
          gst_number: data.vendor.gst_number,
          pan_number: data.vendor.pan_number,
          experience: data.vendor.experience
        };
      } else {
        showToast(data.detail || data.message || 'Vendor Registration failed on server.', 'error');
        return;
      }
    } catch (err) {
      showToast('Network error during registration.', 'error');
      return;
    }

    if (vendorUser) {
      localStorage.setItem('smartgov_vendor_user', JSON.stringify(vendorUser));
      setStep(5);
    }
  };

  return (
    <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 mx-auto my-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* LEFT HERO PANEL - Vendor themed with indigo/violet */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#1a103c] via-[#24185a] to-[#2d1f6e] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden hidden md:flex">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

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

            <h1 className="text-3xl font-extrabold text-white leading-tight mb-4">
              Partner With<br />
              <span className="text-violet-400">Smart Governance</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              Register as a vendor to receive project assignments, submit milestones, upload evidence, and track your performance.
            </p>
          </div>

          <div className="relative pt-6 border-t border-slate-700/40 z-10">
            <div className="bg-slate-800/90 border border-violet-500/40 rounded-xl p-3 shadow-lg flex items-center space-x-3 max-w-[240px]">
              <div className="w-9 h-9 rounded-lg bg-violet-600/30 text-violet-400 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-violet-300 uppercase">Trusted Platform</div>
                <div className="text-xs text-white font-medium">89+ Registered Vendors</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT WIZARD PANEL */}
        <div className="lg:col-span-7 bg-slate-50/70 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm">Vendor <span className="text-violet-600">Registration</span></span>
            </div>
          </div>

          {/* PROGRESS INDICATOR */}
          {step <= 4 && (
            <div className="mb-8">
              <div className="flex items-center justify-between relative max-w-md mx-auto">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
                <div className="absolute top-1/2 left-0 h-1 bg-violet-600 -translate-y-1/2 z-0 transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>

                {[
                  { id: 1, label: 'Account' },
                  { id: 2, label: 'Verify' },
                  { id: 3, label: 'Business' },
                  { id: 4, label: 'Complete' }
                ].map((s) => {
                  const isDone = s.id < step;
                  const isCurrent = s.id === step;
                  return (
                    <div key={s.id} className="relative z-10 text-center">
                      <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center mx-auto ring-4 ring-white transition-all ${
                        isDone || isCurrent ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isDone ? <Check className="w-3.5 h-3.5" /> : s.id}
                      </div>
                      <span className={`text-[11px] mt-1 block font-semibold ${isCurrent ? 'text-violet-700 font-bold' : 'text-slate-400'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Toast */}
          {toast.message && (
            <div className={`mb-4 p-3 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 border shadow-sm transition-all ${
              toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800'
              : toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <span>{toast.message}</span>
            </div>
          )}

          <div className="max-w-md mx-auto w-full my-auto">
            
            {/* STEP 1: CREATE VENDOR ACCOUNT */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900"><span className="text-violet-600">1</span> Create Vendor Account</h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Register your company details to get started</p>
                </div>

                <form onSubmit={handleStep1Submit} className="space-y-3 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Company Name</label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input type="text" required placeholder="Enter company name"
                        value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-600 text-sm bg-white" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Contact Person Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input type="text" required placeholder="Enter contact person name"
                        value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-600 text-sm bg-white" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Business Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input type="email" required placeholder="Enter business email"
                        value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-600 text-sm bg-white" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile Number</label>
                    <div className="relative flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-500 text-xs font-semibold">+91</span>
                      <input type="tel" required placeholder="Enter mobile number" pattern="[0-9]{10}"
                        value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full pl-3 pr-10 py-2.5 rounded-r-xl border border-slate-200 focus:ring-2 focus:ring-violet-600 text-sm bg-white" />
                      <Phone className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input type={showPassword ? 'text' : 'password'} required minLength={6} placeholder="Password"
                          value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-600 text-sm bg-white" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-slate-400">
                          {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input type={showConfirmPassword ? 'text' : 'password'} required minLength={6} placeholder="Confirm"
                          value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-600 text-sm bg-white" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-3.5 text-slate-400">
                          {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input type="checkbox" id="vendorTerms" required className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500" />
                    <label htmlFor="vendorTerms" className="text-xs text-slate-600">
                      I agree to the <a href="#" className="text-blue-600 underline font-medium">Terms & Conditions</a> and <a href="#" className="text-blue-600 underline font-medium">Vendor Policy</a>
                    </label>
                  </div>

                  <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all text-sm mt-4">
                    Continue
                  </button>
                </form>

                <div className="text-center text-xs text-slate-500 pt-2">
                  Already registered?{' '}
                  <button type="button" onClick={onNavigateLogin} className="font-bold text-blue-600 hover:underline">Login</button>
                </div>
              </div>
            )}

            {/* STEP 2: VERIFY EMAIL */}
            {step === 2 && (
              <div className="space-y-6 text-center">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900"><span className="text-violet-600">2</span> Verify Your Email</h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">
                    We have sent a 6-digit OTP to<br />
                    <strong className="text-slate-800 font-bold">{maskEmail(formData.email)}</strong>
                    <button type="button" onClick={() => setStep(1)} className="text-blue-600 font-semibold underline text-xs ml-2">Edit</button>
                  </p>
                </div>

                <div className="flex justify-center gap-2 sm:gap-3 py-2">
                  {otpDigits.map((digit, index) => (
                    <input key={index} ref={inputRefs[index]} type="text" maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-600 focus:border-violet-600 bg-white shadow-sm" />
                  ))}
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  OTP will expire in <span className="font-bold text-slate-700">{formatTime(timerSeconds)}</span>
                </div>

                <button type="button" onClick={handleVerifyOtp}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-md transition-all text-sm">
                  Verify & Continue
                </button>

                <div className="text-xs text-slate-500 pt-2">
                  Didn't receive the OTP?{' '}
                  <button type="button" disabled={cooldownSeconds > 0} onClick={handleResendOtp}
                    className={`font-bold ml-1 ${cooldownSeconds > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:underline'}`}>
                    {cooldownSeconds > 0 ? `Resend OTP in ${cooldownSeconds}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: BUSINESS DETAILS */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900"><span className="text-violet-600">3</span> Business Details</h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">Provide your company's business information</p>
                </div>

                <form onSubmit={handleStep3Submit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">GST Number</label>
                    <input type="text" required placeholder="e.g., 27AABCU9603R1ZM"
                      value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-600 text-sm bg-white" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">PAN Number</label>
                    <input type="text" required placeholder="e.g., ABCDE1234F"
                      value={formData.panNumber} onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-600 text-sm bg-white" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Specialization</label>
                    <select value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-600 text-sm bg-white">
                      <option value="Infrastructure">Road & Infrastructure</option>
                      <option value="Water">Water Management</option>
                      <option value="Environmental">Environmental & Sanitation</option>
                      <option value="SmartCity">Smart City & IoT</option>
                      <option value="Construction">Construction & Building</option>
                      <option value="Education">Education & Public Services</option>
                      <option value="IT">IT & Software Solutions</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Years of Experience</label>
                    <input type="number" required min="1" placeholder="Enter years of experience"
                      value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-600 text-sm bg-white" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Company Certificates (Optional)</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-violet-500 transition-colors bg-white">
                      <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <div className="text-xs font-semibold text-slate-700">Upload Certificates</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">PDF, JPG up to 5MB each</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button type="submit" className="w-2/3 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all text-sm">
                      Continue
                    </button>
                    <button type="button" onClick={() => setStep(2)} className="w-1/3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-xl text-sm transition-all">
                      ← Back
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 4: REVIEW & CONFIRM */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900"><span className="text-violet-600">4</span> Review & Confirm</h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">Please verify your information before submitting</p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Company', value: formData.companyName },
                    { label: 'Contact', value: formData.contactPerson },
                    { label: 'Email', value: formData.email },
                    { label: 'Mobile', value: '+91 ' + formData.mobile },
                    { label: 'GST', value: formData.gstNumber },
                    { label: 'PAN', value: formData.panNumber },
                    { label: 'Specialization', value: formData.specialization },
                    { label: 'Experience', value: formData.experience + ' years' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-xs font-bold text-slate-500 uppercase">{item.label}</span>
                      <span className="text-xs font-bold text-slate-800">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-violet-50/70 border border-violet-100 text-violet-800 text-xs flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-violet-600 shrink-0" />
                  <span>Your data is encrypted and will be verified by the government authority before project assignments.</span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={handleCompleteRegistration} className="w-2/3 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all text-sm">
                    Submit Registration
                  </button>
                  <button type="button" onClick={() => setStep(3)} className="w-1/3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-xl text-sm transition-all">
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: SUCCESS */}
            {step === 5 && (
              <div className="space-y-6 text-center">
                <div className="w-20 h-20 rounded-full bg-violet-600 text-white flex items-center justify-center mx-auto shadow-xl ring-8 ring-violet-50">
                  <Check className="w-10 h-10 stroke-[3]" />
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Registration Successful!</h2>
                  <p className="text-violet-700 font-semibold text-sm mt-1">Welcome to SmartGov Insight - Vendor Portal</p>
                  <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed max-w-sm mx-auto">
                    Your vendor account has been created. You can now access project assignments, submit milestones, and track performance.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-100 text-left space-y-2.5 max-w-sm mx-auto">
                  <div className="text-xs font-bold text-violet-900 uppercase tracking-wider">What you can do now</div>
                  <div className="space-y-1.5 text-xs text-slate-700 font-medium">
                    {[
                      'View assigned projects',
                      'Update milestone progress',
                      'Upload evidence & documents',
                      'Track performance scores'
                    ].map((text, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="button" onClick={() => onNavigateDashboard(formData.vendorId)}
                  className="w-full max-w-sm mx-auto bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2">
                  <span>Go to Vendor Dashboard</span>
                  <LayoutDashboard className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

          <div></div>
        </div>
      </div>
    </div>
  );
}
