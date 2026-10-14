import React, { useState, useEffect } from 'react';
import {
  Building2, User, FileText, Landmark, ShieldCheck, CheckCircle2,
  Clock, AlertTriangle, Upload, Save, Check, RefreshCw, Star
} from 'lucide-react';
import EmptyState from './EmptyState';
import { ErrorState } from './SkeletonLoader';

interface ProfileTabProps {
  vendorId: string;
  onProfileUpdated?: (updatedVendor: any) => void;
}

export default function ProfileTab({ vendorId, onProfileUpdated }: ProfileTabProps) {
  const [vendor, setVendor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'bank' | 'verification'>('details');

  // Form states
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [location, setLocation] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');

  // Bank form
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branchName, setBranchName] = useState('');

  // Document upload state
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendor/profile/${vendorId}`);
      if (!res.ok) throw new Error('Failed to retrieve vendor profile');
      const data = await res.json();
      if (data.success && data.vendor) {
        populateData(data.vendor);
      } else {
        throw new Error(data.detail || 'Could not fetch profile');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const populateData = (v: any) => {
    setVendor(v);
    setContactPerson(v.contact_person || '');
    setMobile(v.mobile || '');
    setSpecialization(v.specialization || 'Infrastructure');
    setExperience(v.experience || '');
    setLocation(v.location || 'Pune, Maharashtra');
    setBusinessAddress(v.business_address || '');
    setCity(v.city || 'Pune');
    setStateName(v.state || 'Maharashtra');
    setPincode(v.pincode || '411038');
    setBankName(v.bank_name || '');
    setAccountNumber(v.account_number || '');
    setIfscCode(v.ifsc_code || '');
    setBranchName(v.branch_name || '');
  };

  useEffect(() => {
    fetchProfile();
  }, [vendorId]);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/vendor/profile/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_person: contactPerson,
          mobile: mobile,
          specialization: specialization,
          experience: experience,
          location: location,
          business_address: businessAddress,
          city: city,
          state: stateName,
          pincode: pincode,
          bank_name: bankName,
          account_number: accountNumber,
          ifsc_code: ifscCode,
          branch_name: branchName
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        populateData(data.vendor);
        onProfileUpdated?.(data.vendor);
        showToast('Profile information saved successfully!', 'success');
      } else {
        showToast(data.detail || 'Failed to save changes.', 'error');
      }
    } catch (err: any) {
      showToast('Network error while saving.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (docType: string, file: File) => {
    setUploadingDoc(docType);
    const formData = new FormData();
    formData.append('doc_type', docType);
    formData.append('file', file);

    try {
      const res = await fetch(`/api/vendor/documents/${vendorId}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`${docType} uploaded successfully!`, 'success');
        fetchProfile();
      } else {
        showToast(data.detail || 'Upload failed.', 'error');
      }
    } catch (e) {
      showToast('Error uploading document.', 'error');
    } finally {
      setUploadingDoc(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 rounded-3xl bg-slate-100 animate-pulse"></div>
        <div className="h-80 rounded-3xl bg-slate-100 animate-pulse"></div>
      </div>
    );
  }

  if (error || !vendor) {
    return <ErrorState message={error || undefined} onRetry={fetchProfile} />;
  }

  const completionPct = vendor.profile_completion_pct ?? 100;
  const isProfileIncomplete = completionPct < 100;

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
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Vendor Profile</h2>
        <p className="text-slate-500 text-xs font-medium mt-1">
          Manage your organization details, compliance documents, and bank details
        </p>
      </div>

      {/* Complete Profile Empty State Banner (Shown when incomplete) */}
      {isProfileIncomplete && (
        <div className="bg-white rounded-3xl border border-violet-100 shadow-2xs p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto shadow-xs">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Complete your vendor profile</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Add your organization details, upload required documents and keep your information up to date to get verified for high-value tenders.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActiveTab('details')}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-200 transition-all"
            >
              Edit Profile
            </button>
          </div>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-violet-200">
              {vendor.company_name?.[0] || 'V'}
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900">{vendor.company_name}</div>
              <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                <span>Vendor ID: <strong className="text-slate-700">{vendor.vendor_id}</strong></span>
                <span>•</span>
                <span>{vendor.specialization || 'Infrastructure'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              vendor.verification_status === 'Verified'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {vendor.verification_status === 'Verified' ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              <span>{vendor.verification_status || 'Pending Review'}</span>
            </span>

            <div className="w-48 text-right">
              <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>Profile Completion</span>
                <span className="text-violet-700">{completionPct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-violet-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2 overflow-x-auto">
        {[
          { id: 'details', label: 'Organization Details', icon: Building2 },
          { id: 'documents', label: 'Documents', icon: FileText },
          { id: 'bank', label: 'Bank Details', icon: Landmark },
          { id: 'verification', label: 'Verification Status', icon: ShieldCheck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Organization Details */}
      {activeTab === 'details' && (
        <form onSubmit={handleSaveDetails} className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6 space-y-5">
          <h3 className="text-sm font-extrabold text-slate-900">Organization & Contact Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Company Name</label>
              <input
                type="text"
                disabled
                value={vendor.company_name}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Official Email</label>
              <input
                type="email"
                disabled
                value={vendor.email}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Authorized Contact Person</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone / Mobile Number</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">GST Number</label>
              <input
                type="text"
                disabled
                value={vendor.gst_number || '27AABCU9603R1ZM'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">PAN Number</label>
              <input
                type="text"
                disabled
                value={vendor.pan_number || 'AABCU9603R'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Primary Specialization</label>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
              >
                <option value="Infrastructure">Infrastructure & Civil Works</option>
                <option value="Roads & Bridges">Roads & Bridges</option>
                <option value="Water & Sanitation">Water & Sanitation</option>
                <option value="Electrical & Power">Electrical & Power Systems</option>
                <option value="Smart City IT">Smart City IT & Surveillance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Years of Experience</label>
              <input
                type="text"
                placeholder="e.g. 12"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Business Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Street Address</label>
                <input
                  type="text"
                  placeholder="Plot/Office No, Commercial Complex, Street"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md shadow-violet-200 transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6 space-y-5">
          <h3 className="text-sm font-extrabold text-slate-900">Verification & Compliance Documents</h3>
          <p className="text-xs text-slate-400">
            Upload legally attested copies of your statutory registrations. Accepted formats: PDF, JPG, PNG (Max 10MB).
          </p>

          <div className="space-y-4">
            {[
              { type: 'GST Registration Certificate', desc: 'Active GSTIN certificate issued by GST Department' },
              { type: 'PAN Card Copy', desc: 'Company or Director PAN card copy' },
              { type: 'Business Incorporation / MSME', desc: 'Certificate of Incorporation / Udyam MSME Registration' },
            ].map((docItem, idx) => {
              const uploadedDoc = (vendor.documents || []).find((d: any) => d.type === docItem.type);
              return (
                <div key={idx} className="p-4 rounded-2xl border border-slate-100 hover:border-violet-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{docItem.type}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{docItem.desc}</div>
                      {uploadedDoc && (
                        <div className="text-[10px] text-slate-500 font-medium mt-1">
                          File: <span className="font-semibold text-slate-700">{uploadedDoc.filename}</span> • Uploaded: {uploadedDoc.uploaded_at}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {uploadedDoc ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {uploadedDoc.status || 'Under Review'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                        Not Uploaded
                      </span>
                    )}

                    <label className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-all flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingDoc === docItem.type ? 'Uploading...' : uploadedDoc ? 'Replace' : 'Upload'}</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleDocumentUpload(docItem.type, e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Bank Details */}
      {activeTab === 'bank' && (
        <form onSubmit={handleSaveDetails} className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6 space-y-5">
          <h3 className="text-sm font-extrabold text-slate-900">Registered Bank Details</h3>
          <p className="text-xs text-slate-400">
            Government milestone disbursement payments will be transferred directly to this account via PFMS/RTGS.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. State Bank of India, HDFC Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Account Number</label>
              <input
                type="text"
                placeholder="e.g. 50100234567890"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">IFSC Code</label>
              <input
                type="text"
                placeholder="e.g. SBIN0001234"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Branch Name</label>
              <input
                type="text"
                placeholder="e.g. Shivaji Nagar Branch, Pune"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md shadow-violet-200 transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Bank Details'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: Verification Status */}
      {activeTab === 'verification' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6 space-y-6">
          <h3 className="text-sm font-extrabold text-slate-900">Government Verification Stages</h3>

          <div className="space-y-4">
            {[
              { title: 'Step 1: Account Creation', desc: 'Registered vendor portal credentials and identity creation', status: 'Completed' },
              { title: 'Step 2: Statutory Documentation', desc: 'Upload GST, PAN, and MSME verification documents', status: vendor.documents?.length >= 2 ? 'Completed' : 'Pending' },
              { title: 'Step 3: Department Scrutiny', desc: 'Verification of credentials and business background by municipal council', status: vendor.verification_status === 'Verified' ? 'Completed' : 'In Review' },
              { title: 'Step 4: Certified Vendor Badge', desc: 'Official government empanelment for high-priority tender bidding', status: vendor.verification_status === 'Verified' ? 'Active' : 'Awaiting' },
            ].map((step, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/40">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  step.status === 'Completed' || step.status === 'Active'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-amber-100 text-amber-600'
                }`}>
                  {step.status === 'Completed' || step.status === 'Active' ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{step.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      step.status === 'Completed' || step.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
