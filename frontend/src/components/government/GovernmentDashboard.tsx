import React, { useState } from 'react';
import {
  Building2, LayoutDashboard, FolderKanban, Users, BarChart3, AlertTriangle,
  Bell, Settings, LogOut, Sun, ChevronDown, MapPin, TrendingUp, Clock,
  CheckCircle2, XCircle, FileText, ShieldCheck, Star, ArrowUpRight,
  Bot, Activity, Zap, Target, Eye, Package, Calendar, ChevronRight,
  Award, Briefcase, PieChart, Filter, Search, MoreHorizontal
} from 'lucide-react';

// Sample prototype data
const MOCK_PROJECTS = [
  { id: 1, title: 'Kothrud Road Widening Project', vendor: 'ABC Infra Pvt Ltd', status: 'In Progress', priority: 'High', aiScore: 92, progress: 68, budget: '₹4.2 Cr', deadline: '15 Mar 2027', category: 'Infrastructure' },
  { id: 2, title: 'Baner Sewage Treatment Plant', vendor: 'GreenTech Solutions', status: 'Under Review', priority: 'Critical', aiScore: 97, progress: 15, budget: '₹8.7 Cr', deadline: '30 Jun 2027', category: 'Sanitation' },
  { id: 3, title: 'Hinjewadi Smart Street Lights', vendor: 'LumiTech Systems', status: 'Approved', priority: 'Medium', aiScore: 78, progress: 0, budget: '₹1.8 Cr', deadline: '20 Sep 2027', category: 'Smart City' },
  { id: 4, title: 'Wakad Park Renovation', vendor: 'CityScape Builders', status: 'In Progress', priority: 'Low', aiScore: 65, progress: 45, budget: '₹0.9 Cr', deadline: '01 Dec 2026', category: 'Recreation' },
  { id: 5, title: 'Deccan Water Pipeline Upgrade', vendor: 'AquaFlow Engineering', status: 'Completed', priority: 'High', aiScore: 88, progress: 100, budget: '₹3.5 Cr', deadline: '10 Jan 2026', category: 'Water Supply' },
  { id: 6, title: 'Pimpri Digital Library Setup', vendor: 'EduTech Innovations', status: 'In Progress', priority: 'Medium', aiScore: 74, progress: 55, budget: '₹0.6 Cr', deadline: '28 Feb 2027', category: 'Education' },
];

const MOCK_VENDORS = [
  { id: 1, name: 'ABC Infra Pvt Ltd', rating: 4.5, projects: 12, active: 3, performance: 92, specialization: 'Road & Infrastructure' },
  { id: 2, name: 'GreenTech Solutions', rating: 4.2, projects: 8, active: 2, performance: 87, specialization: 'Environmental' },
  { id: 3, name: 'LumiTech Systems', rating: 4.7, projects: 15, active: 4, performance: 95, specialization: 'Smart City & IoT' },
  { id: 4, name: 'CityScape Builders', rating: 3.8, projects: 6, active: 1, performance: 76, specialization: 'Construction' },
  { id: 5, name: 'AquaFlow Engineering', rating: 4.4, projects: 10, active: 2, performance: 89, specialization: 'Water Management' },
];

const MOCK_COMPLAINTS_DEMAND = [
  { id: 1, area: 'Kothrud', category: 'Road', count: 156, trend: '+12%', severity: 'High' },
  { id: 2, area: 'Baner', category: 'Water', count: 98, trend: '+8%', severity: 'Critical' },
  { id: 3, area: 'Hinjewadi', category: 'Street Light', count: 67, trend: '-3%', severity: 'Medium' },
  { id: 4, area: 'Wakad', category: 'Drainage', count: 45, trend: '+22%', severity: 'High' },
  { id: 5, area: 'Deccan', category: 'Garbage', count: 34, trend: '-5%', severity: 'Low' },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'AI recommends vendor "LumiTech" for Smart Street Lights project', time: '2 hours ago', type: 'ai' },
  { id: 2, text: 'Delay risk detected: Kothrud Road Project may miss deadline by 15 days', time: '3 hours ago', type: 'warning' },
  { id: 3, text: 'New vendor application from "BuildRight Construction"', time: '5 hours ago', type: 'info' },
  { id: 4, text: 'Milestone completed: Baner Sewage - Phase 1 Foundation', time: '1 day ago', type: 'success' },
  { id: 5, text: 'Risk score increased for Wakad Park project (67 → 78)', time: '1 day ago', type: 'warning' },
];

