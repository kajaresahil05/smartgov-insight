import React, { useState, useEffect, useRef } from 'react';
import { Landmark, Users, User, Mail, Lock, Eye, EyeOff, LocateFixed, Search, MapPin, ShieldCheck, UploadCloud, CheckCircle2, Check, LayoutDashboard, Phone, Calendar } from 'lucide-react';

export default function CitizenRegistration({ onNavigateLogin, onNavigateDashboard }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    location: 'Kothrud, Pune, Maharashtra 411038, India',
    dob: '',
    language: 'English',
    userId: null
  });

  // OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 mins
  const [cooldownSeconds, setCooldownSeconds] = useState(0); // 60s cooldown
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [locationMode, setLocationMode] = useState('auto');

  // Toast Notification
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
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  useEffect(() => {
    let interval = null;
    if (cooldownSeconds > 0) {
      interval = setInterval(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
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
      showToast('Passwords do not match. Please verify both password fields.', 'error');
      return;
    }

    showToast(`Sending 6-digit OTP to ${formData.email}...`, 'info');

    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.detail || data.message || 'Email could not be sent. Please check your credentials.', 'error');
        return;
      }

      showToast(`OTP sent successfully to ${maskEmail(formData.email)}! Check your inbox.`, 'success');
      setTimerSeconds(300);
      setCooldownSeconds(60);
      setStep(2);

    } catch (err) {
      showToast('Server error connecting to backend API.', 'error');
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
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
      const newDigits = pastedData.split('');
      setOtpDigits(newDigits);
      inputRefs[5].current.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      showToast('Please enter the complete 6-digit OTP.', 'error');
      return;
    }

    if (timerSeconds <= 0) {
      showToast('OTP expired. Please request a new code.', 'error');
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

      if (!res.ok || !data.success) {
        showToast(data.message || 'Invalid OTP', 'error');
        return;
      }

      if (data.user) {
        setFormData((prev) => ({ ...prev, userId: data.user.id }));
      }

      showToast('Email verified successfully!', 'success');
      setStep(3);

    } catch (err) {
      showToast('Server error verifying OTP.', 'error');
    }
  };

  const handleResendOtp = async () => {
    if (cooldownSeconds > 0) {
      showToast(`Please wait ${cooldownSeconds} seconds before requesting another OTP`, 'error');
      return;
    }

    showToast(`Resending OTP to ${formData.email}...`, 'info');

    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || 'Could not resend OTP.', 'error');
        return;
      }

      showToast('OTP sent successfully!', 'success');
      setTimerSeconds(300);
      setCooldownSeconds(60);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs[0].current.focus();

    } catch (err) {
      showToast('Error requesting new OTP.', 'error');
    }
  };

  const handleSaveLocation = async () => {
    try {
      await fetch('/api/auth/register-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: formData.userId, location: formData.location })
      });
      setStep(4);
    } catch (e) {
      setStep(4);
    }
  };

  const handleStep4Submit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: formData.userId,
          dob: formData.dob,
          language: formData.language
        })
      });

      const data = await res.json();
      if (data.user) {
        localStorage.setItem('smartgov_user', JSON.stringify(data.user));
      }
      setStep(5);
    } catch (err) {
      setStep(5);
    }
  };

  return (
    <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 mx-auto my-4">


      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* LEFT HERO PANEL */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0b1b36] via-[#102a4d] to-[#1a3d68] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden hidden md:flex">
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

            <h1 className="text-3xl font-extrabold text-white leading-tight mb-4">
              Together, We Build <br />
              <span className="text-emerald-400">Better Communities</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              Report issues, track progress, and stay informed about government projects in your area.
            </p>
          </div>

          <div className="relative pt-6 border-t border-slate-700/40">
            <div className="bg-slate-800/90 border border-emerald-500/40 rounded-xl p-3 shadow-lg flex items-center space-x-3 max-w-[210px]">
              <div className="w-9 h-9 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-emerald-300 uppercase">Better Tomorrow</div>
                <div className="text-xs text-white font-medium">Starts Today</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT WIZARD PANEL */}
        <div className="lg:col-span-7 bg-slate-50/70 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Landmark className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-sm">SmartGov <span className="text-emerald-600">Insight</span></span>
          </div>

          {/* PROGRESS INDICATOR */}
          {step <= 4 && (
            <div className="mb-8">
              <div className="flex items-center justify-between relative max-w-md mx-auto">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
                <div
                  className="absolute top-1/2 left-0 h-1 bg-emerald-600 -translate-y-1/2 z-0 transition-all duration-300"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                ></div>

                {[
                  { id: 1, label: 'Account' },
                  { id: 2, label: 'Verify' },
                  { id: 3, label: 'Location' },
                  { id: 4, label: 'Complete' }
                ].map((s) => {
                  const isDone = s.id < step;
                  const isCurrent = s.id === step;
                  return (
                    <div key={s.id} className="relative z-10 text-center">
                      <div
                        className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center mx-auto ring-4 ring-white transition-all ${
                          isDone || isCurrent ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : s.id}
                      </div>
                      <span className={`text-[11px] mt-1 block font-semibold ${isCurrent ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TOAST ALERT BANNER */}
          {toast.message && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 border shadow-sm transition-all ${
                toast.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <span>{toast.message}</span>
            </div>
          )}

          {/* WIZARD VIEWS */}
          <div className="max-w-md mx-auto w-full my-auto">
            
            {/* STEP 1: CREATE ACCOUNT */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900"><span className="text-emerald-600">1</span> Create Your Account</h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Fill in your details to get started</p>
                </div>

                <form onSubmit={handleStep1Submit} className="space-y-3 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-600 text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="Enter your email address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-600 text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile Number</label>
                    <div className="relative flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-500 text-xs font-semibold">+91</span>
                      <input
                        type="tel"
                        required
                        placeholder="Enter your mobile number"
                        pattern="[0-9]{10}"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full pl-3 pr-10 py-2.5 rounded-r-xl border border-slate-200 focus:ring-2 focus:ring-emerald-600 text-sm bg-white"
                      />
                      <Phone className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-600 text-sm bg-white"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-slate-400">
                        {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-600 text-sm bg-white"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-3.5 text-slate-400">
                        {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input type="checkbox" id="termsCheck" required className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                    <label htmlFor="termsCheck" className="text-xs text-slate-600">
                      I agree to the <a href="#" className="text-blue-600 underline font-medium">Terms & Conditions</a> and <a href="#" className="text-blue-600 underline font-medium">Privacy Policy</a>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all text-sm mt-4"
                  >
                    Continue
                  </button>
                </form>

                <div className="text-center text-xs text-slate-500 pt-2">
                  Already have an account?{' '}
                  <button type="button" onClick={onNavigateLogin} className="font-bold text-blue-600 hover:underline">
                    Login
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: VERIFY MOBILE / EMAIL */}
            {step === 2 && (
              <div className="space-y-6 text-center">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900"><span className="text-emerald-600">2</span> Verify Your Email</h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">
                    We have sent a 6-digit OTP to<br />
                    <strong className="text-slate-800 font-bold">{maskEmail(formData.email)}</strong>
                    <button type="button" onClick={() => setStep(1)} className="text-blue-600 font-semibold underline text-xs ml-2">
                      Edit
                    </button>
                  </p>
                </div>

                <div className="flex justify-center gap-2 sm:gap-3 py-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white shadow-sm"
                    />
                  ))}
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  OTP will expire in <span className="font-bold text-slate-700">{formatTime(timerSeconds)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-md transition-all text-sm"
                >
                  Verify & Continue
                </button>

                <div className="text-xs text-slate-500 pt-2">
                  Didn't receive the OTP?{' '}
                  <button
                    type="button"
                    disabled={cooldownSeconds > 0}
                    onClick={handleResendOtp}
                    className={`font-bold ml-1 ${cooldownSeconds > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:underline'}`}
                  >
                    {cooldownSeconds > 0 ? `Resend OTP in ${cooldownSeconds}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SET LOCATION */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900"><span className="text-emerald-600">3</span> Set Your Location</h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">This helps us show you relevant projects and issues in your area</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setLocationMode('auto'); showToast('Location updated via GPS!', 'success'); }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                      locationMode === 'auto'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <LocateFixed className="w-6 h-6 mb-1 text-emerald-600" />
                    <span className="text-xs font-bold">Use Current Location</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocationMode('manual')}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                      locationMode === 'manual'
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <Search className="w-6 h-6 mb-1 text-slate-500" />
                    <span className="text-xs font-bold">Search Manually</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Location Detected</div>
                      <button type="button" className="text-xs font-bold text-blue-600 hover:underline">Change</button>
                    </div>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full text-xs font-bold text-slate-800 bg-transparent border-0 p-0 mt-1 focus:ring-0"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-800 text-xs flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>Your location is used only to improve your experience and will never be shared.</span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveLocation}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-md transition-all text-sm"
                >
                  Continue
                </button>
              </div>
            )}

            {/* STEP 4: ADDITIONAL INFORMATION */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    <span className="text-emerald-600">4</span> Additional Information <span className="text-slate-400 font-normal text-base">(Optional)</span>
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">Tell us a bit more about yourself</p>
                </div>

                <form onSubmit={handleStep4Submit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Date of Birth (Optional)</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="DD / MM / YYYY"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-600 text-sm bg-white"
                      />
                      <Calendar className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Preferred Language</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-600 text-sm bg-white"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">हिन्दी (Hindi)</option>
                      <option value="Marathi">मराठी (Marathi)</option>
                      <option value="Spanish">Español</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Profile Picture (Optional)</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors bg-white">
                      <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <div className="text-xs font-semibold text-slate-700">Upload Photo</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">JPG, PNG up to 2MB</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all text-sm"
                    >
                      Finish Registration
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="w-1/3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-xl text-sm transition-all"
                    >
                      ← Back
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 5: REGISTRATION SUCCESS */}
            {step === 5 && (
              <div className="space-y-6 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xl ring-8 ring-emerald-50">
                  <Check className="w-10 h-10 stroke-[3]" />
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Registration Successful!</h2>
                  <p className="text-emerald-700 font-semibold text-sm mt-1">Welcome to SmartGov Insight</p>
                  <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed max-w-sm mx-auto">
                    Your account has been created successfully. You can now start reporting issues and tracking projects in your area.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-left space-y-2.5 max-w-sm mx-auto">
                  <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">What you can do now?</div>
                  <div className="space-y-1.5 text-xs text-slate-700 font-medium">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Submit complaints and suggestions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Track your complaints</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>View projects in your area</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateDashboard(formData.userId)}
                  className="w-full max-w-sm mx-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                >
                  <span>Go to Dashboard</span>
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
