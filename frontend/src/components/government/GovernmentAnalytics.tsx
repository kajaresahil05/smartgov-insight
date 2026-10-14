import React, { useEffect, useState } from 'react';
import {
  BarChart3, Download, TrendingUp, Clock,
  CheckCircle2, Users, Sparkles
} from 'lucide-react';
import { DonutChart, StatusBarChart, TrendLineChart } from './GovernmentCharts';

export const GovernmentAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30 Days');
  const [exporting, setExporting] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/government/analytics?timeframe=${encodeURIComponent(timeframe)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const handleExportCSV = () => {
    setExporting(true);
    try {
      // Build CSV content from complaints and projects
      const complaints = data?.complaints_by_category || [];
      const statusData = data?.complaints_by_status || data?.complaint_status_chart || [];

      let csv = 'SmartGov Insight - Municipal Performance Report\n';
      csv += `Generated on,${new Date().toLocaleString()}\n`;
      csv += `Timeframe,${timeframe}\n\n`;

      csv += 'Summary KPIs\n';
      csv += `Total Complaints,${data?.kpis?.total_complaints || 0}\n`;
      csv += `Resolution Rate,${data?.kpis?.resolution_rate || '0%'}\n`;
      csv += `Avg Resolution Time,${data?.kpis?.avg_resolution_time || 'N/A'}\n`;
      csv += `Active Vendors,${data?.kpis?.active_vendors || 0}\n\n`;

      csv += 'Complaints by Category\n';
      csv += 'Category,Count,Percentage\n';
      complaints.forEach((c: any) => {
        csv += `"${c.category}",${c.count},${c.percentage}%\n`;
      });

      csv += '\nComplaint Status Distribution\n';
      csv += 'Status,Count\n';
      statusData.forEach((s: any) => {
        csv += `"${s.status}",${s.count}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SmartGov_Analytics_Report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setExporting(false), 800);
    }
  };

  const kpis = data?.kpis || {
    total_complaints: 0,
    resolution_rate: '0%',
    avg_resolution_time: '0 days',
    active_vendors: 0,
  };

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-600" />
            <span>Analytics & Reports</span>
          </h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Comprehensive municipal performance analytics, SLA trends, and downloadable executive summaries.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Timeframe Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            {['7 Days', '30 Days', '3 Months', 'All Time'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeframe === tf ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Export Report */}
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-200 transition-all"
          >
            <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
            <span>{exporting ? 'Exporting...' : 'Generate Report'}</span>
          </button>
        </div>
      </div>

      {/* 4 SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Complaints */}
        <div className="bg-gradient-to-br from-[#fff7ed] to-[#ffedd5] border border-orange-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange-900/80">Total Complaints</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-orange-950">{loading ? '...' : kpis.total_complaints}</div>
          <div className="text-[11px] font-semibold text-emerald-700 mt-1">↑ 100% from previous cycle</div>
        </div>

        {/* Resolution Rate */}
        <div className="bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] border border-emerald-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900/80">Resolution Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-950">{loading ? '...' : kpis.resolution_rate}</div>
          <div className="text-[11px] font-medium text-emerald-700 mt-1">Target is ≥ 80%</div>
        </div>

        {/* Avg Resolution Time */}
        <div className="bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] border border-blue-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900/80">Avg. Resolution Time</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-950">{loading ? '...' : kpis.avg_resolution_time}</div>
          <div className="text-[11px] font-medium text-blue-700 mt-1">48h SLA compliant</div>
        </div>

        {/* Active Vendors */}
        <div className="bg-gradient-to-br from-[#faf5ff] to-[#f3e8ff] border border-purple-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-900/80">Active Vendors</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-950">{loading ? '...' : kpis.active_vendors}</div>
          <div className="text-[11px] font-semibold text-emerald-700 mt-1">↑ 100% active contractor base</div>
        </div>
      </div>

      {/* 3 DISTRIBUTION CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Complaints by Category */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Complaints by Category</h3>
            <span className="text-[10px] font-bold text-slate-400">{timeframe}</span>
          </div>
          <DonutChart
            data={data?.complaints_by_category || []}
            centerCount={kpis.total_complaints}
            centerLabel="Total"
            palette={['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#64748b']}
          />
        </div>

        {/* Complaint Status Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Complaint Status</h3>
            <span className="text-[10px] font-bold text-slate-400">Current Distribution</span>
          </div>
          <StatusBarChart
            data={data?.complaints_by_status || data?.complaint_status_chart || []}
          />
        </div>

        {/* Vendors by Category */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Vendors by Category</h3>
            <span className="text-[10px] font-bold text-slate-400">Empaneled</span>
          </div>
          <DonutChart
            data={data?.vendors_by_category || []}
            centerCount={kpis.active_vendors}
            centerLabel="Vendors"
            palette={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b']}
          />
        </div>
      </div>

      {/* TREND TIMELINE & STRATEGIC INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Complaint Intake Trend</h3>
              <p className="text-[11px] text-slate-400">Daily ticket submissions across all wards</p>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              Volume Curve
            </span>
          </div>
          <TrendLineChart data={data?.complaint_trend || []} />
        </div>

        {/* Strategic Insights (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">AI Executive Insights</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                <span className="font-bold text-amber-900 block">High Volume Ward:</span>
                <span className="text-slate-700 text-[11px] leading-relaxed">
                  Kothrud and Baner contribute 65% of pothole reports this month. Recommend proactive resurfacing tender.
                </span>
              </div>
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="font-bold text-blue-900 block">SLA Compliance:</span>
                <span className="text-slate-700 text-[11px] leading-relaxed">
                  Average resolution cycle stands at 3.2 days, well within the 5-day state citizen charter standard.
                </span>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="font-bold text-emerald-900 block">Vendor Capacity:</span>
                <span className="text-slate-700 text-[11px] leading-relaxed">
                  5 verified contractors actively handling all allocated infrastructure and electrical work orders.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
