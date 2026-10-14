import React, { useEffect, useState } from 'react';
import {
  FileText, Users, Clock, FolderKanban, Eye, ArrowUpRight, ArrowDownRight,
  ChevronRight, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, MapPin
} from 'lucide-react';
import { DonutChart, StatusBarChart } from './GovernmentCharts';

interface OverviewProps {
  onNavigate: (tabId: string) => void;
  onViewComplaint: (complaint: any) => void;
  onViewVendor: (vendor: any) => void;
}

export const GovernmentOverview: React.FC<OverviewProps> = ({
  onNavigate,
  onViewComplaint,
  onViewVendor,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/government/overview');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.message || 'Failed to fetch overview data');
      }
    } catch (err: any) {
      console.error('Error fetching overview:', err);
      setError(err.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const kpis = data?.kpis || {
    total_complaints: 0,
    registered_vendors: 0,
    pending_action: 0,
    projects_in_progress: 0,
  };

  const getPriorityBadge = (priority: string) => {
    const p = (priority || '').toLowerCase();
    if (p === 'critical' || p === 'high') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (p === 'medium') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'resolved' || s === 'completed' || s === 'approved') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'in progress') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (s === 'rejected') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Overview Dashboard</h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Real-time municipal performance metrics, civic reports, and vendor registries.
          </p>
        </div>
        <button
          onClick={fetchOverview}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={fetchOverview} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Complaints (Coral / Orange) */}
        <div className="bg-gradient-to-br from-[#fff7ed] to-[#ffedd5] border border-orange-200/80 rounded-2xl p-5 shadow-2xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-orange-900/80">Total Citizen Complaints</span>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-orange-950 tracking-tight">
            {loading ? '...' : kpis.total_complaints}
          </div>
          <div className="mt-2 flex items-center text-[11px] font-semibold text-emerald-700 gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>↑ 100% from last week</span>
          </div>
        </div>

        {/* Card 2: Registered Vendors (Sky Blue) */}
        <div className="bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] border border-sky-200/80 rounded-2xl p-5 shadow-2xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-sky-900/80">Registered Vendors</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-sky-950 tracking-tight">
            {loading ? '...' : kpis.registered_vendors}
          </div>
          <div className="mt-2 flex items-center text-[11px] font-semibold text-emerald-700 gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>↑ 100% from last week</span>
          </div>
        </div>

        {/* Card 3: Pending Action (Rose / Red) */}
        <div className="bg-gradient-to-br from-[#fff1f2] to-[#ffe4e6] border border-rose-200/80 rounded-2xl p-5 shadow-2xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-900/80">Pending Action</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-950 tracking-tight">
            {loading ? '...' : kpis.pending_action}
          </div>
          <div className="mt-2 flex items-center text-[11px] font-semibold text-slate-600 gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-slate-500" />
            <span>↓ 0% from last week</span>
          </div>
        </div>

        {/* Card 4: Projects in Progress (Purple / Indigo) */}
        <div className="bg-gradient-to-br from-[#faf5ff] to-[#f3e8ff] border border-purple-200/80 rounded-2xl p-5 shadow-2xs relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-purple-900/80">Projects In Progress</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-950 tracking-tight">
            {loading ? '...' : kpis.projects_in_progress}
          </div>
          <div className="mt-2 flex items-center text-[11px] font-semibold text-emerald-700 gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>↑ 100% from last week</span>
          </div>
        </div>
      </div>

      {/* TWO TABLES SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Table 1: Recent Citizen Complaints */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Recent Citizen Complaints</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Latest civic issues submitted by registered residents</p>
            </div>
            <button
              onClick={() => onNavigate('complaints')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-3.5 py-2.5">#</th>
                  <th className="px-3.5 py-2.5">Complaint ID</th>
                  <th className="px-3.5 py-2.5">Citizen Name</th>
                  <th className="px-3.5 py-2.5">Issue Category</th>
                  <th className="px-3.5 py-2.5">Location</th>
                  <th className="px-3.5 py-2.5">Priority</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5">Date</th>
                  <th className="px-3.5 py-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">Loading complaints...</td>
                  </tr>
                ) : !data?.recent_complaints || data.recent_complaints.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">No complaints registered yet.</td>
                  </tr>
                ) : (
                  data.recent_complaints.map((c: any, idx: number) => (
                    <tr key={c.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-3.5 py-3 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-3.5 py-3 font-bold text-slate-900">{c.ticket_number}</td>
                      <td className="px-3.5 py-3 text-slate-700 font-semibold">{c.citizen_name}</td>
                      <td className="px-3.5 py-3 text-slate-600">{c.category}</td>
                      <td className="px-3.5 py-3 text-slate-600 max-w-[130px] truncate" title={c.location}>
                        {c.location}
                      </td>
                      <td className="px-3.5 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(c.priority)}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-3.5 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-slate-500 text-[11px] whitespace-nowrap">{c.date}</td>
                      <td className="px-3.5 py-3 text-center">
                        <button
                          onClick={() => onViewComplaint(c)}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center text-slate-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500 hover:text-amber-600" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Registered Vendors */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Registered Vendors</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Empaneled municipal contractors and infrastructure providers</p>
            </div>
            <button
              onClick={() => onNavigate('vendors')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-3.5 py-2.5">#</th>
                  <th className="px-3.5 py-2.5">Vendor Name</th>
                  <th className="px-3.5 py-2.5">GST No.</th>
                  <th className="px-3.5 py-2.5">Category</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">Loading vendors...</td>
                  </tr>
                ) : !data?.recent_vendors || data.recent_vendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No vendors registered yet.</td>
                  </tr>
                ) : (
                  data.recent_vendors.map((v: any, idx: number) => (
                    <tr key={v.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-3.5 py-3 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-3.5 py-3">
                        <div className="font-bold text-slate-900 truncate max-w-[160px]">{v.company_name}</div>
                        <div className="text-[10px] text-slate-400">{v.contact_person}</div>
                      </td>
                      <td className="px-3.5 py-3 font-mono text-slate-600 text-[11px]">{v.gst_number}</td>
                      <td className="px-3.5 py-3 text-slate-700 font-medium">{v.category}</td>
                      <td className="px-3.5 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(v.status)}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <button
                          onClick={() => onViewVendor(v)}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center text-slate-600 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500 hover:text-amber-600" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* BOTTOM 3 CHARTS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Complaints by Category */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Complaints by Category</h3>
              <span className="text-[10px] font-bold text-slate-400">All Time</span>
            </div>
          </div>
          <DonutChart
            data={data?.complaints_by_category || []}
            centerCount={kpis.total_complaints}
            centerLabel="Complaints"
            palette={['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#64748b']}
          />
        </div>

        {/* Chart 2: Complaint Status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Complaint Status</h3>
              <span className="text-[10px] font-bold text-slate-400">Current Flow</span>
            </div>
          </div>
          <StatusBarChart
            data={data?.complaint_status_chart || []}
          />
        </div>

        {/* Chart 3: Vendors by Category */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Vendors by Category</h3>
              <span className="text-[10px] font-bold text-slate-400">Empaneled</span>
            </div>
          </div>
          <DonutChart
            data={data?.vendors_by_category || []}
            centerCount={kpis.registered_vendors}
            centerLabel="Vendors"
            palette={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b']}
          />
        </div>

      </div>
    </div>
  );
};
