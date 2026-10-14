import React, { useState } from 'react';
import {
  Settings, Building2, Shield, Bell, Cpu, Save, CheckCircle2, User, Key, Globe
} from 'lucide-react';

export const GovernmentSettings: React.FC = () => {
  const [corpName, setCorpName] = useState('Pune Municipal Corporation (PMC)');
  const [zone, setZone] = useState('Zone 3 - West Urban Development & Public Works');
  const [adminEmail, setAdminEmail] = useState('admin@smartgov.gov.in');
  const [slaDays, setSlaDays] = useState(3);
  const [clusterRadius, setClusterRadius] = useState(150);
  const [aiThreshold, setAiThreshold] = useState(75);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* HEADER */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700" />
          <span>System & Municipal Configuration</span>
        </h2>
        <p className="text-slate-500 text-xs font-medium mt-0.5">
          Configure administrative profiles, AI model thresholds, and citizen SLA rules.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configuration saved successfully. System parameters applied.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        
        {/* SECTION 1: MUNICIPAL CORPORATION INFO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-600" />
            <h3 className="font-extrabold text-slate-900 uppercase tracking-wider">
              Municipal Corporation Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700">Corporation Name</label>
              <input
                type="text"
                value={corpName}
                onChange={(e) => setCorpName(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">Administrative Division / Zone</label>
              <input
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700">Official Executive Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">State / Portal Jurisdiction</label>
              <input
                type="text"
                disabled
                value="Maharashtra Urban Development Department"
                className="mt-1 w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: AI PARAMETERS & SLA POLICIES */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-600" />
            <h3 className="font-extrabold text-slate-900 uppercase tracking-wider">
              AI Engine & SLA Resolution Policies
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="font-bold text-slate-700">AI Priority Alert Score</label>
                <span className="font-mono font-bold text-purple-700">{aiThreshold} / 100</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={aiThreshold}
                onChange={(e) => setAiThreshold(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
              <p className="text-[10px] text-slate-400">Complaints above this score trigger immediate supervisor alerts.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="font-bold text-slate-700">Spatial Cluster Radius</label>
                <span className="font-mono font-bold text-blue-700">{clusterRadius}m</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="25"
                value={clusterRadius}
                onChange={(e) => setClusterRadius(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <p className="text-[10px] text-slate-400">Radius within which similar complaints are grouped as duplicates.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="font-bold text-slate-700">Standard SLA Escalation</label>
                <span className="font-mono font-bold text-amber-700">{slaDays} Days</span>
              </div>
              <input
                type="range"
                min="1"
                max="7"
                value={slaDays}
                onChange={(e) => setSlaDays(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
              <p className="text-[10px] text-slate-400">Max days before an unassigned ticket is flagged as SLA Breached.</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: NOTIFICATION DISPATCH */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 uppercase tracking-wider">
              Automated Broadcast Preferences
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors">
              <div>
                <span className="font-bold text-slate-800 block">Critical Complaint Email Alerts</span>
                <span className="text-[11px] text-slate-500">Dispatch immediate notifications to ward engineers</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-amber-600 rounded"
              />
            </label>

            <label className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors">
              <div>
                <span className="font-bold text-slate-800 block">Vendor Work Order SMS</span>
                <span className="text-[11px] text-slate-500">Auto-notify contractors when a project task is approved</span>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 accent-amber-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md shadow-amber-200 transition-all text-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>

      </form>
    </div>
  );
};
