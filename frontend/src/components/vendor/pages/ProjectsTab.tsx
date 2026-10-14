import React, { useState, useEffect } from 'react';
import {
  FolderKanban, Search, Filter, MapPin, Calendar, CheckCircle2,
  Clock, ArrowRight, X, Briefcase, FileText
} from 'lucide-react';
import EmptyState from './EmptyState';
import { ProjectCardsSkeleton, ErrorState } from './SkeletonLoader';

interface ProjectsTabProps {
  vendorId: string;
  selectedProject?: any;
  onSelectProject?: (proj: any) => void;
  onClearSelectedProject?: () => void;
}

const statusColors: Record<string, string> = {
  'In Progress': 'bg-blue-50 text-blue-700',
  'Under Review': 'bg-amber-50 text-amber-700',
  'Approved': 'bg-emerald-50 text-emerald-700',
  'Completed': 'bg-emerald-100 text-emerald-800',
  'On Hold': 'bg-slate-100 text-slate-700',
  'Delayed': 'bg-rose-50 text-rose-700',
};

const priorityColors: Record<string, string> = {
  Critical: 'bg-rose-100 text-rose-700 border-rose-200',
  High: 'bg-amber-100 text-amber-700 border-amber-200',
  Medium: 'bg-blue-100 text-blue-700 border-blue-200',
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function ProjectsTab({
  vendorId,
  selectedProject: externalSelectedProject,
  onSelectProject,
  onClearSelectedProject
}: ProjectsTabProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'on hold'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<any | null>(externalSelectedProject || null);

  useEffect(() => {
    if (externalSelectedProject) {
      setSelectedProject(externalSelectedProject);
    }
  }, [externalSelectedProject]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/vendor/projects/${vendorId}?status=${activeFilter}&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load project records');
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      } else {
        throw new Error(data.detail || 'Could not fetch projects');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [vendorId, activeFilter, searchQuery]);

  const handleClearFilters = () => {
    setActiveFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Projects</h2>
          <p className="text-slate-500 text-xs font-medium mt-1">
            View and manage all projects assigned to you by the department
          </p>
        </div>

        {/* Controls: Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 w-56 shadow-2xs"
            />
          </div>
          <button
            onClick={() => handleClearFilters()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-2xs"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All Projects' },
          { id: 'active', label: 'Active' },
          { id: 'completed', label: 'Completed' },
          { id: 'on hold', label: 'On Hold' },
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

      {/* Main Content Area */}
      {loading ? (
        <ProjectCardsSkeleton count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProjects} />
      ) : projects.length === 0 ? (
        searchQuery || activeFilter !== 'all' ? (
          <EmptyState
            icon="search"
            title="No matching projects found"
            description="Try adjusting your search terms or filter criteria to see your assigned projects."
            actionText="Clear Filters"
            onAction={handleClearFilters}
          />
        ) : (
          <EmptyState
            icon="folder"
            title="No projects assigned yet"
            description="Projects assigned to you by the department will appear here."
          />
        )
      ) : (
        <div className="grid gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => {
                setSelectedProject(proj);
                onSelectProject?.(proj);
              }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-5 hover:border-violet-200 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <div className="text-sm font-bold text-slate-800">{proj.title}</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      {proj.department || 'Infrastructure & Public Works'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {proj.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Due: {proj.deadline}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[proj.status] || 'bg-slate-100 text-slate-700'}`}>
                    {proj.status}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[proj.priority] || 'border-slate-200 text-slate-600'}`}>
                    {proj.priority || 'Medium'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="text-center p-2.5 bg-violet-50 rounded-xl">
                  <div className="text-lg font-extrabold text-violet-600">{proj.progress}%</div>
                  <div className="text-[10px] font-semibold text-violet-400">Progress</div>
                </div>
                <div className="text-center p-2.5 bg-blue-50 rounded-xl">
                  <div className="text-lg font-extrabold text-blue-600">
                    {proj.milestones?.filter((m: any) => m.status === 'Completed' || m.status === 'Approved').length || 0} / {proj.milestones?.length || 0}
                  </div>
                  <div className="text-[10px] font-semibold text-blue-400">Milestones</div>
                </div>
                <div className="text-center p-2.5 bg-emerald-50 rounded-xl">
                  <div className="text-lg font-extrabold text-emerald-600">{proj.estimated_cost || '₹45,00,000'}</div>
                  <div className="text-[10px] font-semibold text-emerald-400">Budget</div>
                </div>
                <div className="text-center p-2.5 bg-amber-50 rounded-xl">
                  <div className="text-sm font-extrabold text-amber-700 truncate px-1">
                    {proj.category || 'Road'}
                  </div>
                  <div className="text-[10px] font-semibold text-amber-500">Category</div>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-violet-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${proj.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{selectedProject.title}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  {selectedProject.department} • {selectedProject.location}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedProject(null);
                  onClearSelectedProject?.();
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-violet-50 rounded-2xl border border-violet-100">
                <div className="text-[10px] font-bold text-violet-600 uppercase">Progress</div>
                <div className="text-2xl font-extrabold text-violet-700 mt-1">{selectedProject.progress}%</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="text-[10px] font-bold text-emerald-600 uppercase">Budget</div>
                <div className="text-lg font-extrabold text-emerald-700 mt-1">{selectedProject.estimated_cost}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="text-[10px] font-bold text-blue-600 uppercase">Status</div>
                <div className="text-xs font-bold text-blue-700 mt-2">{selectedProject.status}</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="text-[10px] font-bold text-amber-600 uppercase">Deadline</div>
                <div className="text-xs font-bold text-amber-700 mt-2">{selectedProject.deadline}</div>
              </div>
            </div>

            {/* Milestones timeline */}
            <div className="border-t border-slate-100 pt-5">
              <h4 className="text-sm font-extrabold text-slate-900 mb-4">Project Milestones</h4>
              {selectedProject.milestones && selectedProject.milestones.length > 0 ? (
                <div className="space-y-4">
                  {selectedProject.milestones.map((m: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                          m.status === 'Completed' || m.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-600'
                            : m.status === 'In Progress'
                            ? 'bg-violet-100 text-violet-600 ring-2 ring-violet-200'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {m.status === 'Completed' || m.status === 'Approved' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                        </div>
                        {idx < selectedProject.milestones.length - 1 && (
                          <div className="w-0.5 h-8 bg-slate-200 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{m.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            m.status === 'Completed' || m.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{m.date || selectedProject.deadline}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No milestone records defined for this project.</p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setSelectedProject(null);
                  onClearSelectedProject?.();
                }}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
