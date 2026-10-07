import React, { useState } from 'react';
import {
  Briefcase, LayoutDashboard, FolderKanban, UploadCloud, Bell, Settings, LogOut, Sun, ChevronDown,
  CheckCircle2, Clock, FileText, Star, ChevronRight, Target, Eye, Calendar, Award,
  TrendingUp, Package, Activity, BarChart3, MapPin, User, ArrowUpRight, Upload,
  Image, File, Plus, AlertTriangle, Bot
} from 'lucide-react';

// Mock data for vendor prototype
const MOCK_ASSIGNED_PROJECTS = [
  { id: 1, title: 'Kothrud Road Widening Project', status: 'In Progress', priority: 'High', progress: 68, budget: '₹4.2 Cr', deadline: '15 Mar 2027', currentMilestone: 'Phase 2: Core Road Work', totalMilestones: 5, completedMilestones: 2, location: 'Kothrud, Pune' },
  { id: 2, title: 'Baner Sewage Treatment Plant', status: 'In Progress', priority: 'Critical', progress: 15, budget: '₹8.7 Cr', deadline: '30 Jun 2027', currentMilestone: 'Phase 1: Foundation', totalMilestones: 6, completedMilestones: 0, location: 'Baner, Pune' },
  { id: 3, title: 'Deccan Water Pipeline Upgrade', status: 'Completed', priority: 'High', progress: 100, budget: '₹3.5 Cr', deadline: '10 Jan 2026', currentMilestone: 'Completed', totalMilestones: 4, completedMilestones: 4, location: 'Deccan, Pune' },
];

const MOCK_MILESTONES = [
  { id: 1, projectId: 1, name: 'Site Survey & Planning', status: 'completed', date: '15 Jan 2026', evidence: 3 },
  { id: 2, projectId: 1, name: 'Road Foundation & Drainage', status: 'completed', date: '28 Mar 2026', evidence: 5 },
  { id: 3, projectId: 1, name: 'Core Road Construction', status: 'in-progress', date: '30 Sep 2026', evidence: 2 },
  { id: 4, projectId: 1, name: 'Divider & Sidewalk', status: 'upcoming', date: '15 Jan 2027', evidence: 0 },
  { id: 5, projectId: 1, name: 'Final Inspection & Handover', status: 'upcoming', date: '15 Mar 2027', evidence: 0 },
];

const MOCK_VENDOR_NOTIFICATIONS = [
  { id: 1, text: 'Milestone update approved for Kothrud Road Project - Phase 2', time: '2 hours ago', type: 'success' },
  { id: 2, text: 'New project assignment: Baner Sewage Treatment Plant', time: '1 day ago', type: 'info' },
  { id: 3, text: 'Evidence required: Upload photos for current milestone', time: '2 days ago', type: 'warning' },
  { id: 4, text: 'Performance review completed - Score: 92%', time: '3 days ago', type: 'success' },
  { id: 5, text: 'Deadline reminder: Kothrud Road Project - 8 months remaining', time: '1 week ago', type: 'info' },
];

const statusColors = {
  'In Progress': 'bg-blue-50 text-blue-700',
  'Completed': 'bg-green-100 text-green-800',
  'Delayed': 'bg-rose-50 text-rose-700',
  'Pending': 'bg-amber-50 text-amber-700',
};

