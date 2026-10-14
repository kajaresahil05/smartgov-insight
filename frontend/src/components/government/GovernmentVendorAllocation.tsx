import React, { useState, useEffect } from 'react';
import {
  Users, FolderKanban, CheckCircle2, Clock, AlertTriangle, ShieldCheck,
  Award, Sparkles, ArrowRight, RefreshCw, ChevronRight, X, Star, FileText,
  BadgeAlert, Building2, Calendar, DollarSign, Filter, Search, ArrowUpRight
} from 'lucide-react';

interface ProjectItem {
  id: number;
  title: string;
  category: string;
  location: string;
  deadline?: string;
  expected_end?: string;
  estimated_cost?: string;
  budget_sanctioned?: string;
  assigned_vendor_id?: string;
  assignment_status?: string;
  status: string;
  progress: number;
  priority?: string;
  work_order_number?: string;
  source_complaint_id?: number;
}

interface ConvertibleComplaint {
  id: number;
  ticket_number: string;
  title: string;
  category: string;
  description: string;
  priority: string;
  location: string;
  status: string;
  date: string;
}

interface VendorRecommendation {
  vendor_id: string;
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  mobile: string;
  specialization: string;
  experience: string;
  location: string;
  city: string;
  is_verified: boolean;
  verification_status: string;
  is_eligible: boolean;
  capacity_status: string;
  active_projects_count: number;
  active_project_name?: string;
  eligibility_reason: string;
  recommendation_score: number;
  ai_rationale: string;
  breakdown: {
    category_match: number;
    performance: number;
    completion_rate: number;
    experience: number;
    capacity: number;
  };
}

interface ActiveAssignment {
  id: number;
  assignment_id: string;
  project_id: number;
  vendor_id: string;
  vendor_name: string;
  status: string;
  work_order_number: string;
  budget_sanctioned: string;
  target_completion_date: string;
  allocation_score: number;
  assigned_at: string;
  accepted_at?: string;
  submitted_at?: string;
  verified_at?: string;
  completed_at?: string;
  government_remarks?: string;
  vendor_remarks?: string;
  rating?: number;
  audit_trail?: any[];
  project?: ProjectItem;
  vendor?: any;
  evidence_count?: number;
  latest_evidence?: any[];
}

