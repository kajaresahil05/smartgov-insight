import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, Users, Zap, FolderKanban, Activity,
  BarChart3, Flame, Bell, Settings, LogOut, Menu, X, Shield,
  ChevronRight, Building2, CheckCircle2, User, Sparkles, UserCheck
} from 'lucide-react';

import { GovernmentOverview } from './GovernmentOverview';
import { GovernmentComplaints } from './GovernmentComplaints';
import { GovernmentVendorAllocation } from './GovernmentVendorAllocation';
import { GovernmentVendors } from './GovernmentVendors';
import { GovernmentAIPrioritization } from './GovernmentAIPrioritization';
import { GovernmentProjects } from './GovernmentProjects';
import { GovernmentMonitoring } from './GovernmentMonitoring';
import { GovernmentAnalytics } from './GovernmentAnalytics';
import { GovernmentCitizenDemand } from './GovernmentCitizenDemand';
import { GovernmentNotifications } from './GovernmentNotifications';
import { GovernmentSettings } from './GovernmentSettings';

interface GovernmentDashboardProps {
  onLogout?: () => void;
}

export default function GovernmentDashboard({ onLogout }: GovernmentDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [totalComplaintsBadge, setTotalComplaintsBadge] = useState<number | null>(null);
  const [pendingAllocationsBadge, setPendingAllocationsBadge] = useState<number | null>(null);

  // Fetch summary counters for badges
  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const notifRes = await fetch('/api/government/notifications');
        const notifJson = await notifRes.json();
        if (notifJson.success) {
          setUnreadNotifications(notifJson.unread_count || 0);
        }

        const compRes = await fetch('/api/government/overview');
        const compJson = await compRes.json();
        if (compJson.success && compJson.kpis) {
          setTotalComplaintsBadge(compJson.kpis.total_complaints || 0);
        }

        const allocRes = await fetch('/api/government/allocations/overview');
        const allocJson = await allocRes.json();
        if (allocJson.success && allocJson.kpis) {
          setPendingAllocationsBadge(allocJson.kpis.pending_projects_count || null);
        }
      } catch (e) {
        // Silent fallback
      }
    };
    fetchCounters();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'complaints', label: 'Complaints', icon: FileText, badge: totalComplaintsBadge },
    { id: 'allocations', label: 'Vendor Allocation', icon: UserCheck, badge: pendingAllocationsBadge },
    { id: 'vendors', label: 'Vendors', icon: Users },
    { id: 'ai-prioritization', label: 'AI Prioritization', icon: Zap },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'citizen-demand', label: 'Citizen Demand', icon: Flame },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications > 0 ? unreadNotifications : null },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageTitle = () => {
    const item = navItems.find((n) => n.id === activeTab);
    if (item) return item.label;
    if (activeTab === 'settings') return 'Settings';
    return 'Government Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex font-sans antialiased">
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* LOGO BRAND */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-900/40 font-black">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-white text-sm tracking-tight flex items-center gap-1.5">
                <span>SmartGov</span>
                <span className="text-amber-400 font-black">Insight</span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Government Portal
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION ITEMS */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Municipal Admin Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-slate-900 text-amber-400'
                        : 'bg-slate-800 text-amber-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* BOTTOM UTILITY ACTIONS */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            onClick={() => handleTabChange('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 font-extrabold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => {
              if (onLogout) onLogout();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>

        {/* ADMIN USER PILL */}
        <div className="p-3 bg-slate-950/50 border-t border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs">
            PMC
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">PMC Administrator</div>
            <div className="text-[10px] text-slate-400 truncate">admin@smartgov.gov.in</div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium hidden sm:inline">Government Portal</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
              <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                {getPageTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Operational Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>PMC Live Telemetry</span>
            </div>

            {/* Notification Bell with Badge */}
            <button
              onClick={() => handleTabChange('notifications')}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Admin Avatar */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                AD
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-extrabold text-slate-900 leading-tight">Admin PMC</div>
                <div className="text-[10px] text-slate-400 font-medium">Urban Municipal Body</div>
              </div>
            </div>
          </div>
        </header>

        {/* ACTIVE PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <GovernmentOverview
              onNavigate={handleTabChange}
              onViewComplaint={() => handleTabChange('complaints')}
              onViewVendor={() => handleTabChange('vendors')}
            />
          )}

          {activeTab === 'complaints' && (
            <GovernmentComplaints onNavigateToAllocation={() => handleTabChange('allocations')} />
          )}

          {activeTab === 'allocations' && (
            <GovernmentVendorAllocation />
          )}

          {activeTab === 'vendors' && (
            <GovernmentVendors />
          )}

          {activeTab === 'ai-prioritization' && (
            <GovernmentAIPrioritization />
          )}

          {activeTab === 'projects' && (
            <GovernmentProjects />
          )}

          {activeTab === 'monitoring' && (
            <GovernmentMonitoring />
          )}

          {activeTab === 'analytics' && (
            <GovernmentAnalytics />
          )}

          {activeTab === 'citizen-demand' && (
            <GovernmentCitizenDemand />
          )}

          {activeTab === 'notifications' && (
            <GovernmentNotifications onNavigate={handleTabChange} />
          )}

          {activeTab === 'settings' && (
            <GovernmentSettings />
          )}
        </main>

        {/* FOOTER */}
        <footer className="py-4 px-6 border-t border-slate-200 text-center text-xs text-slate-400 bg-white">
          <p>© 2026 SmartGov Insight • Pune Municipal Corporation (PMC) Administration System</p>
        </footer>
      </div>
    </div>
  );
}