const priorityColors = {
  Critical: 'bg-rose-100 text-rose-700 border-rose-200',
  High: 'bg-amber-100 text-amber-700 border-amber-200',
  Medium: 'bg-blue-100 text-blue-700 border-blue-200',
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function VendorDashboard({ vendorId, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(null);

  const vendorData = (() => {
    try {
      const saved = localStorage.getItem('smartgov_vendor_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { company_name: 'ABC Infra Pvt Ltd', contact_person: 'Rajesh Kumar', specialization: 'Infrastructure' };
  })();

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f3ff]/30 font-sans text-slate-800">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-60 bg-white border-r border-slate-100 hidden md:flex flex-col justify-between p-4 shrink-0 z-20 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center space-x-2.5 px-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-sm shadow-violet-200">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold tracking-tight text-slate-900">
              <span>SmartGov</span> <span className="text-violet-600 font-bold">Insight</span>
            </div>
          </div>

          <div className="mx-2 px-3 py-2 bg-violet-50 border border-violet-100 rounded-xl flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-violet-600" />
            <span className="text-[11px] font-bold text-violet-700 uppercase tracking-wider">Vendor Portal</span>
          </div>

          <nav className="space-y-0.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'projects', label: 'My Projects', icon: FolderKanban },
              { id: 'milestones', label: 'Milestone Updates', icon: Target },
              { id: 'evidence', label: 'Evidence Upload', icon: UploadCloud },
              { id: 'performance', label: 'Performance', icon: BarChart3 },
              { id: 'profile', label: 'Vendor Profile', icon: User },
              { id: 'notifications', label: 'Notifications', icon: Bell, badge: MOCK_VENDOR_NOTIFICATIONS.length },
            ].map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedProject(null); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  activeTab === item.id ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}>
                <div className="flex items-center space-x-3">
                  <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-violet-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-violet-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">{item.badge}</span>
                )}
              </button>
            ))}

            <div className="border-t border-slate-100 pt-2 mt-2">
              <button onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  activeTab === 'settings' ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-500 hover:bg-slate-50'
                }`}>
                <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-violet-600' : 'text-slate-400'}`} />
                <span>Settings</span>
              </button>
              <button onClick={onLogout}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="p-3 bg-violet-50/70 border border-violet-100 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center space-x-1.5 text-violet-700 font-bold text-[11px]">
              <Award className="w-3.5 h-3.5 text-violet-600" />
              <span>Performance Score</span>
            </div>
            <div className="text-2xl font-extrabold text-violet-700">92%</div>
            <div className="w-full bg-violet-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-violet-600 h-full rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>
          <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-2xs">
            <div className="flex items-center space-x-2">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light Mode</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="px-8 py-4 flex items-center justify-between sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-violet-100/80 shadow-xs transition-all">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {getGreetingTime()}, {vendorData.contact_person?.split(' ')[0] || 'Vendor'}! 🏗️
            </h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">{vendorData.company_name} • Vendor Dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-violet-50 border border-violet-100/80 px-3.5 py-1.5 rounded-2xl flex items-center space-x-2 text-xs font-semibold text-violet-900">
              <Briefcase className="w-3.5 h-3.5 text-violet-600 shrink-0" />
              <span>{vendorData.specialization || 'Infrastructure'}</span>
            </div>
            <div className="relative">
              <button onClick={() => setActiveTab('notifications')} className="w-9 h-9 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600 hover:bg-slate-50">
                <Bell className="w-4 h-4" />
              </button>
              <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {MOCK_VENDOR_NOTIFICATIONS.length}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full ring-2 ring-violet-200 overflow-hidden shadow-2xs flex items-center justify-center bg-violet-700 text-white font-bold text-xs">
              {vendorData.company_name?.[0] || 'V'}
            </div>
          </div>
        </header>

        <main className="px-8 pb-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* ========= DASHBOARD ========= */}
          {activeTab === 'dashboard' && (
            <>
              {/* Banner */}
              <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 border border-violet-100 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between shadow-2xs relative overflow-hidden">
                <div className="space-y-2.5 z-10 max-w-md">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-violet-100 rounded-full text-[10px] font-bold text-violet-700 uppercase tracking-wider">
                    <Briefcase className="w-3 h-3" /> Vendor Dashboard
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Project Hub</h2>
                  <p className="text-slate-600 text-xs font-medium leading-relaxed">
                    Track assigned projects, update milestones, and maintain your performance score.
                  </p>
                  <button onClick={() => setActiveTab('milestones')} className="mt-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4.5 py-2.5 rounded-xl text-xs shadow-md transition-all">
                    Update Milestones
                  </button>
                </div>
                <div className="mt-4 md:mt-0">
                  <svg width="180" height="90" viewBox="0 0 180 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="25" width="25" height="65" rx="4" fill="#8b5cf6" fillOpacity="0.2" />
                    <rect x="45" y="10" width="25" height="80" rx="4" fill="#7c3aed" fillOpacity="0.3" />
                    <rect x="80" y="35" width="25" height="55" rx="4" fill="#6d28d9" fillOpacity="0.2" />
                    <rect x="115" y="5" width="25" height="85" rx="4" fill="#5b21b6" fillOpacity="0.3" />
                    <rect x="150" y="20" width="25" height="70" rx="4" fill="#4c1d95" fillOpacity="0.2" />
                    <path d="M22 28 L57 15 L92 38 L127 8 L162 22" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                  </svg>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Assigned Projects', value: '3', color: 'violet', icon: FolderKanban },
                  { label: 'Active Projects', value: '2', color: 'blue', icon: Activity },
                  { label: 'Completed', value: '1', color: 'emerald', icon: CheckCircle2 },
                  { label: 'Performance Score', value: '92%', color: 'amber', icon: Award },
                ].map((stat, i) => (
                  <div key={i} className={`bg-${stat.color === 'violet' ? '[#f5f3ff]' : stat.color === 'blue' ? '[#eff6ff]' : stat.color === 'emerald' ? '[#eefdf5]' : '[#fffbeb]'} border border-${stat.color}-100/70 p-5 rounded-2xl shadow-2xs`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-500 mb-2`} />
                    <div className={`text-3xl font-extrabold text-${stat.color}-600`}>{stat.value}</div>
                    <div className={`text-xs font-bold text-${stat.color}-800 mt-1`}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Projects & Notifications */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900">Active Projects</h3>
                    <button onClick={() => setActiveTab('projects')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                    {MOCK_ASSIGNED_PROJECTS.filter(p => p.status !== 'Completed').map((proj) => (
                      <div key={proj.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => { setSelectedProject(proj); setActiveTab('project-detail'); }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-extrabold text-sm">
                            {proj.progress}%
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{proj.title}</div>
                            <div className="text-[11px] text-slate-400 font-medium">Milestone: {proj.currentMilestone}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900">Recent Updates</h3>
                    <button onClick={() => setActiveTab('notifications')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                    {MOCK_VENDOR_NOTIFICATIONS.slice(0, 4).map((n) => (
                      <div key={n.id} className="flex items-start space-x-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                          n.type === 'warning' ? 'bg-amber-100 text-amber-600' : n.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {n.type === 'warning' ? '⚠️' : n.type === 'success' ? '✅' : '📋'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 leading-snug">{n.text}</div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========= MY PROJECTS ========= */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">My Projects</h2>
                <p className="text-slate-500 text-xs font-medium mt-1">All projects assigned to your company</p>
              </div>

              <div className="grid gap-4">
                {MOCK_ASSIGNED_PROJECTS.map((proj) => (
                  <div key={proj.id} className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-5 hover:border-violet-200 transition-all cursor-pointer"
                    onClick={() => { setSelectedProject(proj); setActiveTab('project-detail'); }}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-sm font-bold text-slate-800">{proj.title}</div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-2">
                          <MapPin className="w-3 h-3" /> {proj.location} • Due: {proj.deadline}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[proj.status]}`}>{proj.status}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${priorityColors[proj.priority]}`}>{proj.priority}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="text-center p-2 bg-violet-50 rounded-xl">
                        <div className="text-lg font-extrabold text-violet-600">{proj.progress}%</div>
                        <div className="text-[10px] font-medium text-violet-400">Progress</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded-xl">
                        <div className="text-lg font-extrabold text-blue-600">{proj.completedMilestones}/{proj.totalMilestones}</div>
                        <div className="text-[10px] font-medium text-blue-400">Milestones</div>
                      </div>
                      <div className="text-center p-2 bg-emerald-50 rounded-xl">
                        <div className="text-lg font-extrabold text-emerald-600">{proj.budget}</div>
                        <div className="text-[10px] font-medium text-emerald-400">Budget</div>
                      </div>
                      <div className="text-center p-2 bg-amber-50 rounded-xl">
                        <div className="text-lg font-extrabold text-amber-600">{proj.currentMilestone.split(':')[0]}</div>
                        <div className="text-[10px] font-medium text-amber-400">Current</div>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-violet-500 h-full rounded-full transition-all" style={{ width: `${proj.progress}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========= PROJECT DETAIL ========= */}
          {activeTab === 'project-detail' && selectedProject && (
            <div className="space-y-6">
              <button onClick={() => setActiveTab('projects')} className="text-xs font-bold text-blue-600 hover:underline">← Back to My Projects</button>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">{selectedProject.title}</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> {selectedProject.location} • Budget: {selectedProject.budget}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusColors[selectedProject.status]}`}>{selectedProject.status}</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100">
                    <div className="text-[11px] font-bold text-violet-600 uppercase mb-1">Progress</div>
                    <div className="text-3xl font-extrabold text-violet-700">{selectedProject.progress}%</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="text-[11px] font-bold text-blue-600 uppercase mb-1">Milestones</div>
                    <div className="text-3xl font-extrabold text-blue-700">{selectedProject.completedMilestones}/{selectedProject.totalMilestones}</div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="text-[11px] font-bold text-emerald-600 uppercase mb-1">Budget</div>
                    <div className="text-2xl font-extrabold text-emerald-700">{selectedProject.budget}</div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="text-[11px] font-bold text-amber-600 uppercase mb-1">Deadline</div>
                    <div className="text-lg font-extrabold text-amber-700">{selectedProject.deadline}</div>
                  </div>
                </div>

                {/* Milestones */}
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold text-slate-900">Milestones</h3>
                    <button className="text-xs font-bold text-violet-600 flex items-center gap-1 hover:underline">
                      <Plus className="w-3.5 h-3.5" /> Update Progress
                    </button>
                  </div>
                  <div className="space-y-4">
                    {MOCK_MILESTONES.map((m, i) => (
                      <div key={m.id} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            m.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : m.status === 'in-progress' ? 'bg-violet-100 text-violet-600 ring-2 ring-violet-300' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {m.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : m.status === 'in-progress' ? <Clock className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-slate-300"></div>}
                          </div>
                          {i < MOCK_MILESTONES.length - 1 && <div className={`w-0.5 h-8 ${m.status === 'completed' ? 'bg-emerald-200' : 'bg-slate-200'}`}></div>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className={`text-xs font-bold ${m.status === 'completed' ? 'text-emerald-700' : m.status === 'in-progress' ? 'text-violet-700' : 'text-slate-500'}`}>
                              {m.name}
                            </div>
                            {m.evidence > 0 && (
                              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                <Image className="w-3 h-3" /> {m.evidence} files
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">{m.date}</div>
                          {m.status === 'in-progress' && (
                            <button className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-[11px] font-bold hover:bg-violet-700 transition-all">
                              <Upload className="w-3 h-3" /> Upload Evidence
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========= MILESTONE UPDATES ========= */}
          {activeTab === 'milestones' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Milestone Updates</h2>
                <p className="text-slate-500 text-xs font-medium mt-1">Submit progress updates for your active project milestones</p>
              </div>

              {MOCK_ASSIGNED_PROJECTS.filter(p => p.status !== 'Completed').map((proj) => (
                <div key={proj.id} className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-bold text-slate-800">{proj.title}</div>
                      <div className="text-[11px] text-slate-400 font-medium">{proj.location} • Current: {proj.currentMilestone}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[proj.status]}`}>{proj.status}</span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-medium text-slate-500">Overall Progress</span>
                      <span className="font-bold text-violet-700">{proj.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-violet-500 h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 shadow-md transition-all">
                      <Target className="w-4 h-4" /> Update Progress
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all">
                      <UploadCloud className="w-4 h-4" /> Upload Evidence
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========= EVIDENCE UPLOAD ========= */}
          {activeTab === 'evidence' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Evidence Upload</h2>
                <p className="text-slate-500 text-xs font-medium mt-1">Upload photos, documents, and reports as evidence for project milestones</p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6">
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Project</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-600 text-sm bg-white">
                    {MOCK_ASSIGNED_PROJECTS.filter(p => p.status !== 'Completed').map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Milestone</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-600 text-sm bg-white">
                    <option>Phase 2: Core Road Work</option>
                    <option>Phase 1: Foundation</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Upload Files</label>
                  <div className="border-2 border-dashed border-violet-200 rounded-2xl p-8 text-center hover:border-violet-500 transition-colors bg-violet-50/30 cursor-pointer">
                    <UploadCloud className="w-12 h-12 text-violet-400 mx-auto mb-3" />
                    <div className="text-sm font-bold text-slate-700">Drop files here or click to upload</div>
                    <div className="text-xs text-slate-400 mt-1">Photos (JPG, PNG), Documents (PDF), max 10MB each</div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description / Notes</label>
                  <textarea placeholder="Describe the work completed..." rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-600 text-sm bg-white resize-none"></textarea>
                </div>

                <button className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> Submit Evidence
                </button>
              </div>

              {/* Previous Uploads */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-5">
                <h3 className="text-sm font-extrabold text-slate-900 mb-4">Previous Uploads</h3>
                <div className="space-y-3">
                  {[
                    { name: 'road_foundation_photo_1.jpg', type: 'Image', date: '28 Mar 2026', size: '2.4 MB', milestone: 'Road Foundation' },
                    { name: 'drainage_report.pdf', type: 'Document', date: '28 Mar 2026', size: '1.1 MB', milestone: 'Road Foundation' },
                    { name: 'survey_completion_cert.pdf', type: 'Document', date: '15 Jan 2026', size: '0.8 MB', milestone: 'Site Survey' },
                  ].map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${file.type === 'Image' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                          {file.type === 'Image' ? <Image className="w-5 h-5" /> : <File className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{file.name}</div>
                          <div className="text-[11px] text-slate-400 font-medium">{file.milestone} • {file.date} • {file.size}</div>
                        </div>
                      </div>
                      <button className="text-xs font-bold text-blue-600 hover:underline">View</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========= PERFORMANCE ========= */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Performance Tracking</h2>
                <p className="text-slate-500 text-xs font-medium mt-1">Your vendor performance metrics and ratings</p>
              </div>

              {/* Overall Score */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mx-auto shadow-xl shadow-violet-200 mb-4">
                  <span className="text-3xl font-extrabold text-white">92%</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Excellent Performance</h3>
                <p className="text-slate-500 text-xs mt-1">You're in the top 10% of vendors on the platform</p>
                <div className="flex justify-center gap-1 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-amber-200 fill-amber-200'}`} />
                  ))}
                  <span className="text-sm font-bold text-slate-600 ml-2">4.5 / 5.0</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'On-Time Delivery', value: '95%', color: 'emerald' },
                  { label: 'Quality Score', value: '88%', color: 'blue' },
                  { label: 'Budget Adherence', value: '91%', color: 'amber' },
                  { label: 'Documentation', value: '93%', color: 'violet' },
                ].map((metric, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs">
                    <div className={`text-3xl font-extrabold text-${metric.color}-600`}>{metric.value}</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">{metric.label}</div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                      <div className={`bg-${metric.color}-500 h-full rounded-full`} style={{ width: metric.value }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Project-wise */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6">
                <h3 className="text-sm font-extrabold text-slate-900 mb-4">Project-wise Performance</h3>
                <div className="space-y-3">
                  {MOCK_ASSIGNED_PROJECTS.map((proj) => (
                    <div key={proj.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50">
                      <div>
                        <div className="text-xs font-bold text-slate-800">{proj.title}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{proj.location}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-violet-500 h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-700">{proj.progress}%</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusColors[proj.status]}`}>{proj.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========= VENDOR PROFILE ========= */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-slate-900">Vendor Profile</h2>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-violet-200">
                    {vendorData.company_name?.[0] || 'V'}
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-slate-900">{vendorData.company_name || 'ABC Infra Pvt Ltd'}</div>
                    <div className="text-sm text-slate-500 font-medium">{vendorData.specialization || 'Infrastructure'} Specialist</div>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                      <span className="text-xs font-bold text-slate-600 ml-1">4.5</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Contact Person', value: vendorData.contact_person || 'Rajesh Kumar' },
                    { label: 'Email', value: vendorData.email || 'info@abcinfra.com' },
                    { label: 'GST Number', value: vendorData.gst_number || '27AABCU9603R1ZM' },
                    { label: 'PAN Number', value: vendorData.pan_number || 'AABCU9603R' },
                    { label: 'Experience', value: (vendorData.experience ? `${vendorData.experience} Years` : '15 Years') },
                    { label: 'Total Projects', value: '12' },
                    { label: 'Active Projects', value: '2' },
                    { label: 'Performance Score', value: '92%' },
                  ].map((item, i) => (
                    <div key={i} className="py-3 border-b border-slate-100">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========= NOTIFICATIONS ========= */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-slate-900">Notifications</h2>
              <div className="space-y-3">
                {MOCK_VENDOR_NOTIFICATIONS.map((n) => (
                  <div key={n.id} className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4 flex items-start gap-3 hover:border-violet-200 transition-all cursor-pointer">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                      n.type === 'warning' ? 'bg-amber-100 text-amber-600' : n.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {n.type === 'warning' ? '⚠️' : n.type === 'success' ? '✅' : '📋'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-800">{n.text}</div>
                      <div className="text-xs text-slate-400 font-medium mt-1">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========= SETTINGS ========= */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-slate-900">Settings</h2>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6 max-w-2xl">
                <div className="space-y-6">
                  {[
                    { title: 'Email Notifications', desc: 'Receive alerts for project updates' },
                    { title: 'Milestone Reminders', desc: 'Get reminded before milestone deadlines' },
                    { title: 'Performance Alerts', desc: 'Notifications when performance score changes' },
                    { title: 'Dark Mode', desc: 'Toggle dark theme', off: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0">
                      <div>
                        <div className="text-sm font-bold text-slate-800">{item.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                      </div>
                      <div className={`w-10 h-6 ${item.off ? 'bg-slate-200' : 'bg-violet-500'} rounded-full p-0.5 cursor-pointer`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md ${item.off ? '' : 'transform translate-x-4'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
