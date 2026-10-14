import React, { useState, useEffect } from 'react';
import {
  Target, Search, Filter, Clock, CheckCircle2, AlertCircle,
  X, Briefcase, Calendar, UploadCloud
} from 'lucide-react';
import EmptyState from './EmptyState';
import { TableSkeleton, ErrorState } from './SkeletonLoader';

interface MilestonesTabProps {
  vendorId: string;
  onNavigateToEvidence?: () => void;
}

const statusBadgeColors: Record<string, string> = {
  'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'In Review': 'bg-blue-50 text-blue-700 border-blue-200',
  'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function MilestonesTab({ vendorId, onNavigateToEvidence }: MilestonesTabProps) {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'in review' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Update modal state
  const [modalMilestone, setModalMilestone] = useState<any | null>(null);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState('In Review');
  const [updateRemarks, setUpdateRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchMilestones = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/vendor/milestones/${vendorId}?status=${activeFilter}&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to retrieve milestone records');
      const data = await res.json();
      if (data.success) {
        setMilestones(data.milestones || []);
      } else {
        throw new Error(data.detail || 'Could not fetch milestones');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [vendorId, activeFilter, searchQuery]);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const openUpdateModal = (m: any) => {
    setModalMilestone(m);
    setUpdateProgress(m.progress || 0);
    setUpdateStatus(m.status === 'Completed' || m.status === 'Approved' ? 'Approved' : 'In Review');
    setUpdateRemarks(m.remarks || '');
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalMilestone) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/vendor/milestones/${vendorId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: modalMilestone.project_id,
          milestone_index: modalMilestone.milestone_index,
          milestone_title: modalMilestone.title,
          progress: updateProgress,
          status: updateStatus,
          remarks: updateRemarks
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Milestone update submitted successfully!', 'success');
        setModalMilestone(null);
        fetchMilestones();
      } else {
        showToast(data.detail || 'Failed to submit milestone update.', 'error');
      }
    } catch (err: any) {
      showToast('Network error while submitting update.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearFilters = () => {
    setActiveFilter('all');
    setSearchQuery('');
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Milestone Updates</h2>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Submit and track milestone updates for your assigned projects
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search milestones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 w-56 shadow-2xs"
            />
          </div>
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-2xs"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All Milestones' },
          { id: 'pending', label: 'Pending' },
          { id: 'in review', label: 'In Review' },
          { id: 'approved', label: 'Approved' },
          { id: 'rejected', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeFilter === tab.id
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchMilestones} />
      ) : milestones.length === 0 ? (
        searchQuery || activeFilter !== 'all' ? (
          <EmptyState
            icon="search"
            title="No matching milestones found"
            description="Try selecting a different status filter or clearing your search term."
            actionText="Clear Filters"
            onAction={handleClearFilters}
          />
        ) : (
          <EmptyState
            icon="target"
            title="No milestones available"
            description="Milestones for your assigned projects will appear here."
          />
        )
      ) : (
        <div className="grid gap-4">
          {milestones.map((m, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-5 hover:border-violet-200 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <div className="text-sm font-bold text-slate-800">{m.title}</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 text-violet-700 font-semibold">
                      <Briefcase className="w-3 h-3" /> {m.project_title}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Due: {m.date}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusBadgeColors[m.status] || 'bg-slate-100 text-slate-700'}`}>
                  {m.status}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-medium text-slate-500">Progress</span>
                  <span className="font-bold text-violet-700">{m.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-violet-600 h-full rounded-full transition-all"
                    style={{ width: `${m.progress}%` }}
                  ></div>
                </div>
              </div>

              {m.remarks && (
                <div className="mb-4 p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600">
                  <span className="font-bold text-slate-700">Remarks: </span> {m.remarks}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-50">
                {onNavigateToEvidence && (
                  <button
                    onClick={onNavigateToEvidence}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                    <span>Upload Evidence</span>
                  </button>
                )}
                <button
                  onClick={() => openUpdateModal(m)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Update Progress</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Progress Modal */}
      {modalMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-scale-in">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Update Milestone Progress</h3>
                <p className="text-xs text-violet-700 font-semibold mt-0.5">{modalMilestone.project_title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{modalMilestone.title}</p>
              </div>
              <button
                onClick={() => setModalMilestone(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Completion Progress</label>
                  <span className="text-xs font-extrabold text-violet-700">{updateProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={updateProgress}
                  onChange={(e) => setUpdateProgress(Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
                >
                  <option value="In Review">In Review (Submit for Approval)</option>
                  <option value="Approved">Completed & Fully Verified</option>
                  <option value="Pending">Pending / In Progress</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Work Remarks / Summary</label>
                <textarea
                  rows={3}
                  placeholder="Describe the completed work, utility clearances, or inspection notes..."
                  value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500 resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalMilestone(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