export const GovernmentVendorAllocation: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'active' | 'verify' | 'completed'>('pending');
  const [loading, setLoading] = useState<boolean>(true);
  const [kpis, setKpis] = useState<any>({
    pending_projects_count: 0,
    active_assignments_count: 0,
    under_verification_count: 0,
    completed_assignments_count: 0,
    total_vendors_count: 0,
    available_vendors_count: 0,
    busy_vendors_count: 0,
  });

  // Pending Tab State
  const [pendingProjects, setPendingProjects] = useState<ProjectItem[]>([]);
  const [convertibleComplaints, setConvertibleComplaints] = useState<ConvertibleComplaint[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [recommendations, setRecommendations] = useState<VendorRecommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);

  // Active & Completed State
  const [activeAssignments, setActiveAssignments] = useState<ActiveAssignment[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<ActiveAssignment[]>([]);

  // Modals State
  const [assignModalVendor, setAssignModalVendor] = useState<VendorRecommendation | null>(null);
  const [sanctionedBudget, setSanctionedBudget] = useState<string>('₹45,00,000');
  const [targetDate, setTargetDate] = useState<string>('30 Dec 2026');
  const [workOrderNotes, setWorkOrderNotes] = useState<string>('');
  const [submittingAssign, setSubmittingAssign] = useState<boolean>(false);

  // Verification Modal State
  const [verifyModalAssignment, setVerifyModalAssignment] = useState<ActiveAssignment | null>(null);
  const [verifyDecision, setVerifyDecision] = useState<'Approved' | 'Rework Requested'>('Approved');
  const [verifyRating, setVerifyRating] = useState<number>(5);
  const [verifyRemarks, setVerifyRemarks] = useState<string>('');
  const [verifyFeedback, setVerifyFeedback] = useState<string>('');
  const [submittingVerify, setSubmittingVerify] = useState<boolean>(false);

  // Convert Complaint Modal State
  const [convertModalComplaint, setConvertModalComplaint] = useState<ConvertibleComplaint | null>(null);
  const [convertTitle, setConvertTitle] = useState<string>('');
  const [convertBudget, setConvertBudget] = useState<string>('₹35,00,000');
  const [convertDeadline, setConvertDeadline] = useState<string>('15 Dec 2026');
  const [submittingConvert, setSubmittingConvert] = useState<boolean>(false);

  // Alerts & Messages
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Fetch Overview KPIs
  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/government/allocations/overview');
      const data = await res.json();
      if (data.success && data.kpis) {
        setKpis(data.kpis);
      }
    } catch (e) {
      console.error('Failed to load allocation overview:', e);
    }
  };

  // Fetch Pending Projects & Convertible Complaints
  const fetchPending = async () => {
    try {
      const res = await fetch('/api/government/allocations/pending-projects');
      const data = await res.json();
      if (data.success) {
        setPendingProjects(data.projects || []);
        setConvertibleComplaints(data.convertible_complaints || []);
        if (data.projects && data.projects.length > 0 && !selectedProject) {
          handleSelectProject(data.projects[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load pending projects:', e);
    }
  };

  // Fetch Active Assignments
  const fetchActive = async () => {
    try {
      const res = await fetch('/api/government/allocations/active');
      const data = await res.json();
      if (data.success) {
        setActiveAssignments(data.assignments || []);
      }
    } catch (e) {
      console.error('Failed to load active assignments:', e);
    }
  };

  // Fetch Completed Assignments
  const fetchCompleted = async () => {
    try {
      const res = await fetch('/api/government/allocations/completed');
      const data = await res.json();
      if (data.success) {
        setCompletedAssignments(data.assignments || []);
      }
    } catch (e) {
      console.error('Failed to load completed assignments:', e);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchOverview(), fetchPending(), fetchActive(), fetchCompleted()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // When a pending project is selected, fetch AI recommendations
  const handleSelectProject = async (proj: ProjectItem) => {
    setSelectedProject(proj);
    setLoadingRecs(true);
    try {
      const res = await fetch(`/api/government/allocations/recommendations/${proj.id}`);
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.recommendations || []);
      }
    } catch (e) {
      console.error('Failed to fetch recommendations:', e);
    } finally {
      setLoadingRecs(false);
    }
  };

  // Open Allocation Modal
  const openAllocateModal = (vendor: VendorRecommendation) => {
    if (!vendor.is_eligible) {
      setAlertMsg({
        type: 'error',
        text: `Cannot allocate to ${vendor.company_name}: ${vendor.eligibility_reason}`
      });
      return;
    }
    setAssignModalVendor(vendor);
    setSanctionedBudget(selectedProject?.estimated_cost || '₹45,00,000');
    setTargetDate(selectedProject?.expected_end || '30 Dec 2026');
    setWorkOrderNotes(`Municipal infrastructure contract for ${selectedProject?.title}`);
  };

  // Execute Allocation
  const handleConfirmAllocation = async () => {
    if (!selectedProject || !assignModalVendor) return;
    setSubmittingAssign(true);
    setAlertMsg(null);
    try {
      const res = await fetch('/api/government/allocations/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
          vendor_id: assignModalVendor.vendor_id,
          budget_sanctioned: sanctionedBudget,
          target_completion_date: targetDate,
          work_order_details: workOrderNotes,
          allocated_by: 'PMC Municipal Admin'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Allocation failed');
      }
      setAlertMsg({
        type: 'success',
        text: `Successfully allocated '${selectedProject.title}' to ${assignModalVendor.company_name}! Work Order sanctioned.`
      });
      setAssignModalVendor(null);
      await refreshAll();
      setActiveSubTab('active');
    } catch (err: any) {
      setAlertMsg({
        type: 'error',
        text: err.message || 'Error creating project allocation.'
      });
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Convert Complaint to Project
  const handleConfirmConvert = async () => {
    if (!convertModalComplaint) return;
    setSubmittingConvert(true);
    setAlertMsg(null);
    try {
      const res = await fetch('/api/government/complaints/convert-to-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: convertModalComplaint.id,
          title: convertTitle,
          category: convertModalComplaint.category,
          location: convertModalComplaint.location,
          estimated_cost: convertBudget,
          target_completion_date: convertDeadline
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Conversion failed');

      setAlertMsg({
        type: 'success',
        text: `Complaint ${convertModalComplaint.ticket_number} successfully converted into Project #${data.project?.id}! Ready for vendor allocation.`
      });
      setConvertModalComplaint(null);
      await refreshAll();
    } catch (err: any) {
      setAlertMsg({
        type: 'error',
        text: err.message || 'Error converting complaint to project.'
      });
    } finally {
      setSubmittingConvert(false);
    }
  };

  // Execute Verification Sign-off
  const handleConfirmVerification = async () => {
    if (!verifyModalAssignment) return;
    setSubmittingVerify(true);
    setAlertMsg(null);
    try {
      const res = await fetch(`/api/government/allocations/${verifyModalAssignment.id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: verifyDecision,
          rating: verifyRating,
          remarks: verifyRemarks,
          feedback: verifyFeedback
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Verification sign-off failed');

      setAlertMsg({
        type: 'success',
        text: data.message || 'Work order successfully verified!'
      });
      setVerifyModalAssignment(null);
      await refreshAll();
      if (verifyDecision === 'Approved') {
        setActiveSubTab('completed');
      }
    } catch (err: any) {
      setAlertMsg({
        type: 'error',
        text: err.message || 'Error processing verification.'
      });
    } finally {
      setSubmittingVerify(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            AI-Driven Municipal Governance
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Vendor Allocation & Workload Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Allocate municipal projects to empaneled vendors using AI scoring models. Strict One Active Project workload rule enforced.
          </p>
        </div>

        <button
          onClick={refreshAll}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* ALERT BANNER */}
      {alertMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xs ${
          alertMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : alertMsg.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {alertMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {alertMsg.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            {alertMsg.type === 'error' && <BadgeAlert className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="p-1 hover:bg-black/5 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 5 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.pending_projects_count}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">Awaiting Allocation</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active</span>
            <FolderKanban className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">{kpis.active_assignments_count}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">In Execution</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Under Review</span>
            <ShieldCheck className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-black text-violet-600">{kpis.under_verification_count}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Work Submitted</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{kpis.completed_assignments_count}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Verified & Closed</div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-2xl text-white shadow-2xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Capacity Rule</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-400">
            {kpis.available_vendors_count} <span className="text-xs text-slate-300 font-normal">avail /</span> {kpis.total_vendors_count}
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-1">
            Max 1 Project per Vendor
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex items-center gap-1 shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('pending')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'pending'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Projects & AI Recommendations</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900 text-white font-extrabold ml-1">
            {pendingProjects.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('active')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'active'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Active Allocations</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900 text-white font-extrabold ml-1">
            {activeAssignments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('verify')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'verify'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Municipal Quality Sign-Off</span>
          {kpis.under_verification_count > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-extrabold ml-1 animate-pulse">
              {kpis.under_verification_count}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('completed')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'completed'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed Projects History</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900 text-white font-extrabold ml-1">
            {completedAssignments.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PENDING ALLOCATIONS & AI RECOMMENDATIONS */}
      {activeSubTab === 'pending' && (
        <div className="space-y-6">
          {/* Convertible Complaints Section */}
          {convertibleComplaints.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 via-amber-100/40 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      High-Priority Citizen Complaints Ready for Project Conversion
                    </h3>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Convert validated civic complaints into municipal work projects and trigger AI vendor allocation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {convertibleComplaints.slice(0, 3).map((comp) => (
                  <div key={comp.id} className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 mb-1">
                        <span>{comp.ticket_number}</span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px]">
                          {comp.priority}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 line-clamp-1">{comp.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {comp.description || 'Civic infrastructure repair required.'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-2">
                        {comp.category} • {comp.location}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setConvertModalComplaint(comp);
                        setConvertTitle(`Remediation: ${comp.title}`);
                        setConvertBudget('₹40,00,000');
                        setConvertDeadline('20 Jan 2027');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Convert to Project</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Projects Grid & AI Recommender Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Project Selector (4 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Unallocated Projects</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Select a project to view AI-ranked vendors</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                  {pendingProjects.length} Pending
                </span>
              </div>

              {pendingProjects.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  No projects currently pending allocation.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {pendingProjects.map((p) => {
                    const isSelected = selectedProject?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProject(p)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50/70 border-amber-400 shadow-xs ring-1 ring-amber-400'
                            : 'bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-extrabold text-amber-700">Project #{p.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            {p.category}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 line-clamp-1">{p.title}</div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                          <span>{p.location}</span>
                          <span className="font-bold text-slate-700">{p.estimated_cost || '₹50,00,000'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: AI Recommendations for Selected Project (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
              {selectedProject ? (
                <>
                  <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider">
                          Project #{selectedProject.id}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                          {selectedProject.category}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                        {selectedProject.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>📍 {selectedProject.location}</span>
                        <span>💰 Budget: {selectedProject.estimated_cost || '₹45,00,000'}</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5 text-xs font-bold">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>AI Recommender</span>
                    </div>
                  </div>

                  {/* AI Ranked Recommendations List */}
                  {loadingRecs ? (
                    <div className="py-16 text-center text-slate-400 space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                      <p className="text-xs font-bold">Evaluating vendor competencies and workloads...</p>
                    </div>
                  ) : recommendations.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No registered vendors available for scoring.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                      {recommendations.map((vendor, idx) => (
                        <div
                          key={vendor.vendor_id}
                          className={`p-4 rounded-2xl border transition-all ${
                            vendor.is_eligible
                              ? 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-xs'
                              : 'bg-slate-50/80 border-slate-200/60 opacity-80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {/* Rank Badge */}
                              <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                                idx === 0 && vendor.is_eligible
                                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                #{idx + 1}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-900 text-xs">
                                    {vendor.company_name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {vendor.vendor_id}
                                  </span>
                                  {vendor.is_verified && (
                                    <span className="text-emerald-600 text-[10px] font-bold">
                                      ✓ Verified
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium">
                                  Specialization: <span className="font-bold text-slate-700">{vendor.specialization}</span> • Exp: {vendor.experience}
                                </div>
                              </div>
                            </div>

                            {/* Score & Capacity Badge */}
                            <div className="text-right shrink-0">
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-black border border-amber-200">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                {vendor.recommendation_score}% Match
                              </div>
                              <div className="mt-1">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  vendor.is_eligible
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {vendor.capacity_status}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* AI Rationale & Score Breakdown */}
                          <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="font-semibold">{vendor.ai_rationale}</span>
                              <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1.5 font-medium">
                                <span>Domain Match: {vendor.breakdown.category_match}%</span>
                                <span>Performance: {vendor.breakdown.performance}%</span>
                                <span>Track Record: {vendor.breakdown.completion_rate}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-[11px] text-slate-400 font-medium">
                              {vendor.contact_person} • {vendor.mobile}
                            </span>

                            {vendor.is_eligible ? (
                              <button
                                onClick={() => openAllocateModal(vendor)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                              >
                                <span>Allocate Work Order</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600">
                                <BadgeAlert className="w-3.5 h-3.5" />
                                <span>Allocation Locked (At Capacity)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-20 text-center text-slate-400 text-xs">
                  Select a project from the left panel to run AI vendor allocation.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE ALLOCATIONS */}
      {activeSubTab === 'active' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Active Work Projects</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Live monitoring of vendor execution and milestone progress. Max 1 active project per vendor strictly maintained.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
              {activeAssignments.length} Ongoing
            </span>
          </div>

          {activeAssignments.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              No active project assignments. Allocate pending projects from Tab 1.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeAssignments.map((asn) => {
                const proj = asn.project;
                return (
                  <div key={asn.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs space-y-3 flex flex-col justify-between">
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-extrabold text-blue-700">{asn.work_order_number || asn.assignment_id}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          asn.status === 'Work Submitted'
                            ? 'bg-purple-100 text-purple-800'
                            : asn.status === 'Accepted' || asn.status === 'In Progress'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {asn.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 line-clamp-1">
                        {proj?.title || 'Municipal Work Project'}
                      </h4>

                      <div className="text-[11px] text-slate-500 mt-1">
                        Vendor: <span className="font-bold text-slate-800">{asn.vendor_name}</span> ({asn.vendor_id})
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">Milestone Progress</span>
                          <span className="text-slate-800">{proj?.progress || 0}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
                            style={{ width: `${proj?.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Meta Grid */}
                      <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Sanctioned Budget</span>
                          <span className="font-extrabold text-slate-800">{asn.budget_sanctioned}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Deadline</span>
                          <span className="font-extrabold text-slate-800">{asn.target_completion_date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        Assigned: {asn.assigned_at}
                      </span>

                      {asn.status === 'Work Submitted' ? (
                        <button
                          onClick={() => {
                            setVerifyModalAssignment(asn);
                            setVerifyDecision('Approved');
                            setVerifyRating(5);
                            setVerifyRemarks('All technical specifications inspected and certified.');
                            setVerifyFeedback('Excellent civic execution.');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Review & Verify Work</span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-slate-500">
                          Execution Underway
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MUNICIPAL QUALITY SIGN-OFF */}
      {activeSubTab === 'verify' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Work Submitted for Quality Inspection</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Verify vendor deliverables and sign off on completion. Approving a project completes the work order and frees the vendor's capacity for new allocations.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200">
              {kpis.under_verification_count} Pending Review
            </span>
          </div>

          {activeAssignments.filter(a => a.status === 'Work Submitted' || a.status === 'Under Verification').length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              No completed deliverables currently awaiting municipal verification.
            </div>
          ) : (
            <div className="space-y-4">
              {activeAssignments
                .filter(a => a.status === 'Work Submitted' || a.status === 'Under Verification')
                .map((asn) => (
                  <div key={asn.id} className="p-5 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-2xs space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-purple-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-purple-800">
                            {asn.work_order_number}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
                            Work Submitted
                          </span>
                        </div>
                        <h4 className="text-base font-black text-slate-900 mt-1">
                          {asn.project?.title || 'Municipal Work Project'}
                        </h4>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Executed by: <span className="font-bold text-slate-800">{asn.vendor_name}</span> ({asn.vendor_id})
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Submitted On</span>
                        <span className="text-xs font-bold text-slate-700">{asn.submitted_at || 'Recently'}</span>
                      </div>
                    </div>

                    {/* Remarks from Vendor */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                      <span className="font-bold text-slate-500 block text-[10px] uppercase">Vendor Submission Remarks:</span>
                      <p className="mt-1 font-medium">{asn.vendor_remarks || 'All milestone deliverables completed according to municipal specification.'}</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => {
                          setVerifyModalAssignment(asn);
                          setVerifyDecision('Rework Requested');
                          setVerifyRemarks('Correction needed on site drainage grade.');
                        }}
                        className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all"
                      >
                        Request Rework
                      </button>

                      <button
                        onClick={() => {
                          setVerifyModalAssignment(asn);
                          setVerifyDecision('Approved');
                          setVerifyRating(5);
                          setVerifyRemarks('Civil engineering inspection complete and certified.');
                          setVerifyFeedback('Outstanding quality and timely completion.');
                        }}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Certify & Mark Completed</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COMPLETED PROJECTS HISTORY */}
      {activeSubTab === 'completed' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Completed Projects Archive</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Verified municipal project history and vendor performance ratings.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
              {completedAssignments.length} Verified
            </span>
          </div>

          {completedAssignments.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              No completed project history recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {completedAssignments.map((asn) => (
                <div key={asn.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/50 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-emerald-800">
                        {asn.work_order_number}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        Completed & Verified
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {asn.project?.title || 'Municipal Work Project'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Vendor: <span className="font-bold text-slate-800">{asn.vendor_name}</span> • Completed: {asn.completed_at || 'Recently'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="flex items-center gap-1 text-amber-500 font-black text-sm justify-end">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{asn.rating || 5.0}★</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">Quality Rating</div>
                    </div>
                    <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-extrabold text-slate-800">
                      {asn.budget_sanctioned}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ALLOCATE WORK ORDER CONFIRMATION */}
      {assignModalVendor && selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Issue Municipal Work Order</h3>
                <p className="text-[11px] text-slate-500">Formal project allocation under PMC bylaws</p>
              </div>
              <button onClick={() => setAssignModalVendor(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-1">
                <div className="text-[10px] font-bold text-amber-800 uppercase">Selected Vendor</div>
                <div className="font-extrabold text-slate-900 text-sm">{assignModalVendor.company_name}</div>
                <div className="text-[11px] text-slate-600 font-medium">
                  Vendor ID: {assignModalVendor.vendor_id} • AI Match: {assignModalVendor.recommendation_score}%
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Project</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                  {selectedProject.title}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sanctioned Budget</label>
                  <input
                    type="text"
                    value={sanctionedBudget}
                    onChange={(e) => setSanctionedBudget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Completion Date</label>
                  <input
                    type="text"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Work Order Terms & Specifications</label>
                <textarea
                  rows={2}
                  value={workOrderNotes}
                  onChange={(e) => setWorkOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Workload Policy Notice:</strong> Once allocated, this vendor will be marked as engaged (1/1 active project) and will not be eligible for additional allocations until this project is completed.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-5 border-t border-slate-100 mt-4">
              <button
                onClick={() => setAssignModalVendor(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAllocation}
                disabled={submittingAssign}
                className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                {submittingAssign ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Sanction & Issue Work Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VERIFY WORK ORDER */}
      {verifyModalAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Municipal Quality Sign-Off</h3>
                <p className="text-[11px] text-slate-500">
                  Work Order: {verifyModalAssignment.work_order_number}
                </p>
              </div>
              <button onClick={() => setVerifyModalAssignment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Inspection Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyDecision('Approved')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      verifyDecision === 'Approved'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-1 ring-emerald-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ✓ Approved & Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyDecision('Rework Requested')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      verifyDecision === 'Rework Requested'
                        ? 'bg-rose-50 border-rose-400 text-rose-800 ring-1 ring-rose-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ⚠ Request Rework
                  </button>
                </div>
              </div>

              {verifyDecision === 'Approved' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quality Rating (1 to 5 Stars)</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setVerifyRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-6 h-6 ${
                          star <= verifyRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`} />
                      </button>
                    ))}
                    <span className="font-black text-slate-700 ml-2">{verifyRating}.0 / 5.0</span>
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {verifyDecision === 'Approved' ? 'Sign-Off Remarks' : 'Rectification Instructions'}
                </label>
                <textarea
                  rows={2}
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  placeholder="Official municipal engineer inspection notes..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-5 border-t border-slate-100 mt-4">
              <button
                onClick={() => setVerifyModalAssignment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVerification}
                disabled={submittingVerify}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 ${
                  verifyDecision === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submittingVerify ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Confirm Inspection Decision</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONVERT COMPLAINT TO PROJECT */}
      {convertModalComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Convert Complaint to Work Project</h3>
                <p className="text-[11px] text-slate-500">Ticket #{convertModalComplaint.ticket_number}</p>
              </div>
              <button onClick={() => setConvertModalComplaint(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Project Title</label>
                <input
                  type="text"
                  value={convertTitle}
                  onChange={(e) => setConvertTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Budget</label>
                  <input
                    type="text"
                    value={convertBudget}
                    onChange={(e) => setConvertBudget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Completion</label>
                  <input
                    type="text"
                    value={convertDeadline}
                    onChange={(e) => setConvertDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-5 border-t border-slate-100 mt-4">
              <button
                onClick={() => setConvertModalComplaint(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmConvert}
                disabled={submittingConvert}
                className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                {submittingConvert ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Create Work Project</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
