import React, { useState, useEffect } from 'react';
import {
  BarChart3, Award, CheckCircle2, Target, Clock, Star,
  TrendingUp, HelpCircle, ChevronDown
} from 'lucide-react';
import EmptyState from './EmptyState';
import { StatCardsSkeleton, ErrorState } from './SkeletonLoader';

interface PerformanceTabProps {
  vendorId: string;
}

export default function PerformanceTab({ vendorId }: PerformanceTabProps) {
  const [data, setData] = useState<{
    has_data: boolean;
    overall_score: number | null;
    projects_completed: number;
    milestones_completed: number;
    on_time_delivery_rate: string | null;
    trend_data: any[];
    breakdown_data: any[];
    formula_explanation: string;
  } | null>(null);

  const [timeRange, setTimeRange] = useState('6m');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendor/performance/${vendorId}?range=${timeRange}`);
      if (!res.ok) throw new Error('Failed to retrieve performance analytics');
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.detail || 'Could not fetch performance data');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [vendorId, timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <StatCardsSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-3xl bg-slate-100 animate-pulse"></div>
          <div className="h-64 rounded-3xl bg-slate-100 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || undefined} onRetry={fetchPerformance} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Performance</h2>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Monitor your government project performance metrics and ratings
          </p>
        </div>

        {/* Time range dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-semibold focus:ring-2 focus:ring-violet-500 shadow-2xs"
          >
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last 1 Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="bg-[#f5f3ff] border border-violet-100/70 p-5 rounded-2xl shadow-2xs">
          <Award className="w-5 h-5 text-violet-500 mb-2" />
          <div className="text-3xl font-extrabold text-violet-600">
            {data.overall_score !== null ? `${data.overall_score}%` : '—'}
          </div>
          <div className="text-xs font-bold text-violet-800 mt-1">Overall Score</div>
        </div>

        {/* Projects Completed */}
        <div className="bg-[#eff6ff] border border-blue-100/70 p-5 rounded-2xl shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-blue-500 mb-2" />
          <div className="text-3xl font-extrabold text-blue-600">
            {data.projects_completed}
          </div>
          <div className="text-xs font-bold text-blue-800 mt-1">Projects Completed</div>
        </div>

        {/* Milestones Completed */}
        <div className="bg-[#eefdf5] border border-emerald-100/70 p-5 rounded-2xl shadow-2xs">
          <Target className="w-5 h-5 text-emerald-500 mb-2" />
          <div className="text-3xl font-extrabold text-emerald-600">
            {data.milestones_completed}
          </div>
          <div className="text-xs font-bold text-emerald-800 mt-1">Milestones Completed</div>
        </div>

        {/* On-Time Delivery */}
        <div className="bg-[#fffbeb] border border-amber-100/70 p-5 rounded-2xl shadow-2xs">
          <Clock className="w-5 h-5 text-amber-500 mb-2" />
          <div className="text-3xl font-extrabold text-amber-600">
            {data.on_time_delivery_rate || '—'}
          </div>
          <div className="text-xs font-bold text-amber-800 mt-1">On-Time Delivery</div>
        </div>
      </div>

      {/* 2 Bottom Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Performance Trend */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Performance Trend
          </h3>

          {!data.has_data || data.trend_data.length === 0 ? (
            <div className="py-6">
              <EmptyState
                icon="chart"
                title="No performance data yet"
                description="Your performance trend will be displayed here."
                compact
              />
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex items-end justify-between h-40 pt-4 px-2">
                {data.trend_data.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-[10px] font-bold text-violet-700">{item.score}%</span>
                    <div className="w-8 bg-slate-100 rounded-t-xl overflow-hidden flex items-end h-28">
                      <div
                        className="w-full bg-violet-600 rounded-t-xl transition-all duration-700"
                        style={{ height: `${item.score}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Performance Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            Performance Breakdown
          </h3>

          {!data.has_data || data.breakdown_data.length === 0 ? (
            <div className="py-6">
              <EmptyState
                icon="chart"
                title="No data available"
                description="Performance breakdown will be shown here."
                compact
              />
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {data.breakdown_data.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">{item.metric}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-medium">(Weight: {item.weight})</span>
                      <span className="font-bold text-violet-700">{item.value}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-violet-600 h-full rounded-full"
                      style={{ width: item.value }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Formula Explanation Card */}
      <div className="p-4 bg-violet-50/60 border border-violet-100 rounded-2xl flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-bold text-violet-900">How is the performance score calculated?</div>
          <div className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
            {data.formula_explanation}
          </div>
        </div>
      </div>
    </div>
  );
}
