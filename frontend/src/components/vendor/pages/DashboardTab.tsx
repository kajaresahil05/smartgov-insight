import React, { useState, useEffect } from 'react';
import {
  Briefcase, FolderKanban, Activity, CheckCircle2, Award, ChevronRight,
  ShieldAlert, ArrowRight, RefreshCw, Star
} from 'lucide-react';
import EmptyState from './EmptyState';
import { StatCardsSkeleton, ErrorState } from './SkeletonLoader';

interface DashboardTabProps {
  vendorId: string;
  onNavigateTab: (tabId: string) => void;
  onSelectProject?: (project: any) => void;
}

export default function DashboardTab({ vendorId, onNavigateTab, onSelectProject }: DashboardTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [data, setData] = useState<{
    vendor?: any;
    assigned_projects_count: number;
    active_projects_count: number;
    completed_projects_count: number;
    performance_score: number | null;
    active_projects: any[];
    recent_updates: any[];
  } | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const targetId = vendorId && vendorId !== 'undefined' && vendorId !== 'null' ? vendorId : 'default';
      let res = await fetch(`/api/vendor/dashboard/${targetId}`);
      if (!res.ok) {
        // Fallback to default
        res = await fetch(`/api/vendor/dashboard/default`);
      }
      if (!res.ok) throw new Error('Failed to retrieve dashboard metrics');
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.detail || 'Failed to load dashboard data');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 rounded-3xl bg-slate-100 animate-pulse"></div>
        <StatCardsSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-64 rounded-3xl bg-slate-100 animate-pulse"></div>
          <div className="lg:col-span-5 h-64 rounded-3xl bg-slate-100 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || undefined} onRetry={fetchDashboard} />;
  }

  const profilePct = data.vendor?.profile_completion_pct ?? 100;
  const isProfileIncomplete = profilePct < 100;

  const handleAcceptAssignment = async (assignmentId: number) => {
    setActionLoading(true);
    setActionNotice(null);
    try {
      const res = await fetch(`/api/vendor/assignment/${assignmentId}/accept`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setActionNotice('Work order accepted! Project moved to In Progress.');
        fetchDashboard();
      }
    } catch (e) {
      setActionNotice('Failed to accept work order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitWork = async (assignmentId: number) => {
    setActionLoading(true);
    setActionNotice(null);
    try {
      const res = await fetch(`/api/vendor/assignment/${assignmentId}/submit-work`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: 'All deliverables uploaded and milestones completed.' })
      });
      const json = await res.json();
      if (json.success) {
        setActionNotice('Work submitted successfully for municipal engineer verification!');
        fetchDashboard();
      }
    } catch (e) {
      setActionNotice('Failed to submit work.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Onboarding Guide Reminder for Incomplete Profiles */}
      {isProfileIncomplete && (
        <div className="p-4 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 border border-violet-200/80 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-violet-950">
                Complete your vendor profile ({profilePct}% completed)
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Add your business address and bank details to start receiving department project assignments.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('profile')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all shrink-0"
          >
            <span>Complete Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 border border-violet-100/90 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between shadow-2xs relative overflow-hidden">
        <div className="space-y-2.5 z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-violet-100/80 rounded-full text-[10px] font-bold text-violet-700 uppercase tracking-wider">
            <Briefcase className="w-3 h-3" /> Vendor Dashboard
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Project Hub</h2>
          <p className="text-slate-600 text-xs font-medium leading-relaxed">
            Track your projects, update milestones, and maintain your performance.
          </p>
          <button
            onClick={() => onNavigateTab('milestones')}
            className="mt-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4.5 py-2.5 rounded-xl text-xs shadow-md shadow-violet-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Update Milestones
          </button>
        </div>
        <div className="mt-4 md:mt-0 select-none pointer-events-none">
          <svg width="180" height="90" viewBox="0 0 180 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="25" width="25" height="65" rx="4" fill="#8b5cf6" fillOpacity="0.15" />
            <rect x="45" y="10" width="25" height="80" rx="4" fill="#7c3aed" fillOpacity="0.25" />
            <rect x="80" y="35" width="25" height="55" rx="4" fill="#6d28d9" fillOpacity="0.18" />
            <rect x="115" y="5" width="25" height="85" rx="4" fill="#5b21b6" fillOpacity="0.28" />
            <rect x="150" y="20" width="25" height="70" rx="4" fill="#4c1d95" fillOpacity="0.18" />
            <path d="M22 28 L57 15 L92 38 L127 8 L162 22" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4 4" fill="none" />
          </svg>
        </div>
      </div>

      {/* WORKLOAD CAPACITY & ACTIVE ASSIGNMENT BANNER */}
      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-emerald-700">✕</button>
        </div>
      )}

      <div className={`p-5 rounded-3xl border shadow-2xs space-y-3 ${
        (data as any).is_at_capacity
          ? 'bg-amber-50/60 border-amber-200 text-amber-950'
          : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
              (data as any).is_at_capacity ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-white'
            }`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider">
                Workload Capacity Policy • {(data as any).capacity_status || 'Capacity Tracked'}
              </div>
              <div className="text-[11px] font-medium opacity-80">
                {(data as any).is_at_capacity
                  ? 'Active project allocation active. Additional assignments are locked until current project verification.'
                  : 'You have 0 active projects. You are eligible for municipal project allocations.'}
              </div>
            </div>
          </div>

          <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-black border ${
            (data as any).is_at_capacity
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
          }`}>
            {(data as any).is_at_capacity ? '1/1 Capacity Reached' : '0/1 Available'}
          </span>
        </div>

        {/* ACTIVE ASSIGNMENT ACTION CARD IF ENGAGED */}
        {(data as any).active_assignment && (
          <div className="mt-2 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-violet-700">
                  {(data as any).active_assignment.work_order_number}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-100 text-violet-800">
                  Status: {(data as any).active_assignment.status}
                </span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {(data as any).active_assignment.project_title || 'Active Civic Project'}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Sanctioned: {(data as any).active_assignment.budget_sanctioned} • Deadline: {(data as any).active_assignment.target_completion_date}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(data as any).active_assignment.status === 'Assigned' && (
                <button
                  onClick={() => handleAcceptAssignment((data as any).active_assignment.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accept Work Order</span>
                </button>
              )}

              {['Accepted', 'In Progress', 'Rework Requested'].includes((data as any).active_assignment.status) && (
                <button
                  onClick={() => handleSubmitWork((data as any).active_assignment.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Submit Work for Verification</span>
                </button>
              )}

              {(data as any).active_assignment.status === 'Work Submitted' && (
                <span className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold">
                  ✓ Submitted • Awaiting Municipal Sign-off
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assigned Projects */}
        <div className="bg-[#f5f3ff] border border-violet-100/70 p-5 rounded-2xl shadow-2xs">
          <FolderKanban className="w-5 h-5 text-violet-500 mb-2" />
          <div className="text-3xl font-extrabold text-violet-600">{data.assigned_projects_count}</div>
          <div className="text-xs font-bold text-violet-800 mt-1">Assigned Projects</div>
        </div>

        {/* Active Projects */}
        <div className="bg-[#eff6ff] border border-blue-100/70 p-5 rounded-2xl shadow-2xs">
          <Activity className="w-5 h-5 text-blue-500 mb-2" />
          <div className="text-3xl font-extrabold text-blue-600">{data.active_projects_count}</div>
          <div className="text-xs font-bold text-blue-800 mt-1">Active Projects</div>
        </div>

        {/* Completed */}
        <div className="bg-[#eefdf5] border border-emerald-100/70 p-5 rounded-2xl shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-2" />
          <div className="text-3xl font-extrabold text-emerald-600">{data.completed_projects_count}</div>
          <div className="text-xs font-bold text-emerald-800 mt-1">Completed</div>
        </div>

        {/* Performance Score */}
        <div className="bg-[#fffbeb] border border-amber-100/70 p-5 rounded-2xl shadow-2xs">
          <Award className="w-5 h-5 text-amber-500 mb-2" />
          <div className="text-2xl font-extrabold text-amber-600">
            {data.performance_score !== null ? `${data.performance_score}%` : 'Not yet rated'}
          </div>
          <div className="text-xs font-bold text-amber-800 mt-1">Performance Score</div>
        </div>
      </div>

      {/* Bottom Cards: Active Projects & Recent Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Projects Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Active Projects</h3>
              <button
                onClick={() => onNavigateTab('projects')}
                className="text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="pt-2">
              {data.active_projects && data.active_projects.length > 0 ? (
                <div className="space-y-3">
                  {data.active_projects.slice(0, 4).map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => onSelectProject?.(proj)}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-violet-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-extrabold text-sm">
                          {proj.progress}%
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{proj.title}</div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {proj.category} • Due: {proj.deadline}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6">
                  <EmptyState
                    icon="folder"
                    title="No active projects yet"
                    description="Projects assigned to you will appear here."
                    compact
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Updates Card */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Recent Updates</h3>
              <button
                onClick={() => onNavigateTab('notifications')}
                className="text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="pt-2">
              {data.recent_updates && data.recent_updates.length > 0 ? (
                <div className="space-y-3">
                  {data.recent_updates.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start space-x-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                        n.type === 'warning' ? 'bg-amber-100 text-amber-600' : n.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {n.type === 'warning' ? '⚠️' : n.type === 'success' ? '✅' : '📋'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 leading-snug">{n.text}</div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">{n.created_at}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6">
                  <EmptyState
                    icon="bell"
                    title="No updates yet"
                    description="You will see notifications and updates here."
                    compact
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
