import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Plus, Trash2, MapPin, Sparkles, Mic, Volume2, Image as ImageIcon, CheckCircle2, Navigation, AlertCircle } from 'lucide-react';

export default function SubmitComplaint({ userId, onNavigateBack, onSubmitSuccess }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('Road');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [location, setLocation] = useState('Kothrud, Pune, Maharashtra');
  const [photos, setPhotos] = useState([]);
  
  // AI & Speech States
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [mlCategory, setMlCategory] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('English'); // English | Hindi | Marathi
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  // AI Classification Trigger
  useEffect(() => {
    if (title.length > 3 || description.length > 5) {
      const timer = setTimeout(() => {
        classifyWithML();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [title, description]);

  const classifyWithML = async () => {
    try {
      const res = await fetch('/api/ai/classify-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      const json = await res.json();
      if (json.success && json.category) {
        setMlCategory(json);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAiPolish = async () => {
    if (!description.trim()) {
      setToast('Please write a brief description first.');
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/complaint-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: description })
      });
      const json = await res.json();
      if (json.success && json.suggestion) {
        setAiSuggestion(json.suggestion);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Voice Speech-to-Text Input
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please type your description.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'Hindi' ? 'hi-IN' : language === 'Marathi' ? 'mr-IN' : 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  // HTML5 Geolocation API
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation(`GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}) - Kothrud, Pune`);
          setToast('GPS location retrieved!');
        },
        () => setToast('Could not retrieve GPS. Using default area.')
      );
    }
  };

  // Photo Upload Handler with Validation
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 5) {
      alert('Maximum 5 photos allowed.');
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 5MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (idx) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setToast('Saving complaint to database...');

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId || 1,
          title,
          category,
          description,
          urgency,
          location,
          images: photos
        })
      });

      const json = await res.json();
      if (json.success && json.complaint) {
        setStep(5);
        if (onSubmitSuccess) onSubmitSuccess(json.complaint);
      } else {
        setToast(json.message || 'Error submitting complaint');
        setIsSubmitting(false);
      }
    } catch (e) {
      setToast('Network error saving to database.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xs max-w-xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={onNavigateBack} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Submit New Complaint</h2>
        </div>

        {/* Multilingual Selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700"
        >
          <option value="English">EN (English)</option>
          <option value="Hindi">HI (हिंदी)</option>
          <option value="Marathi">MR (मराठी)</option>
        </select>
      </div>

      {/* Stepper Progress Bar (Steps 1 to 4) */}
      {step < 5 && (
        <div className="flex items-center justify-between relative max-w-md mx-auto py-1">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
          
          {[
            { num: 1, label: 'Details' },
            { num: 2, label: 'Location' },
            { num: 3, label: 'Evidence' },
            { num: 4, label: 'Review' }
          ].map((s) => (
            <div key={s.num} className="relative z-10 text-center cursor-pointer" onClick={() => step > s.num && setStep(s.num)}>
              <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center mx-auto ring-4 ring-white ${step >= s.num ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-[11px] font-bold mt-1 block ${step >= s.num ? 'text-emerald-700' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* STEP 1: DETAILS + AI WRITING & ML CLASSIFICATION */}
      {step === 1 && (
        <div className="space-y-4 pt-1">
          
          {/* ML Category Suggestion Badge */}
          {mlCategory && (
            <div className="p-3 bg-[#eefdf5] border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>AI Suggested Category: <strong className="underline">{mlCategory.category}</strong> ({mlCategory.confidence}% confidence)</span>
              </div>
              <button
                type="button"
                onClick={() => setCategory(mlCategory.category)}
                className="px-2.5 py-1 bg-emerald-600 text-white font-extrabold rounded-lg text-[10px]"
              >
                Apply
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:ring-2 focus:ring-emerald-600"
            >
              <option value="Road">🏛️ Road</option>
              <option value="Water">💧 Water</option>
              <option value="Drainage">🌊 Drainage</option>
              <option value="Garbage">🗑️ Garbage</option>
              <option value="Streetlight">💡 Streetlight</option>
              <option value="Electricity">⚡ Electricity</option>
              <option value="Other">📍 Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Title of Complaint</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Potholes on Paud Road junction"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Description + Voice + AI Polishing Controls */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border flex items-center space-x-1 transition-all ${
                    isListening ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Mic className="w-3 h-3 text-rose-500" />
                  <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAiPolish}
                  disabled={isAiLoading}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>{isAiLoading ? 'Polishing...' : 'AI Polish'}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue clearly or click Voice Input to speak..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600"
            ></textarea>
          </div>

          {/* AI Suggestion Interactive Card */}
          {aiSuggestion && (
            <div className="p-3.5 bg-[#f5f3ff] border border-purple-200 rounded-2xl space-y-2">
              <div className="text-[11px] font-extrabold text-purple-900 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>AI Suggested Description:</span>
              </div>
              <p className="text-xs font-medium text-purple-950 leading-relaxed italic bg-white p-2.5 rounded-xl border border-purple-100">
                "{aiSuggestion}"
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setDescription(aiSuggestion); setAiSuggestion(''); }}
                  className="px-3 py-1 bg-emerald-600 text-white font-bold text-[11px] rounded-lg shadow-xs"
                >
                  Use Suggestion
                </button>
                <button
                  type="button"
                  onClick={() => setAiSuggestion('')}
                  className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-[11px] rounded-lg"
                >
                  Ignore
                </button>
              </div>
            </div>
          )}

          {/* Urgency */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Urgency Level</label>
            <div className="grid grid-cols-3 gap-2">
              {['Low', 'Medium', 'High'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setUrgency(level)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    urgency === level
                      ? level === 'High'
                        ? 'border-rose-300 bg-rose-50 text-rose-700 ring-2 ring-rose-200'
                        : 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!title.trim()}
            onClick={() => setStep(2)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-3 px-4 rounded-xl shadow-md text-xs mt-2"
          >
            Next: Select Location ➔
          </button>

        </div>
      )}

      {/* STEP 2: LOCATION */}
      {step === 2 && (
        <div className="space-y-4 pt-1">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Problem Location</label>
              <button
                type="button"
                onClick={handleGetLocation}
                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center space-x-1"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>Use Current GPS Location</span>
              </button>
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kothrud, Pune, Maharashtra 411038"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Location Map Visual */}
          <div className="h-40 rounded-2xl overflow-hidden bg-slate-100 relative border border-slate-200 flex items-center justify-center">
            <div className="absolute inset-0 bg-cover bg-center opacity-75" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80')` }}></div>
            <div className="relative z-10 bg-emerald-600 text-white p-2 rounded-full shadow-lg">
              <MapPin className="w-5 h-5 fill-white" />
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md text-xs"
            >
              Next: Upload Evidence ➔
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: EVIDENCE / PHOTOS */}
      {step === 3 && (
        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Upload Photo Evidence (Max 5, up to 5MB each)</label>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {photos.map((src, idx) => (
                <div key={idx} className="h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group">
                  <img src={src} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {photos.length < 5 && (
                <label className="h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-600 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 cursor-pointer">
                  <Plus className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-bold">Add Photo</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md text-xs"
            >
              Next: Review Details ➔
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW */}
      {step === 4 && (
        <div className="space-y-4 pt-1">
          <div className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2">Review Complaint Information</div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2.5 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Category & Title</span>
              <div className="font-extrabold text-slate-900 mt-0.5">{category} • {title}</div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Description</span>
              <p className="font-medium text-slate-700 leading-relaxed mt-0.5">{description}</p>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Urgency</span>
                <span className="font-bold text-rose-600">{urgency}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Photos</span>
                <span className="font-bold text-slate-800">{photos.length} uploaded</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs"
            >
              Back
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md text-xs"
            >
              {isSubmitting ? 'Submitting to Database...' : 'Confirm & Submit Complaint'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: SUCCESS */}
      {step === 5 && (
        <div className="py-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-md">
            ✓
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Complaint Submitted Successfully!</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Your complaint has been logged into the database and assigned to the municipal department.</p>
          </div>

          <button
            type="button"
            onClick={onNavigateBack}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md text-xs"
          >
            Track Complaint Status
          </button>
        </div>
      )}

    </div>
  );
}
