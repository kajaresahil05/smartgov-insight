import React, { useState, useEffect } from 'react';
import { Landmark, LayoutDashboard, PlusCircle, FileText, MapPin, Bell, User, Settings as SettingsIcon, HelpCircle, LogOut, Sun, ChevronDown, Users, Bot } from 'lucide-react';
import SubmitComplaint from './SubmitComplaint.jsx';
import MyComplaints from './MyComplaints.jsx';
import ComplaintDetails from './ComplaintDetails.jsx';
import ProjectsNearMe from './ProjectsNearMe.jsx';
import ProjectDetails from './ProjectDetails.jsx';
import CommunityIssues from './CommunityIssues.jsx';
import HelpSupport from './HelpSupport.jsx';
import SmartGovChatbot from './SmartGovChatbot.jsx';
import MyProfile from './MyProfile.jsx';
import Settings from './Settings.jsx';
import Notifications from './Notifications.jsx';

export default function Dashboard({ userId, onLogout }) {
  const [data, setData] = useState({
    user: { full_name: 'Raj Sanjay Kadam', location: 'Kothrud, Pune, Maharashtra 411038' },
    stats: { total_complaints: 0, under_review: 0, resolved: 0, total_projects: 0 },
    complaints: [],
    projects: [],
    notifications: []
  });

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'submit-complaint' | 'my-complaints' | 'complaint-detail' | 'projects-near-me' | 'project-detail' | 'community-issues' | 'help' | 'chatbot' | 'profile' | 'settings' | 'notifications'
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, [userId]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/dashboard/${userId || 1}`);
      const json = await res.json();
      if (json.success && json.user) {
        setData((prev) => ({
          ...prev,
          user: json.user,
          stats: json.stats || { total_complaints: 0, under_review: 0, resolved: 0, total_projects: 0 },
          complaints: json.complaints || [],
          projects: json.projects || [],
          notifications: json.notifications || []
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userFirstName = data.user && data.user.full_name ? data.user.full_name.split(' ')[0] : 'Citizen';

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f9fe] font-sans text-slate-800">
      
      {/* LEFT SIDEBAR MATCHING REFERENCE SCREENSHOT */}
      <aside className="w-60 bg-white border-r border-slate-100 hidden md:flex flex-col justify-between p-4 shrink-0 z-20 overflow-y-auto">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center space-x-2.5 px-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <Landmark className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold tracking-tight text-slate-900">
              <span>SmartGov</span> <span className="text-emerald-600 font-bold">Insight</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-0.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#eefdf5] text-emerald-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('submit-complaint')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'submit-complaint'
                  ? 'bg-[#eefdf5] text-emerald-700 font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <PlusCircle className={`w-4 h-4 ${activeTab === 'submit-complaint' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Submit Complaint</span>
            </button>

            <button
              onClick={() => setActiveTab('my-complaints')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'my-complaints' || activeTab === 'complaint-detail'
                  ? 'bg-[#eefdf5] text-emerald-700 font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FileText className={`w-4 h-4 ${activeTab === 'my-complaints' || activeTab === 'complaint-detail' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>My Complaints</span>
            </button>

            <button
              onClick={() => setActiveTab('projects-near-me')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'projects-near-me' || activeTab === 'project-detail'
                  ? 'bg-[#eefdf5] text-emerald-700 font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <MapPin className={`w-4 h-4 ${activeTab === 'projects-near-me' || activeTab === 'project-detail' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Projects Near Me</span>
            </button>

            {/* Community Issues Menu Item */}
            <button
              onClick={() => setActiveTab('community-issues')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'community-issues'
                  ? 'bg-[#eefdf5] text-emerald-700 font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'community-issues' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Community Issues</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'notifications'
                  ? 'bg-[#eefdf5] text-emerald-700 font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Notifications</span>
              </div>
              <span className="bg-emerald-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                {data.notifications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#eefdf5] text-emerald-700 font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>My Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#eefdf5] text-emerald-700 font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <SettingsIcon className={`w-4 h-4 ${activeTab === 'settings' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Settings</span>
            </button>

            {/* Help & Support */}
            <button
              onClick={() => setActiveTab('help')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                activeTab === 'help' || activeTab === 'chatbot'
                  ? 'bg-[#eefdf5] text-emerald-700 font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <HelpCircle className={`w-4 h-4 ${activeTab === 'help' || activeTab === 'chatbot' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Help & Support</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all pt-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </nav>
        </div>

        {/* Bottom Area Box matching reference image */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="p-3 bg-[#eff6ff]/70 border border-blue-100 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center space-x-1.5 text-blue-700 font-bold text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Your Area</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-700 leading-snug truncate">
              {data.user.location || 'Kothrud, Pune Maharashtra 411038'}
            </div>
            <button
              onClick={() => setActiveTab('submit-complaint')}
              className="w-full py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 font-bold rounded-xl text-[10px] shadow-2xs transition-colors mt-1"
            >
              Change Location
            </button>
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

      {/* MAIN BODY CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* TOP NAVBAR HEADER */}
        <header className="px-8 py-4 flex items-center justify-between sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100/80 shadow-xs transition-all">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {getGreetingTime()}, {userFirstName}! 👋
            </h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Let's make your community better.</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Location Pill */}
            <div className="bg-[#f5f3ff] border border-purple-100/80 px-3.5 py-1.5 rounded-2xl flex items-center space-x-2 text-xs font-semibold text-purple-900 max-w-xs truncate">
              <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">{data.user.location || 'Kothrud, Pune'}</span>
            </div>

            {/* Notification Bell Badge */}
            <div className="relative">
              <button onClick={() => setActiveTab('notifications')} className="w-9 h-9 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600 hover:bg-slate-50">
                <Bell className="w-4 h-4" />
              </button>
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {data.notifications.length}
              </span>
            </div>

            {/* Profile Avatar */}
            <div onClick={() => setActiveTab('profile')} className="w-9 h-9 rounded-full ring-2 ring-slate-200 overflow-hidden shadow-2xs flex items-center justify-center bg-slate-900 text-white font-bold text-xs cursor-pointer">
              {data.user.full_name ? data.user.full_name[0] : 'C'}
            </div>
          </div>
        </header>

        {/* DYNAMIC VIEW ROUTER */}
        <main className="px-8 pb-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* SUBMIT COMPLAINT WIZARD */}
          {activeTab === 'submit-complaint' && (
            <SubmitComplaint
              userId={userId}
              onNavigateBack={() => setActiveTab('my-complaints')}
              onSubmitSuccess={(newComplaint) => {
                fetchDashboard();
                if (newComplaint && newComplaint.id) {
                  setSelectedComplaintId(newComplaint.id);
                  setActiveTab('complaint-detail');
                } else {
                  setActiveTab('my-complaints');
                }
              }}
            />
          )}

          {/* MY COMPLAINTS LIST */}
          {activeTab === 'my-complaints' && (
            <MyComplaints
              userId={userId}
              onSelectComplaint={(id) => {
                setSelectedComplaintId(id);
                setActiveTab('complaint-detail');
              }}
            />
          )}

          {/* COMPLAINT DETAILS & TIMELINE TRACKING */}
          {activeTab === 'complaint-detail' && (
            <ComplaintDetails
              complaintId={selectedComplaintId}
              onNavigateBack={() => setActiveTab('my-complaints')}
            />
          )}

          {/* PROJECTS NEAR ME */}
          {activeTab === 'projects-near-me' && (
            <ProjectsNearMe
              userLocation={data.user.location}
              onSelectProject={(id) => {
                setSelectedProjectId(id);
                setActiveTab('project-detail');
              }}
            />
          )}

          {/* PROJECT DETAILS & MILESTONES */}
          {activeTab === 'project-detail' && (
            <ProjectDetails
              projectId={selectedProjectId}
              onNavigateBack={() => setActiveTab('projects-near-me')}
            />
          )}

          {/* COMMUNITY ISSUES PAGE */}
          {activeTab === 'community-issues' && (
            <CommunityIssues
              userLocation={data.user.location}
              onReportIssue={() => setActiveTab('submit-complaint')}
            />
          )}

          {/* NOTIFICATIONS FEED PAGE */}
          {activeTab === 'notifications' && (
            <Notifications
              userId={userId}
              onSelectComplaint={(id) => {
                setSelectedComplaintId(id);
                setActiveTab('complaint-detail');
              }}
            />
          )}

          {/* MY PROFILE PAGE */}
          {activeTab === 'profile' && (
            <MyProfile
              userId={userId}
              user={data.user}
              onUpdateProfile={(updatedUser) => {
                setData((prev) => ({ ...prev, user: updatedUser }));
              }}
            />
          )}

          {/* SETTINGS PAGE */}
          {activeTab === 'settings' && (
            <Settings
              onLogout={onLogout}
            />
          )}

          {/* HELP & SUPPORT PAGE */}
          {activeTab === 'help' && (
            <HelpSupport
              onNavigateBack={() => setActiveTab('dashboard')}
              onOpenChatbot={() => setActiveTab('chatbot')}
              onNavigateTopic={(tabName) => setActiveTab(tabName)}
            />
          )}

          {/* SMARTGOV AI ASSISTANT CHATBOT */}
          {activeTab === 'chatbot' && (
            <SmartGovChatbot
              userId={userId}
              onNavigateBack={() => setActiveTab('help')}
              onNavigateTab={(tabName) => setActiveTab(tabName)}
            />
          )}

          {/* DEFAULT MAIN DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <>
              {/* BANNER CARD */}
              <div className="bg-gradient-to-r from-[#dbeafe] via-[#e0e7ff] to-[#edd8ff] rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between shadow-2xs relative overflow-hidden">
                <div className="space-y-2.5 z-10 max-w-md">
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Voice Matters!</h2>
                  <p className="text-slate-600 text-xs font-medium leading-relaxed">
                    Report issues, track progress and see the change in your area.
                  </p>
                  <button
                    onClick={() => setActiveTab('submit-complaint')}
                    className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4.5 py-2.5 rounded-xl text-xs shadow-md transition-all"
                  >
                    Submit New Complaint
                  </button>
                </div>

                {/* Vector Citizens SVG Graphic */}
                <div className="mt-4 md:mt-0 relative z-10 hidden sm:flex items-end space-x-2">
                  <svg width="220" height="110" viewBox="0 0 220 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 110V50H30V35H55V60H80V25H110V55H135V40H165V70H195V110H10Z" fill="#c7d2fe" fillOpacity="0.4" />
                    <path d="M25 110V60H45V45H70V70H95V35H125V65H150V50H180V110H25Z" fill="#a5b4fc" fillOpacity="0.3" />
                    
                    <circle cx="55" cy="40" r="8" fill="#1e3a8a" />
                    <path d="M45 52C45 46 65 46 65 52V85H45V52Z" fill="#2563eb" />
                    <path d="M48 85H53V105H48V85Z" fill="#1e293b" />
                    <path d="M57 85H62V105H57V85Z" fill="#1e293b" />

                    <circle cx="110" cy="35" r="9" fill="#0f766e" />
                    <path d="M98 48C98 42 122 42 122 48V82H98V48Z" fill="#0d9488" />
                    <path d="M102 82H108V108H102V82Z" fill="#1e293b" />
                    <path d="M112 82H118V108H112V82Z" fill="#1e293b" />

                    <circle cx="165" cy="40" r="8" fill="#92400e" />
                    <path d="M155 52C155 46 175 46 175 52V85H155V52Z" fill="#d97706" />
                    <path d="M158 85H163V105H158V85Z" fill="#1e293b" />
                    <path d="M167 85H172V105H167V85Z" fill="#1e293b" />
                  </svg>
                </div>
              </div>

              {/* 4 STAT CARDS GRID */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Card 1: Total Complaints */}
                <div onClick={() => setActiveTab('my-complaints')} className="bg-[#eefdf5] border border-emerald-100/70 p-5 rounded-2xl shadow-2xs cursor-pointer hover:border-emerald-300 transition-all">
                  <div className="text-3xl font-extrabold text-emerald-600">
                    {data.stats.total_complaints}
                  </div>
                  <div className="text-xs font-bold text-emerald-800 mt-2">
                    Total Complaints
                  </div>
                </div>

                {/* Card 2: Under Review */}
                <div onClick={() => setActiveTab('my-complaints')} className="bg-[#fffbeb] border border-amber-100/70 p-5 rounded-2xl shadow-2xs cursor-pointer hover:border-amber-300 transition-all">
                  <div className="text-3xl font-extrabold text-amber-500">
                    {data.stats.under_review}
                  </div>
                  <div className="text-xs font-bold text-amber-800 mt-2">
                    Under Review
                  </div>
                </div>

                {/* Card 3: Resolved */}
                <div onClick={() => setActiveTab('my-complaints')} className="bg-[#eff6ff] border border-blue-100/70 p-5 rounded-2xl shadow-2xs cursor-pointer hover:border-blue-300 transition-all">
                  <div className="text-3xl font-extrabold text-blue-600">
                    {data.stats.resolved}
                  </div>
                  <div className="text-xs font-bold text-blue-800 mt-2">
                    Resolved
                  </div>
                </div>

                {/* Card 4: Projects in Area */}
                <div onClick={() => setActiveTab('projects-near-me')} className="bg-[#f5f3ff] border border-purple-100/70 p-5 rounded-2xl shadow-2xs cursor-pointer hover:border-purple-300 transition-all">
                  <div className="text-3xl font-extrabold text-purple-600">
                    {data.stats.total_projects}
                  </div>
                  <div className="text-xs font-bold text-purple-800 mt-2">
                    Projects in Area
                  </div>
                </div>

              </div>

              {/* BOTTOM GRID (2 COLUMNS) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* COLUMN 1: RECENT NOTIFICATIONS */}
                <div className="lg:col-span-6 bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900">Recent Notifications</h3>
                    <button onClick={() => setActiveTab('notifications')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
                  </div>

                  {data.notifications.length > 0 ? (
                    <div className="space-y-3">
                      {data.notifications.map((item) => (
                        <div key={item.id} onClick={() => setActiveTab('notifications')} className="flex items-start space-x-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="w-8 h-8 rounded-xl bg-[#eefdf5] text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                            📄
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 leading-snug">{item.text}</div>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5">{item.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs font-medium text-slate-400">
                      No notifications yet.
                    </div>
                  )}
                </div>

                {/* COLUMN 2: PROJECTS NEAR YOU */}
                <div className="lg:col-span-6 bg-white rounded-3xl p-5 border border-slate-100 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900">Projects Near You</h3>
                    <button onClick={() => setActiveTab('projects-near-me')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
                  </div>

                  {data.projects.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {data.projects.map((proj) => (
                        <div
                          key={proj.id}
                          onClick={() => {
                            setSelectedProjectId(proj.id);
                            setActiveTab('project-detail');
                          }}
                          className="bg-slate-50/70 rounded-2xl p-2 border border-slate-100 flex flex-col justify-between hover:border-emerald-500 transition-all cursor-pointer"
                        >
                          <div>
                            <div className="h-16 w-full rounded-xl overflow-hidden mb-2 bg-slate-200">
                              <img
                                src={proj.image}
                                alt={proj.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-xs font-bold text-slate-900 truncate">{proj.title}</div>
                            <div className="text-[10px] text-slate-500 font-medium truncate">{proj.location}</div>
                          </div>

                          <div className="mt-2.5">
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-1">
                              <div
                                className="bg-emerald-600 h-full rounded-full"
                                style={{ width: `${proj.progress}%` }}
                              ></div>
                            </div>
                            <div className="text-[10px] text-right font-extrabold text-slate-700">{proj.progress}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-1">
                      <div className="text-xs font-bold text-slate-800">No government projects available yet.</div>
                      <div className="text-[11px] text-slate-400 font-medium">Projects will appear here once published by local authorities.</div>
                    </div>
                  )}
                </div>

              </div>
            </>
          )}

        </main>
      </div>

    </div>
  );
}