const priorityColors = {
  Critical: 'bg-rose-100 text-rose-700 border-rose-200',
  High: 'bg-amber-100 text-amber-700 border-amber-200',
  Medium: 'bg-blue-100 text-blue-700 border-blue-200',
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
};

const statusColors = {
  'In Progress': 'bg-blue-50 text-blue-700',
  'Under Review': 'bg-amber-50 text-amber-700',
  'Approved': 'bg-emerald-50 text-emerald-700',
  'Completed': 'bg-green-100 text-green-800',
  'Delayed': 'bg-rose-50 text-rose-700',
};

export default function GovernmentDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(null);

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f6f1] font-sans text-slate-800">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-60 bg-white border-r border-slate-100 hidden md:flex flex-col justify-between p-4 shrink-0 z-20 overflow-y-auto">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center space-x-2.5 px-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm shadow-amber-200">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold tracking-tight text-slate-900">
              <span>SmartGov</span> <span className="text-amber-600 font-bold">Insight</span>
            </div>
          </div>

          {/* Role Badge */}
          <div className="mx-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Government Portal</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-0.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'projects', label: 'Project Management', icon: FolderKanban },
              { id: 'prioritization', label: 'AI Prioritization', icon: Zap },
              { id: 'vendors', label: 'Vendor Management', icon: Briefcase },
              { id: 'monitoring', label: 'Monitoring', icon: Activity },
              { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
              { id: 'demand', label: 'Citizen Demand', icon: Users },
              { id: 'notifications', label: 'Notifications', icon: Bell, badge: MOCK_NOTIFICATIONS.length },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSelectedProject(null); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  activeTab === item.id
                    ? 'bg-amber-50 text-amber-700 font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-amber-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="border-t border-slate-100 pt-2 mt-2">
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  activeTab === 'settings' ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>Settings</span>
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom Area */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center space-x-1.5 text-amber-700 font-bold text-[11px]">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Municipal Corp.</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-700 leading-snug">Pune, Maharashtra</div>
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
        {/* TOP HEADER */}
        <header className="px-8 py-4 flex items-center justify-between sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-100/80 shadow-xs transition-all">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {getGreetingTime()}, Admin! 🏛️
            </h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Government Project Management Dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-amber-50 border border-amber-100/80 px-3.5 py-1.5 rounded-2xl flex items-center space-x-2 text-xs font-semibold text-amber-900">
              <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Municipal Corporation, Pune</span>
            </div>
            <div className="relative">
              <button onClick={() => setActiveTab('notifications')} className="w-9 h-9 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600 hover:bg-slate-50">
                <Bell className="w-4 h-4" />
              </button>
              <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {MOCK_NOTIFICATIONS.length}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full ring-2 ring-amber-200 overflow-hidden shadow-2xs flex items-center justify-center bg-amber-700 text-white font-bold text-xs">
              G
            </div>
          </div>
        </header>

        <main className="px-8 pb-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* ========= MAIN DASHBOARD ========= */}
          {activeTab === 'dashboard' && (
            <>
              {/* Banner */}
              <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-100 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between shadow-2xs relative overflow-hidden">
                <div className="space-y-2.5 z-10 max-w-md">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-100 rounded-full text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    <Zap className="w-3 h-3" /> AI-Powered Governance
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Project Control Center</h2>
                  <p className="text-slate-600 text-xs font-medium leading-relaxed">
                    Review AI-prioritized projects, monitor vendor performance, and track milestones in real-time.
                  </p>
                  <button onClick={() => setActiveTab('projects')} className="mt-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4.5 py-2.5 rounded-xl text-xs shadow-md transition-all">
                    View All Projects
                  </button>
                </div>
                <div className="mt-4 md:mt-0">
                  <svg width="200" height="100" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="30" width="30" height="70" rx="4" fill="#fbbf24" fillOpacity="0.3" />
                    <rect x="50" y="15" width="30" height="85" rx="4" fill="#f59e0b" fillOpacity="0.4" />
                    <rect x="90" y="40" width="30" height="60" rx="4" fill="#d97706" fillOpacity="0.3" />
                    <rect x="130" y="10" width="30" height="90" rx="4" fill="#b45309" fillOpacity="0.4" />
                    <rect x="170" y="25" width="25" height="75" rx="4" fill="#92400e" fillOpacity="0.3" />
                    <path d="M25 30 L65 18 L105 42 L145 12 L182 27" stroke="#d97706" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                  </svg>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Total Projects', value: '247', color: 'amber', icon: FolderKanban },
                  { label: 'Active Projects', value: '84', color: 'blue', icon: Activity },
                  { label: 'Delayed', value: '12', color: 'rose', icon: AlertTriangle },
                  { label: 'Vendors', value: '89', color: 'purple', icon: Briefcase },
                  { label: 'Completion Rate', value: '78%', color: 'emerald', icon: Target },
                ].map((stat, i) => (
                  <div key={i} className={`bg-${stat.color === 'amber' ? '[#fffbeb]' : stat.color === 'blue' ? '[#eff6ff]' : stat.color === 'rose' ? 'rose-50' : stat.color === 'purple' ? '[#f5f3ff]' : '[#eefdf5]'} border border-${stat.color}-100/70 p-5 rounded-2xl shadow-2xs`}>
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                    </div>
                    <div className={`text-3xl font-extrabold text-${stat.color}-600`}>{stat.value}</div>
                    <div className={`text-xs font-bold text-${stat.color}-800 mt-1`}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* AI Recommendations */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-amber-600" /> AI Priority Recommendations
                    </h3>
                    <button onClick={() => setActiveTab('prioritization')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                    {MOCK_PROJECTS.filter(p => p.aiScore >= 78).slice(0, 4).map((proj) => (
                      <div key={proj.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setSelectedProject(proj); setActiveTab('project-detail'); }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-extrabold text-sm">
                            {proj.aiScore}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{proj.title}</div>
                            <div className="text-[11px] text-slate-400 font-medium">{proj.vendor} • {proj.category}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[proj.priority]}`}>{proj.priority}</span>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Notifications */}
                <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900">Alerts & Updates</h3>
                    <button onClick={() => setActiveTab('notifications')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                    {MOCK_NOTIFICATIONS.map((n) => (
                      <div key={n.id} className="flex items-start space-x-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                          n.type === 'warning' ? 'bg-rose-100 text-rose-600' : n.type === 'ai' ? 'bg-amber-100 text-amber-600' : n.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {n.type === 'warning' ? '⚠️' : n.type === 'ai' ? '🤖' : n.type === 'success' ? '✅' : '📋'}
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

          {/* ========= PROJECT MANAGEMENT ========= */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Project Management</h2>
                  <p className="text-slate-500 text-xs font-medium mt-1">Review, approve, and monitor all government projects</p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input placeholder="Search projects..." className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-amber-500 w-56" />
                  </div>
                  <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50">
                    <Filter className="w-3.5 h-3.5" /> Filter
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Project</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">AI Score</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Progress</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Budget</th>
                        <th className="text-right px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_PROJECTS.map((proj) => (
                        <tr key={proj.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => { setSelectedProject(proj); setActiveTab('project-detail'); }}>
                          <td className="px-5 py-4">
                            <div className="text-xs font-bold text-slate-800">{proj.title}</div>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5">{proj.category} • Due: {proj.deadline}</div>
                          </td>
                          <td className="px-5 py-4 text-xs font-medium text-slate-600">{proj.vendor}</td>
                          <td className="px-5 py-4">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[proj.status]}`}>{proj.status}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[proj.priority]}`}>{proj.priority}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-extrabold ${proj.aiScore >= 85 ? 'bg-emerald-100 text-emerald-700' : proj.aiScore >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                {proj.aiScore}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
                              </div>
                              <span className="text-[11px] font-bold text-slate-600">{proj.progress}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs font-bold text-slate-700">{proj.budget}</td>
                          <td className="px-5 py-4 text-right">
                            <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                              <MoreHorizontal className="w-4 h-4 text-slate-400" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========= PROJECT DETAIL ========= */}
          {activeTab === 'project-detail' && selectedProject && (
            <div className="space-y-6">
              <button onClick={() => setActiveTab('projects')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                ← Back to Projects
              </button>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">{selectedProject.title}</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">{selectedProject.category} • Assigned to {selectedProject.vendor}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusColors[selectedProject.status]}`}>{selectedProject.status}</span>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${priorityColors[selectedProject.priority]}`}>{selectedProject.priority}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="text-[11px] font-bold text-amber-600 uppercase mb-1">AI Priority Score</div>
                    <div className="text-3xl font-extrabold text-amber-700">{selectedProject.aiScore}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="text-[11px] font-bold text-blue-600 uppercase mb-1">Progress</div>
                    <div className="text-3xl font-extrabold text-blue-700">{selectedProject.progress}%</div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="text-[11px] font-bold text-emerald-600 uppercase mb-1">Budget</div>
                    <div className="text-2xl font-extrabold text-emerald-700">{selectedProject.budget}</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <div className="text-[11px] font-bold text-purple-600 uppercase mb-1">Deadline</div>
                    <div className="text-lg font-extrabold text-purple-700">{selectedProject.deadline}</div>
                  </div>
                </div>

                {/* Milestone Timeline */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4">Project Milestones</h3>
                  <div className="space-y-4">
                    {[
                      { name: 'Project Approval & Vendor Selection', status: 'completed', date: '15 Jan 2026' },
                      { name: 'Phase 1: Site Survey & Planning', status: 'completed', date: '28 Feb 2026' },
                      { name: 'Phase 2: Foundation & Core Work', status: 'in-progress', date: '30 Jun 2026' },
                      { name: 'Phase 3: Implementation & Testing', status: 'upcoming', date: '15 Nov 2026' },
                      { name: 'Phase 4: Completion & Handover', status: 'upcoming', date: selectedProject.deadline },
                    ].map((m, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            m.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : m.status === 'in-progress' ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-300' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {m.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : m.status === 'in-progress' ? <Clock className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-slate-300"></div>}
                          </div>
                          {i < 4 && <div className={`w-0.5 h-8 ${m.status === 'completed' ? 'bg-emerald-200' : 'bg-slate-200'}`}></div>}
                        </div>
                        <div>
                          <div className={`text-xs font-bold ${m.status === 'completed' ? 'text-emerald-700' : m.status === 'in-progress' ? 'text-amber-700' : 'text-slate-500'}`}>{m.name}</div>
                          <div className="text-[11px] text-slate-400 font-medium">{m.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========= AI PRIORITIZATION ========= */}
          {activeTab === 'prioritization' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-amber-500" /> AI Project Prioritization
                </h2>
                <p className="text-slate-500 text-xs font-medium mt-1">AI-calculated priority scores based on citizen demand, urgency, resource availability, and impact analysis</p>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                <Bot className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <span className="font-bold">AI Analysis Complete:</span> Based on 1,247 citizen complaints, demand patterns, and resource optimization, the following projects have been ranked by priority score.
                </div>
              </div>

              <div className="grid gap-4">
                {[...MOCK_PROJECTS].sort((a, b) => b.aiScore - a.aiScore).map((proj, index) => (
                  <div key={proj.id} className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-5 flex items-center justify-between hover:border-amber-200 transition-all cursor-pointer" onClick={() => { setSelectedProject(proj); setActiveTab('project-detail'); }}>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-lg ${
                          proj.aiScore >= 90 ? 'bg-emerald-100 text-emerald-700' : proj.aiScore >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {proj.aiScore}
                        </div>
                        <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                          #{index + 1}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{proj.title}</div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">{proj.vendor} • {proj.category} • Budget: {proj.budget}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[proj.priority]}`}>{proj.priority}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusColors[proj.status]}`}>{proj.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-600">{proj.progress}%</span>
                      </div>
                      <div className="text-[11px] text-slate-400">Due: {proj.deadline}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========= VENDOR MANAGEMENT ========= */}
          {activeTab === 'vendors' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">Vendor Management</h2>
                  <p className="text-slate-500 text-xs font-medium mt-1">Monitor vendor profiles, performance ratings, and project assignments</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 shadow-md transition-all">
                  <Users className="w-4 h-4" /> Add Vendor
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOCK_VENDORS.map((vendor) => (
                  <div key={vendor.id} className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-5 hover:border-amber-200 transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-amber-200">
                          {vendor.name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{vendor.name}</div>
                          <div className="text-[11px] text-slate-400 font-medium">{vendor.specialization}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 bg-slate-50 rounded-xl">
                        <div className="text-lg font-extrabold text-slate-800">{vendor.projects}</div>
                        <div className="text-[10px] font-medium text-slate-400">Total</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded-xl">
                        <div className="text-lg font-extrabold text-blue-600">{vendor.active}</div>
                        <div className="text-[10px] font-medium text-blue-400">Active</div>
                      </div>
                      <div className="text-center p-2 bg-emerald-50 rounded-xl">
                        <div className="text-lg font-extrabold text-emerald-600">{vendor.performance}%</div>
                        <div className="text-[10px] font-medium text-emerald-400">Score</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(vendor.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                        ))}
                        <span className="text-[11px] font-bold text-slate-600 ml-1">{vendor.rating}</span>
                      </div>
                      <button className="text-[11px] font-bold text-blue-600 hover:underline">View Profile →</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========= MONITORING ========= */}
          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Project Monitoring</h2>
                <p className="text-slate-500 text-xs font-medium mt-1">Real-time tracking of milestones, delays, and risk indicators</p>
              </div>

              {/* Delay Risk Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOCK_PROJECTS.filter(p => p.status === 'In Progress').map((proj) => {
                  const riskLevel = proj.progress < 50 ? 'High' : proj.progress < 75 ? 'Medium' : 'Low';
                  return (
                    <div key={proj.id} className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-sm font-bold text-slate-800">{proj.title}</div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          riskLevel === 'High' ? 'bg-rose-100 text-rose-700 border-rose-200' : riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}>
                          {riskLevel} Risk
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium mb-3">{proj.vendor} • Due: {proj.deadline}</div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-medium text-slate-500">Progress</span>
                          <span className="font-bold text-slate-700">{proj.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${proj.progress >= 60 ? 'bg-emerald-500' : proj.progress >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${proj.progress}%` }}></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        <Activity className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-medium text-slate-600">AI Delay Prediction: {proj.progress < 50 ? '15 days delay' : proj.progress < 75 ? '5 days delay' : 'On Track'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Risk Scoring Summary */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6">
                <h3 className="text-sm font-extrabold text-slate-900 mb-4">Risk Score Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                    <div className="text-3xl font-extrabold text-emerald-600">62</div>
                    <div className="text-xs font-bold text-emerald-700 mt-1">Low Risk Projects</div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                    <div className="text-3xl font-extrabold text-amber-600">18</div>
                    <div className="text-xs font-bold text-amber-700 mt-1">Medium Risk</div>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                    <div className="text-3xl font-extrabold text-rose-600">4</div>
                    <div className="text-xs font-bold text-rose-700 mt-1">High Risk</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========= ANALYTICS & REPORTS ========= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Analytics & Reports</h2>
                <p className="text-slate-500 text-xs font-medium mt-1">Comprehensive performance analytics and downloadable reports</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Avg Completion Time', value: '8.4 months', icon: Clock, color: 'blue' },
                  { label: 'Budget Utilization', value: '87%', icon: PieChart, color: 'emerald' },
                  { label: 'Citizen Satisfaction', value: '4.2/5', icon: Star, color: 'amber' },
                  { label: 'On-time Delivery', value: '72%', icon: Target, color: 'purple' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs">
                    <stat.icon className={`w-5 h-5 text-${stat.color}-500 mb-2`} />
                    <div className={`text-2xl font-extrabold text-${stat.color}-600`}>{stat.value}</div>
                    <div className="text-xs font-bold text-slate-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4">Project Category Distribution</h3>
                  <div className="space-y-3">
                    {[
                      { cat: 'Infrastructure', count: 87, pct: 35, color: 'amber' },
                      { cat: 'Water Supply', count: 52, pct: 21, color: 'blue' },
                      { cat: 'Smart City', count: 38, pct: 15, color: 'purple' },
                      { cat: 'Sanitation', count: 35, pct: 14, color: 'emerald' },
                      { cat: 'Education', count: 20, pct: 8, color: 'rose' },
                      { cat: 'Recreation', count: 15, pct: 7, color: 'slate' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-24 text-xs font-bold text-slate-600">{item.cat}</div>
                        <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-${item.color}-500`} style={{ width: `${item.pct}%` }}></div>
                        </div>
                        <div className="text-xs font-bold text-slate-700 w-12 text-right">{item.count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4">Monthly Project Completion Trend</h3>
                  <div className="flex items-end gap-3 h-48 pt-4">
                    {[
                      { month: 'Jan', value: 5 },
                      { month: 'Feb', value: 8 },
                      { month: 'Mar', value: 12 },
                      { month: 'Apr', value: 7 },
                      { month: 'May', value: 15 },
                      { month: 'Jun', value: 10 },
                      { month: 'Jul', value: 18 },
                      { month: 'Aug', value: 14 },
                    ].map((item, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                        <div className="text-[10px] font-bold text-amber-700">{item.value}</div>
                        <div className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-lg" style={{ height: `${(item.value / 18) * 100}%` }}></div>
                        <div className="text-[10px] font-medium text-slate-400">{item.month}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========= CITIZEN DEMAND ========= */}
          {activeTab === 'demand' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Citizen Demand Analysis</h2>
                <p className="text-slate-500 text-xs font-medium mt-1">AI-analyzed citizen complaints and development demands by area</p>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                <Bot className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <span className="font-bold">AI Insight:</span> Highest demand spike detected in Kothrud (+12%) for road infrastructure. Recommend prioritizing road-related projects in this area.
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase">Area</th>
                      <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase">Category</th>
                      <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase">Complaints</th>
                      <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase">Trend</th>
                      <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_COMPLAINTS_DEMAND.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-5 py-4 text-xs font-bold text-slate-800">{item.area}</td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-600">{item.category}</td>
                        <td className="px-5 py-4 text-xs font-extrabold text-slate-800">{item.count}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold ${item.trend.startsWith('+') ? 'text-rose-600' : 'text-emerald-600'}`}>{item.trend}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${priorityColors[item.severity]}`}>{item.severity}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========= NOTIFICATIONS ========= */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-extrabold text-slate-900">Notifications</h2>
              <div className="space-y-3">
                {MOCK_NOTIFICATIONS.map((n) => (
                  <div key={n.id} className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4 flex items-start gap-3 hover:border-amber-200 transition-all cursor-pointer">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                      n.type === 'warning' ? 'bg-rose-100 text-rose-600' : n.type === 'ai' ? 'bg-amber-100 text-amber-600' : n.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {n.type === 'warning' ? '⚠️' : n.type === 'ai' ? '🤖' : n.type === 'success' ? '✅' : '📋'}
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
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <div className="text-sm font-bold text-slate-800">Email Notifications</div>
                      <div className="text-xs text-slate-400 mt-0.5">Receive alerts for project updates and delays</div>
                    </div>
                    <div className="w-10 h-6 bg-amber-500 rounded-full p-0.5 cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full shadow-md transform translate-x-4"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <div className="text-sm font-bold text-slate-800">AI Recommendations</div>
                      <div className="text-xs text-slate-400 mt-0.5">Enable AI-powered project prioritization suggestions</div>
                    </div>
                    <div className="w-10 h-6 bg-amber-500 rounded-full p-0.5 cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full shadow-md transform translate-x-4"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <div className="text-sm font-bold text-slate-800">Risk Alerts</div>
                      <div className="text-xs text-slate-400 mt-0.5">Get notified when project risk scores change</div>
                    </div>
                    <div className="w-10 h-6 bg-amber-500 rounded-full p-0.5 cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full shadow-md transform translate-x-4"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-800">Dark Mode</div>
                      <div className="text-xs text-slate-400 mt-0.5">Toggle dark theme</div>
                    </div>
                    <div className="w-10 h-6 bg-slate-200 rounded-full p-0.5 cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
