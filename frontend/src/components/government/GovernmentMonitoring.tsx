import React, { useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, Clock, ShieldCheck, RefreshCw, Eye, CheckCircle2,
  AlertCircle, ChevronRight, X
} from 'lucide-react';

export const GovernmentMonitoring: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'complaints' | 'vendors'>('projects');

  const fetchMonitoring = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/government/monitoring');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoring();
  }, []);

  const projectsList = data?.projects_monitoring || data?.projects || [];
  const complaintsList = data?.complaints_monitoring || data?.complaints || [];
  const vendorsList = data?.vendors_monitoring || data?.vendors || [];

  const delayRiskCount = projectsList.filter((p: any) => (p.risk_level || '').toLowerCase().includes('risk')).length;
  const overdueCount = complaintsList.filter((c: any) => (c.sla_status || '').toLowerCase().includes('overdue')).length;
  const criticalCount = complaintsList.filter((c: any) => (c.priority || '').toLowerCase() === 'critical').length + (overdueCount > 0 ? 1 : 0);

  const kpis = {
    critical_alerts: data?.kpis?.critical_alerts ?? criticalCount,
    delay_risk_projects: data?.kpis?.delay_risk_projects ?? delayRiskCount,
    overdue_complaints: data?.kpis?.overdue_complaints ?? overdueCount,
    vendor_compliance: data?.kpis?.vendor_compliance ?? '95%',
  };

  const getRiskBadge = (level: string) => {
    const l = (level || '').toLowerCase();
    if (l === 'high' || l === 'critical') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (l === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-rose-500" />
            <span>Monitoring & SLA Compliance</span>
          </h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Real-time municipal operations monitoring, project delay risk, overdue complaints, and contractor SLA adherence.
          </p>
        </div>
        <button
          onClick={fetchMonitoring}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Alerts (Red) */}
        <div className="bg-gradient-to-br from-[#fff1f2] to-[#ffe4e6] border border-rose-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-900/80">Critical Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-950">{loading ? '...' : kpis.critical_alerts}</div>
          <div className="text-[11px] font-semibold text-rose-700 mt-1">Requiring immediate executive attention</div>
        </div>

        {/* Delay Risk Projects (Amber) */}
        <div className="bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] border border-amber-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900/80">Delay Risk Projects</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-950">{loading ? '...' : kpis.delay_risk_projects}</div>
          <div className="text-[11px] font-medium text-amber-700 mt-1">Milestones behind schedule</div>
        </div>

        {/* Overdue Complaints (Violet / Purple) */}
        <div className="bg-gradient-to-br from-[#faf5ff] to-[#f3e8ff] border border-purple-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-900/80">Overdue Complaints</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-950">{loading ? '...' : kpis.overdue_complaints}</div>
          <div className="text-[11px] font-medium text-purple-700 mt-1">Exceeded standard SLA window</div>
        </div>

        {/* Vendor Compliance (Emerald Green) */}
        <div className="bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] border border-emerald-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900/80">Vendor Compliance SLA</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-950">{loading ? '...' : kpis.vendor_compliance}</div>
          <div className="text-[11px] font-medium text-emerald-700 mt-1">Municipal benchmark is ≥ 90%</div>
        </div>
      </div>

      {/* MONITORING TABS & CONTENT */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* TAB BUTTONS */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'projects'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Project Delays ({projectsList.length})
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'complaints'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Complaints SLA ({complaintsList.length})
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'vendors'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Vendor Compliance ({vendorsList.length})
          </button>
        </div>

        {/* TAB 1: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Project Title</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Risk Level</th>
                  <th className="px-4 py-3">Analysis</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">Loading project monitoring...</td>
                  </tr>
                ) : projectsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">All projects operating within schedule.</td>
                  </tr>
                ) : (
                  projectsList.map((p: any, idx: number) => (
                    <tr key={p.id} className="hover:bg-amber-50/40">
                      <td className="px-4 py-3.5 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{p.title}</td>
                      <td className="px-4 py-3.5 text-slate-700">{p.assigned_vendor_name || p.vendor || 'Unassigned'}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${p.progress}%` }} />
                          </div>
                          <span className="font-bold text-slate-700 text-[11px]">{p.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBadge(p.risk_level)}`}>
                          {p.risk_level || 'On Track'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs">{p.reason || 'Operating within projected timeline.'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: COMPLAINTS */}
        {activeTab === 'complaints' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Ticket ID</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Days Open</th>
                  <th className="px-4 py-3">SLA Status</th>
                  <th className="px-4 py-3 text-center">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">Loading complaints SLA tracking...</td>
                  </tr>
                ) : complaintsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">All complaints resolved within SLA.</td>
                  </tr>
                ) : (
                  complaintsList.map((c: any, idx: number) => (
                    <tr key={c.id} className="hover:bg-amber-50/40">
                      <td className="px-4 py-3.5 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{c.ticket_number}</td>
                      <td className="px-4 py-3.5 text-slate-700">{c.category}</td>
                      <td className="px-4 py-3.5 text-slate-600 truncate max-w-[140px]">{c.location}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">{c.days_open} days</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.sla_status === 'Breached' || c.sla_status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {c.sla_status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-slate-700 text-[11px]">{c.priority}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: VENDORS */}
        {activeTab === 'vendors' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Vendor Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Active Projects</th>
                  <th className="px-4 py-3">Compliance Status</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">Loading vendor compliance...</td>
                  </tr>
                ) : vendorsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">No vendor telemetry records.</td>
                  </tr>
                ) : (
                  vendorsList.map((v: any, idx: number) => (
                    <tr key={v.id} className="hover:bg-amber-50/40">
                      <td className="px-4 py-3.5 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{v.company_name}</td>
                      <td className="px-4 py-3.5 text-slate-700">{v.specialization || v.category || 'Infrastructure'}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{v.active_projects_count ?? v.active_projects ?? 0} assigned</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-emerald-700">{v.compliance_status || v.compliance_score || 'Compliant'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                          {v.verification_status || v.status || 'Approved'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};
