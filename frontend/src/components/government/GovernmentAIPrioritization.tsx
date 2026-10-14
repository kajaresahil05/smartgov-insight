import React, { useEffect, useState } from 'react';
import {
  Zap, Bot, Sparkles, AlertTriangle, CheckCircle2, Eye, X, ArrowUpRight,
  TrendingUp, ShieldAlert, RefreshCw, Layers, MapPin
} from 'lucide-react';

export const GovernmentAIPrioritization: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const fetchAIPrioritization = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/government/ai-prioritization');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching AI prioritization:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIPrioritization();
  }, []);

  const kpis = data?.kpis || {
    analyzed_complaints: 0,
    high_priority: 0,
    medium_priority: 0,
    low_priority: 0,
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-rose-100 text-rose-800 border-rose-300';
    if (score >= 70) return 'bg-amber-100 text-amber-800 border-amber-300';
    if (score >= 50) return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  };

  const recommendations = data?.recommendations || [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span>AI Prioritization</span>
          </h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            AI-powered analysis and prioritization of citizen complaints using NLP urgency models and spatial duplicate clustering.
          </p>
        </div>
        <button
          onClick={fetchAIPrioritization}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
          <span>Re-run AI Analysis</span>
        </button>
      </div>

      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Analyzed Complaints (Blue) */}
        <div className="bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] border border-blue-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900/80">Analyzed Complaints</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-950">
            {loading ? '...' : kpis.analyzed_complaints}
          </div>
          <div className="text-[11px] font-medium text-blue-700 mt-1">100% processed by models</div>
        </div>

        {/* Card 2: High Priority (Rose / Red) */}
        <div className="bg-gradient-to-br from-[#fff1f2] to-[#ffe4e6] border border-rose-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-900/80">High Priority</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-950">
            {loading ? '...' : kpis.high_priority}
          </div>
          <div className="text-[11px] font-semibold text-rose-700 mt-1">Urgent action recommended</div>
        </div>

        {/* Card 3: Medium Priority (Amber / Yellow) */}
        <div className="bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] border border-amber-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900/80">Medium Priority</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-950">
            {loading ? '...' : kpis.medium_priority}
          </div>
          <div className="text-[11px] font-medium text-amber-700 mt-1">Scheduled within 15 days</div>
        </div>

        {/* Card 4: Low Priority (Green) */}
        <div className="bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] border border-emerald-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900/80">Low Priority</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-950">
            {loading ? '...' : kpis.low_priority}
          </div>
          <div className="text-[11px] font-medium text-emerald-700 mt-1">Routine maintenance cycle</div>
        </div>
      </div>

      {/* AI RECOMMENDATIONS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" /> AI Priority Recommendations
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ranked dynamically by DistilBERT NLP Urgency weights and spatial density
            </p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
            Top {recommendations.length} Scored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Complaint ID</th>
                <th className="px-4 py-3">Issue Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3 text-center">AI Priority Score</th>
                <th className="px-4 py-3">Recommendation</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
                      <span>Evaluating complaints with AI neural engine...</span>
                    </div>
                  </td>
                </tr>
              ) : recommendations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No complaints available for prioritization.
                  </td>
                </tr>
              ) : (
                recommendations.map((item: any, idx: number) => (
                  <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{item.ticket_number}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-700">{item.category}</td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-[150px] truncate" title={item.location}>
                      {item.location}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-black text-xs shadow-2xs"
                        style={{
                          backgroundColor: item.ai_score >= 85 ? '#ffe4e6' : item.ai_score >= 70 ? '#fef3c7' : '#eff6ff',
                          color: item.ai_score >= 85 ? '#9f1239' : item.ai_score >= 70 ? '#92400e' : '#1e40af',
                          borderColor: item.ai_score >= 85 ? '#fecdd3' : item.ai_score >= 70 ? '#fde68a' : '#bfdbfe',
                        }}
                      >
                        <Zap className="w-3 h-3" />
                        <span>{item.ai_score} / 100</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 max-w-sm">
                      <div className="text-slate-800 font-medium leading-relaxed">
                        {item.recommendation}
                      </div>
                      {item.duplicate_info?.is_duplicate && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Spatial Cluster: Duplicate detected
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded-lg font-bold text-[11px] transition-all"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI ANALYSIS DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">AI Diagnostic Report</h3>
                  <p className="text-[11px] text-slate-400">{selectedItem.ticket_number}</p>
                </div>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Calculated AI Score</span>
                  <div className="text-3xl font-black text-amber-950 mt-0.5">{selectedItem.ai_score} <span className="text-xs text-amber-700 font-normal">/ 100</span></div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Urgency Weight</span>
                  <div className="text-sm font-extrabold text-slate-800 mt-0.5">{selectedItem.urgency}</div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600">Reported Issue</label>
                <div className="mt-1 font-extrabold text-slate-900 text-sm">{selectedItem.title}</div>
                <div className="text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedItem.description || 'No additional citizen text.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedItem.category}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Department</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedItem.department}</div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
                <span className="text-[10px] font-bold text-blue-700 uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Strategic Recommendation
                </span>
                <p className="font-medium text-slate-800 leading-snug">{selectedItem.recommendation}</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-5 py-2 font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md text-xs"
                >
                  Close Diagnostic
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
