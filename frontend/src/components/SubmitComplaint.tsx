import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Check, Plus, Trash2, MapPin, Sparkles, Mic,
  Image as ImageIcon, CheckCircle2, Navigation, AlertCircle,
  Loader2, Layers, ExternalLink, X, RefreshCw, Compass
} from 'lucide-react';
import { LocationMapPicker } from './common/LocationMapPicker';
import {
  requestDeviceLocation,
  reverseGeocodeCoordinates,
  getAccuracyInfo
} from '../services/locationService';

export default function SubmitComplaint({ userId, onNavigateBack, onSubmitSuccess }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('Road');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [location, setLocation] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('smartgov_user') || '{}');
      return u.location || 'Kothrud, Pune, Maharashtra';
    } catch {
      return 'Kothrud, Pune, Maharashtra';
    }
  });
  const [latitude, setLatitude] = useState<number>(() => {
    try {
      const u = JSON.parse(localStorage.getItem('smartgov_user') || '{}');
      return typeof u.preferred_latitude === 'number' ? u.preferred_latitude : 18.5074;
    } catch {
      return 18.5074;
    }
  });
  const [longitude, setLongitude] = useState<number>(() => {
    try {
      const u = JSON.parse(localStorage.getItem('smartgov_user') || '{}');
      return typeof u.preferred_longitude === 'number' ? u.preferred_longitude : 73.8077;
    } catch {
      return 73.8077;
    }
  });
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationSource, setLocationSource] = useState<'gps' | 'map_picker' | 'search' | 'manual'>('map_picker');
  const [locationMode, setLocationMode] = useState<'current_gps' | 'pick_map'>('pick_map');
  const [isLocating, setIsLocating] = useState(false);
  const [photos, setPhotos] = useState([]);
  
  // AI & Speech States
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [mlCategory, setMlCategory] = useState(null);
  const [mlUrgency, setMlUrgency] = useState(null);
  const [isUrgencyLoading, setIsUrgencyLoading] = useState(false);
  const isUrgencyManual = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('English');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  // Duplicate Complaint Detection (Model 3) States
  const [duplicateResult, setDuplicateResult] = useState(null);
  const [isDupLoading, setIsDupLoading] = useState(false);
  const [dupError, setDupError] = useState(false);
  const [linkAsDuplicate, setLinkAsDuplicate] = useState(false);
  const [viewingComplaint, setViewingComplaint] = useState(null);

  // Model 1 (Category) & Model 2 (Urgency) Trigger
  useEffect(() => {
    if (mlUrgency && !mlUrgency.stale) {
      setMlUrgency(prev => prev ? { ...prev, stale: true } : prev);
    }
    
    if (title.length > 3 || description.length > 5) {
      const timer = setTimeout(() => {
        classifyWithML();
        predictUrgencyWithML();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [title, description]);

  // Model 3 (Duplicate Complaint Detection) Trigger
  useEffect(() => {
    // Invalidate stale duplicate state when inputs change
    if (title.trim().length >= 3 || description.trim().length >= 5) {
      setIsDupLoading(true);
      setDupError(false);
      const timer = setTimeout(() => {
        checkDuplicatesWithML();
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setDuplicateResult(null);
      setIsDupLoading(false);
      setDupError(false);
      setLinkAsDuplicate(false);
    }
  }, [title, description, location]);

  const classifyWithML = async () => {
    try {
      const res = await fetch('/api/ai/classify-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category })
      });
      const json = await res.json();
      if (json.success && json.category) {
        setMlCategory(json);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const predictUrgencyWithML = async () => {
    setIsUrgencyLoading(true);
    try {
      const res = await fetch('/api/ai/predict-urgency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category })
      });
      if (!res.ok) throw new Error("API response error");
      const json = await res.json();
      if (json.success && json.urgency) {
        setMlUrgency({ ...json, stale: false, error: false });
        if (!isUrgencyManual.current) {
          setUrgency(json.urgency);
        }
      } else {
        setMlUrgency({ error: true, stale: false });
      }
    } catch (e) {
      console.error(e);
      setMlUrgency({ error: true, stale: false });
    } finally {
      setIsUrgencyLoading(false);
    }
  };

  const checkDuplicatesWithML = async () => {
    setIsDupLoading(true);
    setDupError(false);
    try {
      const res = await fetch('/api/detect-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          location,
          latitude,
          longitude,
          category,
          user_id: userId || 1
        })
      });
      if (!res.ok) throw new Error("API response error");
      const json = await res.json();
      if (json.success) {
        setDuplicateResult(json);
        // Pre-select link as duplicate if a likely match is detected
        if (json.has_duplicate && json.decision === 'likely_duplicate') {
          setLinkAsDuplicate(true);
        } else {
          setLinkAsDuplicate(false);
        }
      } else {
        setDupError(true);
      }
    } catch (e) {
      console.error(e);
      setDupError(true);
    } finally {
      setIsDupLoading(false);
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
        body: JSON.stringify({ text: description, title: title, category: category })
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

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please type your description.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'Hindi' ? 'hi-IN' : language === 'Marathi' ? 'mr-IN' : 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setToast('Acquiring device GPS...');
    try {
      const geoResult = await requestDeviceLocation();
      setLatitude(geoResult.coords.latitude);
      setLongitude(geoResult.coords.longitude);
      setLocationAccuracy(geoResult.accuracy);
      setLocationSource('gps');
      setLocationMode('current_gps');
      
      const geocode = await reverseGeocodeCoordinates(
        geoResult.coords.latitude,
        geoResult.coords.longitude
      );
      setLocation(geocode.formatted_address);
      setToast(`GPS acquired (±${Math.round(geoResult.accuracy)}m accuracy)`);
    } catch (err: any) {
      setToast(err?.message || 'Could not acquire GPS. Please choose on map.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleMapLocationChange = async (lat: number, lon: number, customAddr?: string) => {
    setLatitude(lat);
    setLongitude(lon);
    setLocationAccuracy(null);
    setLocationSource('map_picker');
    
    if (customAddr) {
      setLocation(customAddr);
      return;
    }

    try {
      const geocode = await reverseGeocodeCoordinates(lat, lon);
      setLocation(geocode.formatted_address);
    } catch {
      setLocation(`Civic Location (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E), Pune`);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
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
        setPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setToast('Saving complaint to database...');

    const parentId = (linkAsDuplicate && duplicateResult?.matched_complaint)
      ? duplicateResult.matched_complaint.id
      : null;

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
          latitude,
          longitude,
          location_accuracy: locationAccuracy,
          location_source: locationSource,
          parent_complaint_id: parentId,
          is_duplicate: linkAsDuplicate && !!duplicateResult?.matched_complaint,
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
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* STEP 1: DETAILS + AI WRITING + ML CLASSIFIER + DUPLICATE DETECTION */}
      {step === 1 && (
        <div className="space-y-4 pt-1">
          
          {/* ML Category Suggestion Badge (Model 1) */}
          {mlCategory && (
            <div className={`p-3 border rounded-2xl flex items-center justify-between text-xs ${(mlCategory.confidence || 0) >= 25.0 ? 'bg-[#eefdf5] border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center space-x-2 font-bold flex-1 pr-2">
                {(mlCategory.confidence || 0) >= 25.0 ? (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="text-emerald-900 flex flex-col space-y-0.5">
                      <span>AI Suggested: <strong className="underline decoration-1">{mlCategory.category}</strong></span>
                      <span className="text-[10px] font-semibold opacity-80">Confidence: {mlCategory.confidence}% • Model: Classifier Model 1</span>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="text-slate-600 flex flex-col space-y-0.5">
                      <span>AI is uncertain. Please select a category manually.</span>
                      <span className="text-[10px] font-semibold opacity-80">
                        Top Prediction: {mlCategory.category} ({mlCategory.confidence}%)
                      </span>
                    </div>
                  </>
                )}
              </div>
              
              {(mlCategory.confidence || 0) >= 25.0 && category !== mlCategory.category && (
                <button
                  type="button"
                  onClick={() => setCategory(mlCategory.category)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] shadow-xs transition-colors shrink-0 whitespace-nowrap"
                >
                  Apply suggestion
                </button>
              )}
            </div>
          )}

          {/* AI Urgency Display Panel (Model 2) */}
          {(mlUrgency || isUrgencyLoading) && (
            <div className={`p-4 border rounded-2xl flex flex-col text-xs transition-all ${
              isUrgencyLoading ? 'bg-slate-50 border-slate-200 opacity-75' :
              mlUrgency?.error ? 'bg-rose-50 border-rose-200' :
              mlUrgency?.urgency === 'Critical' ? 'bg-rose-50 border-rose-200' : 
              mlUrgency?.urgency === 'High' ? 'bg-orange-50 border-orange-200' : 
              mlUrgency?.urgency === 'Medium' ? 'bg-[#fffbeb] border-amber-200' : 
              'bg-[#eefdf5] border-emerald-200'
            } ${mlUrgency?.stale ? 'opacity-60 grayscale-[20%]' : 'opacity-100'}`}>
              
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center space-x-2 font-bold flex-1 pr-2">
                  {isUrgencyLoading ? (
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin shrink-0" />
                  ) : (
                    <AlertCircle className={`w-5 h-5 shrink-0 ${
                      mlUrgency?.error ? 'text-rose-600' :
                      mlUrgency?.urgency === 'Critical' ? 'text-rose-600' : 
                      mlUrgency?.urgency === 'High' ? 'text-[#e8701a]' : 
                      mlUrgency?.urgency === 'Medium' ? 'text-amber-500' : 
                      'text-emerald-600'
                    }`} />
                  )}
                  
                  <div className={`flex flex-col space-y-0.5 ${
                    isUrgencyLoading ? 'text-slate-700' :
                    mlUrgency?.error ? 'text-rose-900' :
                    mlUrgency?.urgency === 'Critical' ? 'text-rose-900' : 
                    mlUrgency?.urgency === 'High' ? 'text-[#cc5e12]' : 
                    mlUrgency?.urgency === 'Medium' ? 'text-amber-900' : 
                    'text-emerald-900'
                  }`}>
                    <span className="text-[13px] tracking-tight">AI-Predicted Complaint Urgency</span>
                    <span className="text-[10px] font-semibold opacity-70">
                      {isUrgencyLoading ? (
                        "Analyzing severity..."
                      ) : mlUrgency?.error ? (
                        "Error analyzing."
                      ) : (
                        <>Confidence: {mlUrgency?.confidence || (mlUrgency?.confidence === 0 ? 0 : '--')}% • Model: DistilBERT Model 2 {mlUrgency?.stale && '(Outdated)'}</>
                      )}
                    </span>
                  </div>
                </div>

                {!isUrgencyLoading && !mlUrgency?.error && mlUrgency?.urgency && (
                  <div className={`px-4 py-1.5 rounded-[10px] text-xs font-extrabold shadow-sm ${
                    mlUrgency.urgency === 'Critical' ? 'bg-rose-200 text-rose-900' : 
                    mlUrgency.urgency === 'High' ? 'bg-[#fed7aa] text-[#c2410c]' : 
                    mlUrgency.urgency === 'Medium' ? 'bg-[#fef3c7] text-[#b45309]' : 
                    'bg-[#d1fae5] text-[#065f46]'
                  }`}>
                    {mlUrgency.urgency}
                  </div>
                )}
              </div>
              
              {!isUrgencyLoading && mlUrgency?.error && (
                <div className="mt-3 ml-7 text-[11px] font-medium text-rose-700">
                  Unable to fetch urgency prediction. Please review priority manually.
                  <button type="button" onClick={predictUrgencyWithML} className="ml-2 underline font-bold hover:text-rose-900">Retry</button>
                </div>
              )}

              {!isUrgencyLoading && !mlUrgency?.error && (
                <div className={`mt-3 ml-7 text-[11px] font-medium opacity-90 ${
                  mlUrgency?.urgency === 'Critical' ? 'text-rose-900' : 
                  mlUrgency?.urgency === 'High' ? 'text-[#cc5e12]' : 
                  mlUrgency?.urgency === 'Medium' ? 'text-amber-900' : 
                  'text-emerald-900'
                }`}>
                  {mlUrgency?.reason || (mlUrgency?.confidence < 60 ? "AI is uncertain. Standard human review required." : "Priority attention recommended. This issue may cause safety risks and affect multiple people.")}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:ring-2 focus:ring-emerald-600"
            >
              <option value="Road">🏛️ Roads & Potholes</option>
              <option value="Water Supply">💧 Water Supply</option>
              <option value="Drainage & Flooding">🌊 Drainage & Flooding</option>
              <option value="Garbage & Sanitation">🗑️ Garbage & Sanitation</option>
              <option value="Street Lights">💡 Street Lights</option>
              <option value="Electricity">⚡ Electricity</option>
              <option value="Public Safety">🛡️ Public Safety</option>
              <option value="Public Transport">🚌 Public Transport</option>
              <option value="Healthcare">🏥 Healthcare</option>
              <option value="Education">🎓 Education</option>
              <option value="Government Services">📋 Government Services</option>
              <option value="Other Civic Issues">📍 Other Civic Issues</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Title of Complaint</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep pothole on Paud Road causing accidents"
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

          {/* Location in Step 1 (Quick verification for duplicate spatial matching) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Location (for Duplicate Spatial Matching)</span>
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center space-x-1"
              >
                {isLocating ? (
                  <Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />
                ) : (
                  <Navigation className="w-3 h-3 text-emerald-600" />
                )}
                <span>GPS Locate</span>
              </button>
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kothrud, Pune, Maharashtra"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* DUPLICATE COMPLAINT DETECTION CARD (MODEL 3) */}
          {(isDupLoading || dupError || duplicateResult) && (
            <div className="pt-1">
              {/* State 1: Checking for duplicates */}
              {isDupLoading && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center space-x-3 text-xs">
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-extrabold text-slate-800">Checking for similar complaints...</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      Comparing semantic meaning & geographic location against shared production database
                    </span>
                  </div>
                </div>
              )}

              {/* State 2: API Error */}
              {!isDupLoading && dupError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-900">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Unable to check duplicates right now. You can proceed with your report.</span>
                  </div>
                  <button
                    type="button"
                    onClick={checkDuplicatesWithML}
                    className="flex items-center space-x-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 underline ml-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              {/* State 3: No closely matching complaints found */}
              {!isDupLoading && !dupError && duplicateResult && !duplicateResult.has_duplicate && (
                <div className="p-4 bg-[#eefdf5] border border-emerald-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-extrabold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>No closely matching complaints found</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                      Unique Issue
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                    {duplicateResult.recommendation || "No prior reports match this issue at this location. Your submission will create an independent canonical complaint."}
                  </p>
                  <div className="pt-1 text-[10px] font-semibold text-emerald-700/80 flex items-center justify-between border-t border-emerald-100">
                    <span>Highest Semantic Similarity Score: {duplicateResult.similarity_percent}% (Cosine Metric)</span>
                    <span>Model 3 Semantic Engine</span>
                  </div>
                </div>
              )}

              {/* State 4: Similar Complaint Found */}
              {!isDupLoading && !dupError && duplicateResult && duplicateResult.has_duplicate && duplicateResult.matched_complaint && (
                <div className="p-4 bg-[#faf5ff] border border-purple-200 rounded-2xl space-y-3 text-xs shadow-xs">
                  {/* Card Title & Similarity Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <div className="p-1.5 bg-purple-100 text-purple-700 rounded-xl mt-0.5 shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-purple-950 text-[13px]">
                          {duplicateResult.decision === 'likely_duplicate' ? 'Similar Complaint Found' : 'Possible Match Found for Review'}
                        </div>
                        <div className="text-[10px] text-purple-700 font-medium mt-0.5">
                          {duplicateResult.location_comparison?.reason || 'Matching physical location in the area'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="px-2.5 py-1 bg-purple-100 text-purple-900 rounded-lg text-[10px] font-extrabold shadow-2xs">
                        Similarity Score: {duplicateResult.similarity_percent}%
                      </div>
                      <span className="text-[9px] text-purple-600 font-semibold block mt-0.5">
                        (Cosine Metric)
                      </span>
                    </div>
                  </div>

                  {/* Matched Complaint Summary Box */}
                  <div className="bg-white p-3 rounded-xl border border-purple-150 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        {duplicateResult.matched_complaint.ticket_number} • {duplicateResult.matched_complaint.category}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-bold">
                        {duplicateResult.matched_complaint.status}
                      </span>
                    </div>

                    <div className="font-extrabold text-slate-900 text-xs">
                      {duplicateResult.matched_complaint.title}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{duplicateResult.matched_complaint.location}</span>
                      </span>
                      <span>Filed: {duplicateResult.matched_complaint.created_at || 'Recently'}</span>
                    </div>

                    {/* View Complaint Button */}
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setViewingComplaint(duplicateResult.matched_complaint)}
                        className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Complaint Details</span>
                      </button>
                    </div>
                  </div>

                  {/* Association Decision Options */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-extrabold text-purple-900 uppercase tracking-wider block">
                      Choose How to Submit:
                    </span>

                    {/* Option 1: Submit as Associated Report */}
                    <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      linkAsDuplicate ? 'bg-purple-100/60 border-purple-400 ring-1 ring-purple-300' : 'bg-white border-purple-100 hover:bg-purple-50/50'
                    }`}>
                      <input
                        type="radio"
                        name="dup_choice"
                        checked={linkAsDuplicate}
                        onChange={() => setLinkAsDuplicate(true)}
                        className="mt-0.5 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="font-extrabold text-purple-950 text-xs">
                          Submit as Associated Report (Recommended)
                        </div>
                        <p className="text-[10px] text-purple-800 leading-normal mt-0.5">
                          Links your report to existing complaint {duplicateResult.matched_complaint.ticket_number}. Boosts municipal priority and aggregates citizen demand without creating duplicate tickets.
                        </p>
                      </div>
                    </label>

                    {/* Option 2: Continue as Separate Complaint */}
                    <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      !linkAsDuplicate ? 'bg-slate-100/80 border-slate-300 ring-1 ring-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="dup_choice"
                        checked={!linkAsDuplicate}
                        onChange={() => setLinkAsDuplicate(false)}
                        className="mt-0.5 text-slate-600 focus:ring-slate-500"
                      />
                      <div className="flex-1">
                        <div className="font-extrabold text-slate-800 text-xs">
                          Continue as Separate Complaint
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                          Files your issue independently with a unique ticket number if you believe this is an unrelated problem or distinct location.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Urgency */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Manual Urgency Override</span>
              {isUrgencyManual.current && (
                <span className="text-[9px] text-rose-500 font-extrabold uppercase">Manual Value</span>
              )}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    isUrgencyManual.current = true;
                    setUrgency(level);
                  }}
                  className={`py-2 rounded-xl text-[11px] font-bold border transition-all ${
                    urgency === level
                      ? level === 'Critical'
                        ? 'border-rose-400 bg-rose-50 text-rose-800 ring-2 ring-rose-200'
                        : level === 'High'
                        ? 'border-orange-400 bg-orange-50 text-orange-800 ring-2 ring-orange-200'
                        : level === 'Medium'
                        ? 'border-amber-400 bg-amber-50 text-amber-800 ring-2 ring-amber-200'
                        : 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200'
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
          {/* Dual Choice Header */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Choose Complaint Location Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setLocationMode('current_gps');
                  handleUseCurrentLocation();
                }}
                disabled={isLocating}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  locationMode === 'current_gps' && locationSource === 'gps'
                    ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2 text-blue-600 mb-1">
                  {isLocating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  <span className="text-xs font-extrabold text-slate-900">
                    Use My GPS Location
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Detects current device coordinates. Ideal if you are at the issue site.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLocationMode('pick_map')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  locationMode === 'pick_map' || locationSource !== 'gps'
                    ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-extrabold text-slate-900">
                    Choose on Map
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Click/drag pin anywhere in the city. Best if reporting from elsewhere.
                </p>
              </button>
            </div>
          </div>

          {/* Guidance Banner */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-2 text-[11px] text-slate-600">
            <Compass className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Civic Notice:</strong> You can file a complaint for an issue located anywhere in Pune. You do not need to be physically standing at the location right now.
            </span>
          </div>

          {/* Interactive Leaflet Map Component */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-slate-700">Interactive Location Picker</span>
              <span className="text-[10px] font-semibold text-emerald-700">
                Drag pin or search street to adjust
              </span>
            </div>

            <LocationMapPicker
              latitude={latitude}
              longitude={longitude}
              accuracy={locationAccuracy}
              locationSource={locationSource}
              interactive={true}
              height="280px"
              onLocationChange={handleMapLocationChange}
              onRequestGPS={handleUseCurrentLocation}
              gpsLoading={isLocating}
              showSearchBar={true}
            />
          </div>

          {/* Confirmed Address Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Confirmed Problem Address / Landmark</label>
              {locationSource === 'gps' && locationAccuracy != null && (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  GPS ±{Math.round(locationAccuracy)}m
                </span>
              )}
              {locationSource !== 'gps' && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Pinpoint on Map
                </span>
              )}
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Near Karve Statue, Paud Road, Kothrud, Pune"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-600"
            />
            <p className="text-[10px] text-slate-400 mt-1 font-mono">
              Coordinates: {latitude.toFixed(5)}°N, {longitude.toFixed(5)}°E
            </p>
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

            {/* DUPLICATE SUBMISSION STATUS IN REVIEW */}
            {linkAsDuplicate && duplicateResult?.matched_complaint ? (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                <span className="text-[10px] font-extrabold text-purple-900 uppercase block flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span>Submitting as Associated Report</span>
                </span>
                <p className="text-[11px] text-purple-950 font-semibold">
                  Linked to Canonical Complaint #{duplicateResult.matched_complaint.ticket_number} ({duplicateResult.matched_complaint.title})
                </p>
                <span className="text-[10px] text-purple-700 block">
                  Similarity Score: {duplicateResult.similarity_percent}% (Cosine Metric) • Your evidence will be attached to strengthen this issue.
                </span>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-150 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                  Submission Mode: New Independent Canonical Complaint
                </span>
              </div>
            )}

            {/* AI Urgency Display Panel (Model 2) */}
            {mlUrgency && !isUrgencyManual.current && (
              <div className={`p-4 border rounded-2xl flex flex-col text-xs mt-3 ${
                mlUrgency.urgency === 'Critical' ? 'bg-rose-50 border-rose-200' : 
                mlUrgency.urgency === 'High' ? 'bg-orange-50 border-orange-200' : 
                mlUrgency.urgency === 'Medium' ? 'bg-[#fffbeb] border-amber-200' : 
                'bg-[#eefdf5] border-emerald-200'
              }`}>
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center space-x-2 font-bold flex-1 pr-2">
                    <AlertCircle className={`w-5 h-5 shrink-0 ${
                      mlUrgency.urgency === 'Critical' ? 'text-rose-600' : 
                      mlUrgency.urgency === 'High' ? 'text-[#e8701a]' : 
                      mlUrgency.urgency === 'Medium' ? 'text-amber-500' : 
                      'text-emerald-600'
                    }`} />
                    <div className={`flex flex-col space-y-0.5 ${
                      mlUrgency.urgency === 'Critical' ? 'text-rose-900' : 
                      mlUrgency.urgency === 'High' ? 'text-[#cc5e12]' : 
                      mlUrgency.urgency === 'Medium' ? 'text-amber-900' : 
                      'text-emerald-900'
                    }`}>
                      <span className="text-[13px] tracking-tight">AI-Predicted Complaint Urgency</span>
                      <span className="text-[10px] font-semibold opacity-70">
                        {mlUrgency.stale ? 'Warning: Prediction might be outdated' : `Confidence: ${mlUrgency.confidence}% • Model: DistilBERT Model 2`}
                      </span>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-[10px] text-xs font-extrabold shadow-sm ${
                    mlUrgency.urgency === 'Critical' ? 'bg-rose-200 text-rose-900' : 
                    mlUrgency.urgency === 'High' ? 'bg-[#fed7aa] text-[#c2410c]' : 
                    mlUrgency.urgency === 'Medium' ? 'bg-[#fef3c7] text-[#b45309]' : 
                    'bg-[#d1fae5] text-[#065f46]'
                  }`}>
                    {mlUrgency.urgency}
                  </div>
                </div>
                <div className={`mt-3 ml-7 text-[11px] font-medium opacity-90 ${
                  mlUrgency.urgency === 'Critical' ? 'text-rose-900' : 
                  mlUrgency.urgency === 'High' ? 'text-[#cc5e12]' : 
                  mlUrgency.urgency === 'Medium' ? 'text-amber-900' : 
                  'text-emerald-900'
                }`}>
                  {mlUrgency.reason || (mlUrgency.confidence < 60 ? "AI is uncertain. Standard human review required." : "Priority attention recommended.")}
                </div>
              </div>
            )}

            {isUrgencyManual.current && (
              <div className="p-4 border rounded-2xl flex items-center justify-between mt-3 bg-white border-slate-200">
                <div className="flex flex-col">
                  <span className="text-[13px] font-extrabold text-slate-800">Manually Selected Urgency</span>
                  <span className="text-[10px] font-semibold text-slate-500 mt-1">
                    AI prediction overridden by citizen.
                  </span>
                </div>
                <div className={`px-4 py-1.5 rounded-[10px] text-xs font-extrabold shadow-sm ${
                  urgency === 'Critical' ? 'bg-rose-100 text-rose-900' : 
                  urgency === 'High' ? 'bg-orange-100 text-orange-900' : 
                  urgency === 'Medium' ? 'bg-amber-100 text-amber-900' : 
                  'bg-emerald-100 text-emerald-900'
                }`}>
                  {urgency}
                </div>
              </div>
            )}

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Description</span>
              <p className="font-medium text-slate-700 leading-relaxed mt-0.5">{description}</p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Location</span>
                <span className="text-[10px] font-mono text-slate-500">
                  {latitude.toFixed(5)}°N, {longitude.toFixed(5)}°E
                </span>
              </div>
              <p className="font-semibold text-slate-800 leading-relaxed mt-0.5">{location}</p>
              <div className="mt-1 flex items-center space-x-2">
                <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Source: {locationSource === 'gps' ? 'Device GPS' : 'Map Pinpoint'}
                </span>
                {locationAccuracy != null && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    Accuracy: ±{Math.round(locationAccuracy)}m
                  </span>
                )}
              </div>
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
              {isSubmitting ? 'Submitting to Database...' : linkAsDuplicate ? 'Link & Submit Report' : 'Confirm & Submit Complaint'}
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
            <h3 className="text-lg font-extrabold text-slate-900">
              {linkAsDuplicate ? 'Associated Report Linked Successfully!' : 'Complaint Submitted Successfully!'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {linkAsDuplicate
                ? 'Your report has been associated with the canonical issue and citizen demand counter has been updated.'
                : 'Your complaint has been logged into the shared database and assigned to the municipal department.'}
            </p>
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

      {/* MODAL: VIEW COMPLAINT DETAILS */}
      {viewingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-slate-900">{viewingComplaint.ticket_number}</span>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                  {viewingComplaint.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingComplaint(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Complaint Title</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{viewingComplaint.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Category</span>
                  <span className="font-bold text-slate-800">{viewingComplaint.category}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Priority Urgency</span>
                  <span className="font-bold text-rose-600">{viewingComplaint.urgency || 'Medium'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Location</span>
                <div className="flex items-center space-x-1.5 font-medium text-slate-700 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{viewingComplaint.location}</span>
                </div>
              </div>

              {viewingComplaint.duplicate_count > 0 && (
                <div className="p-2.5 bg-purple-50 rounded-xl text-purple-900 font-bold text-[11px] flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{viewingComplaint.duplicate_count} additional citizen reports aggregated on this issue.</span>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Reported On</span>
                <span className="font-medium text-slate-600">{viewingComplaint.created_at || 'Recent date'}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewingComplaint(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
