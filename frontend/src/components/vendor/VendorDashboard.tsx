import React, { useState, useEffect } from 'react';
import {
  Briefcase, LayoutDashboard, FolderKanban, Target, UploadCloud,
  BarChart3, User, Bell, Settings, LogOut, Sun, ChevronDown,
  Award, Menu, X
} from 'lucide-react';

import DashboardTab from './pages/DashboardTab';
import ProjectsTab from './pages/ProjectsTab';
import MilestonesTab from './pages/MilestonesTab';
import EvidenceTab from './pages/EvidenceTab';
import PerformanceTab from './pages/PerformanceTab';
import ProfileTab from './pages/ProfileTab';
import NotificationsTab from './pages/NotificationsTab';
import SettingsTab from './pages/SettingsTab';
import LogoutModal from './pages/LogoutModal';

interface VendorDashboardProps {
  vendorId?: string;
  onLogout?: () => void;
}

export default function VendorDashboard({ vendorId: propVendorId, onLogout }: VendorDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Vendor state loaded from localStorage or backend
  const [vendorData, setVendorData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('smartgov_vendor_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      vendor_id: 'VND-4080',
      company_name: 'Apex Infra Ltd',
      contact_person: 'Rajesh Sharma',
      specialization: 'Infrastructure'
    };
  });

  const effectiveVendorId = propVendorId || vendorData.vendor_id || String(vendorData.id || 'VND-4080');

  // Real sidebar performance score and unread notification badge
  const [sidebarStats, setSidebarStats] = useState<{
    performance_score: number | null;
    unread_notifications: number;
  }>({
    performance_score: null,
    unread_notifications: 0
  });

  // Fetch quick metrics for sidebar badge and header info
  const fetchSidebarMeta = async () => {
    try {
      const [dashRes, notifRes] = await Promise.all([
        fetch(`/api/vendor/dashboard/${effectiveVendorId}`),
        fetch(`/api/vendor/notifications/${effectiveVendorId}`)
      ]);

      if (dashRes.ok) {
        const dJson = await dashRes.json();
        if (dJson.success) {
          if (dJson.vendor) {
            setVendorData(dJson.vendor);
            localStorage.setItem('smartgov_vendor_user', JSON.stringify(dJson.vendor));
          }
          setSidebarStats(prev => ({
            ...prev,
            performance_score: dJson.performance_score
          }));
        }
      }

      if (notifRes.ok) {
        const nJson = await notifRes.json();
        if (nJson.success) {
          setSidebarStats(prev => ({
            ...prev,
            unread_notifications: nJson.unread_count || 0
          }));
        }
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchSidebarMeta();
  }, [effectiveVendorId, activeTab]);

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem('smartgov_vendor_user');
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/vendor/login';
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'My Projects', icon: FolderKanban },
    { id: 'milestones', label: 'Milestone Updates', icon: Target },
    { id: 'evidence', label: 'Evidence Upload', icon: UploadCloud },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'profile', label: 'Vendor Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: sidebarStats.unread_notifications },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#faf9fe] font-sans text-slate-800">
      
      {/* SIDEBAR (Desktop) */}
      <aside className="w-64 bg-white border-r border-slate-100 hidden md:flex flex-col justify-between p-4 shrink-0 z-20 overflow-y-auto">
        <div className="space-y-6">
          {/* Logo */}
          <div
            className="flex items-center space-x-2.5 px-2 cursor-pointer"
            onClick={() => { setActiveTab('dashboard'); setSelectedProject(null); }}
          >
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-sm shadow-violet-200">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold tracking-tight text-slate-900">
              <span>SmartGov</span> <span className="text-violet-600 font-bold">Insight</span>
            </div>
          </div>

          {/* Badge */}
          <div className="mx-2 px-3 py-2 bg-violet-50 border border-violet-100 rounded-xl flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="text-[11px] font-bold text-violet-700 uppercase tracking-wider">Vendor Portal</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSelectedProject(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  activeTab === item.id
                    ? 'bg-violet-50 text-violet-700 font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-violet-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="bg-violet-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}

            <div className="border-t border-slate-100 pt-2 mt-2">
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setSelectedProject(null);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  activeTab === 'settings'
                    ? 'bg-violet-50 text-violet-700 font-bold'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-violet-600' : 'text-slate-400'}`} />
                <span>Settings</span>
              </button>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom Sidebar Widget */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="p-3 bg-violet-50/70 border border-violet-100 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center space-x-1.5 text-violet-700 font-bold text-[11px]">
              <Award className="w-3.5 h-3.5 text-violet-600" />
              <span>Performance Score</span>
            </div>
            <div className="text-xl font-extrabold text-violet-700">
              {sidebarStats.performance_score !== null ? `${sidebarStats.performance_score}%` : 'Not yet rated'}
            </div>
            <div className="w-full bg-violet-200/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-violet-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${sidebarStats.performance_score ?? 0}%` }}
              ></div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('settings')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <div className="flex items-center space-x-2">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light Mode</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* TOP HEADER */}
        <header className="px-6 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-violet-100/80 shadow-2xs transition-all">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {getGreetingTime()}, {vendorData.contact_person?.split(' ')[0] || 'Vendor'}! 🏗️
              </h1>
              <p className="text-slate-500 text-xs font-medium mt-0.5">
                {vendorData.company_name} • Vendor Portal
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="hidden sm:flex bg-violet-50 border border-violet-100/80 px-3.5 py-1.5 rounded-2xl items-center space-x-2 text-xs font-semibold text-violet-900">
              <Briefcase className="w-3.5 h-3.5 text-violet-600 shrink-0" />
              <span>{vendorData.specialization || 'Infrastructure'}</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setActiveTab('notifications')}
                className="w-9 h-9 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Bell className="w-4 h-4" />
              </button>
              {sidebarStats.unread_notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                  {sidebarStats.unread_notifications}
                </span>
              )}
            </div>

            <div
              onClick={() => setActiveTab('profile')}
              className="w-9 h-9 rounded-full ring-2 ring-violet-200 overflow-hidden shadow-2xs flex items-center justify-center bg-violet-700 text-white font-bold text-xs cursor-pointer hover:scale-105 transition-transform"
            >
              {vendorData.company_name?.[0] || 'V'}
            </div>
          </div>
        </header>

        {/* MOBILE MENU DROPDOWN */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-1 z-40">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSelectedProject(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${
                  activeTab === item.id ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              </button>
            ))}
            <button
              onClick={() => {
                setShowLogoutModal(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-rose-600 text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}

        {/* TAB CONTENT AREA */}
        <main className="px-6 sm:px-8 py-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardTab
              vendorId={effectiveVendorId}
              onNavigateTab={(tab) => {
                setActiveTab(tab);
                setSelectedProject(null);
              }}
              onSelectProject={(proj) => {
                setSelectedProject(proj);
                setActiveTab('projects');
              }}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsTab
              vendorId={effectiveVendorId}
              selectedProject={selectedProject}
              onSelectProject={(proj) => setSelectedProject(proj)}
              onClearSelectedProject={() => setSelectedProject(null)}
            />
          )}

          {activeTab === 'milestones' && (
            <MilestonesTab
              vendorId={effectiveVendorId}
              onNavigateToEvidence={() => setActiveTab('evidence')}
            />
          )}

          {activeTab === 'evidence' && (
            <EvidenceTab vendorId={effectiveVendorId} />
          )}

          {activeTab === 'performance' && (
            <PerformanceTab vendorId={effectiveVendorId} />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              vendorId={effectiveVendorId}
              onProfileUpdated={(updated) => {
                setVendorData(updated);
                localStorage.setItem('smartgov_vendor_user', JSON.stringify(updated));
              }}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab vendorId={effectiveVendorId} />
          )}

          {activeTab === 'settings' && (
            <SettingsTab vendorId={effectiveVendorId} />
          )}
        </main>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
