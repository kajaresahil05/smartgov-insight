import React, { useState, useEffect } from 'react';
import { MapPin, Users, FileText, Bell, Sparkles } from 'lucide-react';

export default function CommunityIssues({ userLocation, onReportIssue }) {
  const [stats, setStats] = useState({
    total_issues: 0,
    citizens_involved: 0,
    categories: 0,
    this_month: 0
  });
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const locationName = userLocation || 'Kothrud, Pune';

  useEffect(() => {
    fetchCommunityIssues();
  }, [userLocation]);

  const fetchCommunityIssues = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community-issues?location=${encodeURIComponent(locationName)}`);
      const json = await res.json();
      if (json.success) {
        setStats(json.stats || { total_issues: 0, citizens_involved: 0, categories: 0, this_month: 0 });
        setIssues(json.issues || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xs max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Community Issues</h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">See what issues are being reported in your area.</p>
        </div>
        <div className="bg-[#f5f3ff] border border-purple-100 px-3.5 py-1.5 rounded-2xl flex items-center space-x-1.5 text-xs font-semibold text-purple-900">
          <MapPin className="w-3.5 h-3.5 text-purple-600" />
          <span>{locationName}</span>
        </div>
      </div>

      {/* Overview Cards (4 Stat Grid) */}
      <div>
        <div className="text-xs font-extrabold text-slate-900 mb-3">Overview</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Card 1: Total Issues */}
          <div className="bg-[#eefdf5] border border-emerald-100/70 p-4 rounded-2xl">
            <div className="text-2xl font-extrabold text-emerald-600">{stats.total_issues}</div>
            <div className="text-[11px] font-bold text-emerald-900 mt-1">Total Issues Reported</div>
          </div>

          {/* Card 2: Citizens Involved */}
          <div className="bg-[#fffbeb] border border-amber-100/70 p-4 rounded-2xl">
            <div className="text-xl text-amber-600">👥</div>
            <div className="text-[11px] font-bold text-amber-900 mt-1">Citizens Involved</div>
          </div>

          {/* Card 3: Categories */}
          <div className="bg-[#eff6ff] border border-blue-100/70 p-4 rounded-2xl">
            <div className="text-2xl font-extrabold text-blue-600">{stats.categories}</div>
            <div className="text-[11px] font-bold text-blue-900 mt-1">Categories</div>
          </div>

          {/* Card 4: This Month */}
          <div className="bg-[#f5f3ff] border border-purple-100/70 p-4 rounded-2xl">
            <div className="text-xl text-purple-600">🔔</div>
            <div className="text-[11px] font-bold text-purple-900 mt-1">This Month</div>
          </div>

        </div>
      </div>

      {/* Issues by Category Box */}
      <div className="bg-slate-50/70 rounded-3xl p-6 border border-slate-100 text-center space-y-4">
        <div className="text-xs font-extrabold text-slate-900 text-left">Issues by Category</div>
        
        {/* Park Graphic Illustration */}
        <div className="py-2">
          <svg className="w-36 h-20 mx-auto" viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="80" cy="40" r="35" fill="#d1fae5" fillOpacity="0.5" />
            <path d="M40 65C55 45 105 45 120 65H40Z" fill="#10b981" fillOpacity="0.3" />
            <rect x="75" y="45" width="10" height="20" fill="#047857" />
            <circle cx="80" cy="35" r="18" fill="#34d399" />
          </svg>
        </div>

        <div>
          <h3 className="text-sm font-extrabold text-slate-900">
            {issues.length > 0 ? `${issues.length} Community Issues Reported` : `No issues reported yet in your area.`}
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1 leading-relaxed">
            Be the first to report an issue and help improve your community.
          </p>
        </div>

        <button
          type="button"
          onClick={onReportIssue}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all inline-block"
        >
          Report an Issue
        </button>
      </div>

      {/* Recent Issues in Your Area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900">Recent Issues in Your Area</h3>
          <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
        </div>

        {issues.length > 0 ? (
          <div className="space-y-2">
            {issues.map((item) => (
              <div key={item.id} className="p-3.5 rounded-2xl border border-slate-100 bg-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                    🏛️
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{item.title}</div>
                    <div className="text-[11px] text-slate-400">{item.ticket_number} • {item.category}</div>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-lg">
              📄
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">No issues reported yet.</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Issues reported by you and others in your area will appear here.</div>
            </div>
          </div>
        )}
      </div>

      {/* Why it matters? Banner */}
      <div className="bg-[#eefdf5] border border-emerald-100 p-4 sm:p-5 rounded-3xl flex items-center justify-between">
        <div className="space-y-1 max-w-sm">
          <div className="text-xs font-extrabold text-emerald-800">Why it matters?</div>
          <p className="text-[11px] font-medium text-emerald-700 leading-relaxed">
            When more citizens report an issue, it helps local authorities understand the problem better and take faster action.
          </p>
        </div>
        <div className="text-2xl hidden sm:block">
          👥👥
        </div>
      </div>

    </div>
  );
}
