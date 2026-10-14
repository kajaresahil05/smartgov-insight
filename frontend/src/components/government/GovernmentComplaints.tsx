import React, { useEffect, useState } from 'react';
import {
  Search, Filter, Plus, Eye, ChevronLeft, ChevronRight, X, AlertTriangle,
  CheckCircle2, Clock, MapPin, Phone, Mail, FileText, Camera, RefreshCw, Send
} from 'lucide-react';

interface ComplaintsProps {
  onViewDetails?: (complaint: any) => void;
  onNavigateToAllocation?: () => void;
}

export const GovernmentComplaints: React.FC<ComplaintsProps> = ({ onViewDetails: _onViewDetails, onNavigateToAllocation }) => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Status update state
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add complaint form state
  const [newCitizenName, setNewCitizenName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Road');
  const [newLocation, setNewLocation] = useState('Kothrud, Pune');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newDesc, setNewDesc] = useState('');
  const [addingComplaint, setAddingComplaint] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
        page: page.toString(),
        page_size: '10',
      });
      const res = await fetch(`/api/government/complaints?${query.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setComplaints(json.complaints || []);
        setTotal(json.total || 0);
        setTotalPages(json.total_pages || 1);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, statusFilter, priorityFilter, categoryFilter]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchComplaints();
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleOpenDetail = (c: any) => {
    setSelectedComplaint(c);
    setNewStatus(c.status || 'Open');
    setRemarks('');
    setUpdateMsg(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedComplaint) return;
    setUpdating(true);
    setUpdateMsg(null);
    try {
      const res = await fetch(`/api/government/complaints/${selectedComplaint.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          remarks: remarks.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setUpdateMsg({ type: 'success', text: `Status updated to ${newStatus}` });
        // Update local list
        setComplaints((prev) =>
          prev.map((item) => (item.id === selectedComplaint.id ? { ...item, status: newStatus } : item))
        );
        setSelectedComplaint((prev: any) => ({ ...prev, status: newStatus }));
        setTimeout(() => {
          setSelectedComplaint(null);
        }, 1200);
      } else {
        throw new Error(json.message || 'Update failed');
      }
    } catch (err: any) {
      setUpdateMsg({ type: 'error', text: err.message || 'Failed to update status' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingComplaint(true);
    try {
      const res = await fetch('/api/government/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizen_name: newCitizenName,
          title: newTitle,
          category: newCategory,
          location: newLocation,
          priority: newPriority,
          description: newDesc,
          status: 'Open',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsAddModalOpen(false);
        setNewCitizenName('');
        setNewTitle('');
        setNewDesc('');
        fetchComplaints();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingComplaint(false);
    }
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
    if (s === 'resolved' || s === 'completed') {
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

  const statusTabs = ['All', 'Open', 'In Progress', 'Resolved', 'Rejected'];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Citizen Complaints</h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            View and manage all citizen complaints submitted through the portal.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Complaint</span>
          </button>
          <button
            onClick={fetchComplaints}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by complaint ID, name, category or location..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-800"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Categories</option>
              <option value="Road">Roads & Potholes</option>
              <option value="Street Light">Street Lights</option>
              <option value="Water">Water Supply</option>
              <option value="Drainage">Drainage & Sewage</option>
              <option value="Garbage">Garbage Disposal</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setStatusFilter(tab); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab
                  ? 'bg-amber-100 text-amber-800 shadow-2xs font-bold'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
          <span className="text-[11px] text-slate-400 font-medium ml-auto">
            Showing {complaints.length} of {total} records
          </span>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Complaint ID</th>
                <th className="px-4 py-3">Citizen Name</th>
                <th className="px-4 py-3">Issue Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
                      <span>Loading citizen complaints...</span>
                    </div>
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No citizen complaints matching criteria.
                  </td>
                </tr>
              ) : (
                complaints.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 font-medium">
                      {(page - 1) * 10 + idx + 1}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{c.ticket_number}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{c.citizen_name}</td>
                    <td className="px-4 py-3.5 text-slate-700">{c.category}</td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-[160px] truncate" title={c.location}>
                      {c.location}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(c.priority)}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">{c.date}</td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleOpenDetail(c)}
                        className="w-7 h-7 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center text-slate-600 transition-colors"
                        title="View Details & Update Status"
                      >
                        <Eye className="w-4 h-4 text-slate-500 hover:text-amber-600" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/50">
          <span className="text-slate-500 font-medium">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-semibold transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-semibold transition-all"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* COMPLAINT DETAILS & STATUS UPDATE MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/60 to-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    {selectedComplaint.ticket_number}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedComplaint.status)}`}>
                    {selectedComplaint.status}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {selectedComplaint.title || 'Civic Complaint Details'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Citizen Name</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedComplaint.citizen_name}</div>
                  {selectedComplaint.citizen_mobile && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" /> {selectedComplaint.citizen_mobile}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedComplaint.category}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Priority: {selectedComplaint.priority}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Submitted Date</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedComplaint.date}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Registered in Pune</div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-normal">
                  {selectedComplaint.description || 'No detailed description provided by the citizen.'}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" /> Incident Location
                </label>
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>{selectedComplaint.location}</span>
                  {selectedComplaint.latitude && selectedComplaint.longitude && (
                    <span className="text-[10px] font-mono text-slate-500">
                      {selectedComplaint.latitude.toFixed(4)}, {selectedComplaint.longitude.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              {/* Photos if any */}
              {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-slate-400" /> Attached Photos
                  </label>
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {selectedComplaint.images.map((img: string, i: number) => (
                      <img
                        key={i}
                        src={img.startsWith('http') || img.startsWith('/') ? img : `/uploads/${img}`}
                        alt="Evidence"
                        className="w-24 h-24 object-cover rounded-xl border border-slate-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicate Detection Alert if flagged */}
              {selectedComplaint.is_duplicate && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">AI Duplicate Alert:</span> Similar complaint previously reported in this vicinity.
                    {selectedComplaint.duplicate_reason && <p className="text-[11px] mt-0.5">{selectedComplaint.duplicate_reason}</p>}
                  </div>
                </div>
              )}

              {/* CONVERT TO MUNICIPAL PROJECT BANNER */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <span>⚡ Convert Complaint to Municipal Work Project</span>
                  </div>
                  <div className="text-[11px] text-amber-800 font-medium mt-0.5">
                    Issue project work order and trigger AI vendor allocation for this civic issue.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedComplaint(null);
                    if (onNavigateToAllocation) onNavigateToAllocation();
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 shrink-0"
                >
                  <span>Convert & Allocate</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* ADMINISTRATIVE ACTION SECTION */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Administrative Action & Status Update
                </h4>

                {updateMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      updateMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {updateMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                    <span>{updateMsg.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Update Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Open">Open</option>
                      <option value="Under Review">Under Review</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Official Remarks / Action Taken</label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g. Work order issued to vendor"
                      className="mt-1 w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating}
                    className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    {updating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Save & Update Status</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ADD COMPLAINT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-slate-900">Record Citizen Complaint</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddComplaint} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Citizen Full Name</label>
                <input
                  type="text"
                  required
                  value={newCitizenName}
                  onChange={(e) => setNewCitizenName(e.target.value)}
                  placeholder="e.g. Priya Patil"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Complaint Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Broken streetlight on Baner Road"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="Road">Roads & Potholes</option>
                    <option value="Street Light">Street Lights</option>
                    <option value="Water">Water Supply</option>
                    <option value="Drainage">Drainage</option>
                    <option value="Garbage">Garbage</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Location Area</label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Baner, Pune"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detailed description of the civic problem..."
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingComplaint}
                  className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md"
                >
                  {addingComplaint ? 'Submitting...' : 'Record Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
