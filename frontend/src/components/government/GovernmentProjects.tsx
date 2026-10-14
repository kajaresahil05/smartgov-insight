import React, { useEffect, useState } from 'react';
import {
  FolderKanban, Plus, Eye, Search, Filter, RefreshCw, X, CheckCircle2,
  Clock, AlertTriangle, Building2, Calendar, DollarSign, MapPin, ChevronRight
} from 'lucide-react';

export const GovernmentProjects: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Vendors list for assigning
  const [vendorsList, setVendorsList] = useState<any[]>([]);

  // Create Project Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Road');
  const [location, setLocation] = useState('Kothrud, Pune');
  const [cost, setCost] = useState('₹45,00,000');
  const [startDate, setStartDate] = useState('01 Oct 2026');
  const [endDate, setEndDate] = useState('31 Dec 2026');
  const [assignedVendorId, setAssignedVendorId] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit Progress
  const [editProgress, setEditProgress] = useState(0);
  const [editStatus, setEditStatus] = useState('In Progress');
  const [updating, setUpdating] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        category: categoryFilter,
      });
      const res = await fetch(`/api/government/projects?${query.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorsForSelect = async () => {
    try {
      const res = await fetch('/api/government/vendors?page_size=50');
      const json = await res.json();
      if (json.success && json.vendors) {
        setVendorsList(json.vendors);
        if (json.vendors.length > 0 && !assignedVendorId) {
          setAssignedVendorId(json.vendors[0].vendor_id || String(json.vendors[0].id));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchVendorsForSelect();
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProjects();
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleOpenDetail = (p: any) => {
    setSelectedProject(p);
    setEditProgress(p.progress || 0);
    setEditStatus(p.status || 'In Progress');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/government/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          location,
          estimated_cost: cost,
          start_date: startDate,
          expected_end: endDate,
          assigned_vendor_id: assignedVendorId || undefined,
          progress: 10,
          status: 'In Progress',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        setTitle('');
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleSaveProjectUpdate = async () => {
    if (!selectedProject) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/government/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress: Number(editProgress),
          status: editStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedProject((prev: any) => ({
          ...prev,
          progress: Number(editProgress),
          status: editStatus,
        }));
        fetchProjects();
        setTimeout(() => setSelectedProject(null), 1000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const kpis = data?.kpis || {
    total_projects: 0,
    active_projects: 0,
    completed: 0,
    on_hold: 0,
  };

  const projects = data?.projects || [];

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'in progress') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s === 'on hold' || s === 'delayed') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Project Management</h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Manage infrastructure projects and track progress across municipal wards.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
          <button
            onClick={fetchProjects}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects (Orange) */}
        <div className="bg-gradient-to-br from-[#fff7ed] to-[#ffedd5] border border-orange-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange-900/80">Total Projects</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-orange-950">{loading ? '...' : kpis.total_projects}</div>
          <div className="text-[11px] font-medium text-orange-700 mt-1">Sanctioned civic contracts</div>
        </div>

        {/* Active Projects (Blue) */}
        <div className="bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] border border-blue-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900/80">Active Projects</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-950">{loading ? '...' : kpis.active_projects}</div>
          <div className="text-[11px] font-medium text-blue-700 mt-1">Currently under execution</div>
        </div>

        {/* Completed (Green) */}
        <div className="bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] border border-emerald-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900/80">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-950">{loading ? '...' : kpis.completed}</div>
          <div className="text-[11px] font-medium text-emerald-700 mt-1">Delivered and inspected</div>
        </div>

        {/* On Hold (Amber) */}
        <div className="bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] border border-amber-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900/80">On Hold</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-950">{loading ? '...' : kpis.on_hold}</div>
          <div className="text-[11px] font-medium text-amber-700 mt-1">Pending audit / approvals</div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by title, category or location..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="All">All Categories</option>
            <option value="Road">Roads</option>
            <option value="Water">Water Supply</option>
            <option value="Smart City">Smart City</option>
            <option value="Sanitation">Sanitation</option>
          </select>
        </div>
      </div>

      {/* PROJECTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Project Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">Loading projects...</td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">No projects found.</td>
                </tr>
              ) : (
                projects.map((p: any, idx: number) => (
                  <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{p.title}</div>
                      <div className="text-[11px] text-slate-400">Vendor: {p.assigned_vendor_name}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">{p.category}</td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-[140px] truncate" title={p.location}>
                      {p.location}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">{p.start_date}</td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">{p.expected_end}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.progress >= 80 ? 'bg-emerald-500' : p.progress >= 40 ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, p.progress)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 text-[11px]">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleOpenDetail(p)}
                        className="w-7 h-7 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center text-slate-600 transition-colors"
                        title="View & Edit Progress"
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
      </div>

      {/* PROJECT DETAILS & PROGRESS UPDATE MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedProject.status)}`}>
                  {selectedProject.status}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">{selectedProject.title}</h3>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Vendor</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedProject.assigned_vendor_name}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Budget</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedProject.estimated_cost}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
                  <div className="font-bold text-slate-800 mt-0.5 truncate">{selectedProject.location}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Target Handover</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedProject.expected_end}</div>
                </div>
              </div>

              {/* Milestones list if available */}
              {selectedProject.milestones && selectedProject.milestones.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Milestones</h4>
                  <div className="space-y-1.5">
                    {selectedProject.milestones.map((m: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">{m.title}</span>
                        <span className="text-[11px] font-bold text-slate-600">{m.status || `${m.progress}%`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Update Slider */}
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Update Completion Progress</label>
                  <span className="text-base font-black text-amber-700">{editProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editProgress}
                  onChange={(e) => setEditProgress(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="mt-0.5 w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                  <div className="flex items-end justify-end">
                    <button
                      onClick={handleSaveProjectUpdate}
                      disabled={updating}
                      className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md"
                    >
                      {updating ? 'Saving...' : 'Save Updates'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-slate-900">Initiate Civic Project</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Project Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kothrud Smart Drainage Overhaul"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="Road">Road</option>
                    <option value="Street Light">Street Light</option>
                    <option value="Water">Water Infrastructure</option>
                    <option value="Drainage">Drainage & Sewage</option>
                    <option value="Smart City">Smart City</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Estimated Budget</label>
                  <input
                    type="text"
                    required
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="₹45,00,000"
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Location Ward / Area</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kothrud, Pune"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Assign Empaneled Vendor</label>
                <select
                  value={assignedVendorId}
                  onChange={(e) => setAssignedVendorId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="">Unassigned</option>
                  {vendorsList.map((v) => (
                    <option key={v.id} value={v.vendor_id || String(v.id)}>
                      {v.company_name} ({v.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Start Date</label>
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Expected End Date</label>
                  <input
                    type="text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
