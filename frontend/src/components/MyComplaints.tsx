import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, AlertCircle, Building2, Wrench, Droplets, Lightbulb } from 'lucide-react';

export default function MyComplaints({ userId, onSelectComplaint }) {
  const [complaints, setComplaints] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, [userId, activeFilter, searchQuery]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      let url = `/api/complaints?user_id=${userId || 1}`;
      if (activeFilter !== 'All') url += `&status=${encodeURIComponent(activeFilter)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setComplaints(json.complaints || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Under Review':
        return <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">Under Review</span>;
      case 'In Progress':
        return <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">In Progress</span>;
      case 'Resolved':
        return <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">Resolved</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Road': return '🏛️';
      case 'Garbage': return '🏢';
      case 'Streetlight': return '💡';
      case 'Water': return '🏢';
      default: return '📍';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs max-w-xl mx-auto space-y-5">
      
      {/* Title */}
      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">My Complaints</h2>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search complaints..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {['All', 'Under Review', 'In Progress', 'Resolved'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 ${
              activeFilter === filter
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Complaint Cards List */}
      <div className="space-y-3 pt-1">
        {loading ? (
          <div className="text-center py-8 text-xs font-bold text-slate-400">Loading complaints from database...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-8 text-xs font-semibold text-slate-400">No complaints found.</div>
        ) : (
          complaints.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectComplaint(item.id)}
              className="p-4 rounded-2xl border border-slate-150 hover:border-emerald-500 hover:shadow-xs transition-all bg-white cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg shrink-0 mt-0.5 border border-purple-100">
                  {getCategoryIcon(item.category)}
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900 leading-snug">{item.title}</div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-0.5">{item.ticket_number}</div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-medium mt-1">
                    <span>{item.category}</span>
                    <span>•</span>
                    <span>{item.created_at || '25 May 2024'}</span>
                  </div>
                </div>
              </div>

              <div>
                {getStatusBadge(item.status)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center space-x-4 pt-2 text-xs font-bold text-slate-600">
        <button className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg">1</span>
        <span className="px-2">2</span>
        <button className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
      </div>

    </div>
  );
}
