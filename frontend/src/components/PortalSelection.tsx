import React, { useState } from 'react';
import { Landmark, Users, Building2, Briefcase, ArrowRight, ShieldCheck, Globe, ChevronRight } from 'lucide-react';

export default function PortalSelection({ onSelectPortal }) {
  const [hoveredPortal, setHoveredPortal] = useState(null);

  const portals = [
    {
      id: 'citizen',
      title: 'Citizen Portal',
      subtitle: 'For Citizens & Residents',
      description: 'Submit complaints, track projects, and stay informed about government initiatives in your area.',
      icon: Users,
      gradient: 'from-emerald-600 to-teal-500',
      bgGlow: 'bg-emerald-500/10',
      borderHover: 'hover:border-emerald-300',
      features: ['Submit Complaints', 'Track Projects', 'Community Issues', 'Notifications & Alerts'],
      color: 'emerald'
    },
    {
      id: 'government',
      title: 'Government Portal',
      subtitle: 'For Government Authorities',
      description: 'Manage projects, AI-powered prioritization, vendor management, monitoring, and analytics.',
      icon: Building2,
      gradient: 'from-amber-600 to-yellow-500',
      bgGlow: 'bg-amber-500/10',
      borderHover: 'hover:border-amber-300',
      features: ['Project Management', 'AI Prioritization', 'Vendor Management', 'Analytics & Reports'],
      color: 'amber'
    },
    {
      id: 'vendor',
      title: 'Vendor Portal',
      subtitle: 'For Registered Vendors',
      description: 'View project assignments, submit milestone updates, upload evidence, and track performance.',
      icon: Briefcase,
      gradient: 'from-violet-600 to-purple-500',
      bgGlow: 'bg-violet-500/10',
      borderHover: 'hover:border-violet-300',
      features: ['Project Assignments', 'Milestone Updates', 'Evidence Upload', 'Performance Tracking'],
      color: 'violet'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-100/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 py-6 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-slate-900">
                <span>SmartGov</span> <span className="text-emerald-600">Insight</span>
              </div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">AI-Powered Governance Platform</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-x-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 transition-all">
              <Globe className="w-4 h-4 text-slate-500" />
              <span>English</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-8 py-6">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Secure & Transparent Governance</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            Choose Your <span className="bg-gradient-to-r from-emerald-600 via-amber-500 to-violet-600 bg-clip-text text-transparent">Portal</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            SmartGov Insight connects Citizens, Government Authorities, and Vendors for efficient project planning, prioritization, and transparency.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {portals.map((portal) => (
            <div
              key={portal.id}
              onClick={() => onSelectPortal(portal.id)}
              onMouseEnter={() => setHoveredPortal(portal.id)}
              onMouseLeave={() => setHoveredPortal(null)}
              className={`relative bg-white rounded-3xl border-2 border-slate-100 ${portal.borderHover} shadow-lg hover:shadow-xl p-7 cursor-pointer transition-all duration-300 group ${
                hoveredPortal === portal.id ? 'scale-[1.02] -translate-y-1' : ''
              }`}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${portal.gradient} flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <portal.icon className="w-7 h-7 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">{portal.title}</h3>
              <p className={`text-xs font-bold text-${portal.color}-600 uppercase tracking-wider mb-3`}>{portal.subtitle}</p>
              <p className="text-xs text-slate-500 leading-relaxed mb-5">{portal.description}</p>

              {/* Features */}
              <div className="space-y-2 mb-6">
                {portal.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <div className={`w-1.5 h-1.5 rounded-full bg-${portal.color}-500`}></div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className={`flex items-center justify-between p-3 rounded-2xl bg-${portal.color}-50/50 border border-${portal.color}-100/50 group-hover:bg-${portal.color}-50 transition-colors`}>
                <span className={`text-xs font-bold text-${portal.color}-700`}>
                  {portal.id === 'government' ? 'Login to Portal' : 'Get Started'}
                </span>
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${portal.gradient} flex items-center justify-center group-hover:translate-x-1 transition-transform`}>
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-8 text-center">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] text-slate-400 font-medium">
            © 2026 SmartGov Insight • A.P. Shah Institute of Technology • Department of Information Technology
          </p>
          <p className="text-[10px] text-slate-300 font-medium mt-1">
            Smart Decisions. Transparent Governance. Better Future.
          </p>
        </div>
      </footer>
    </div>
  );
}
