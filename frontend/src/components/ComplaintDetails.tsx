import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Flag, Calendar, CheckCircle2, Clock, Circle } from 'lucide-react';

export default function ComplaintDetails({ complaintId, onNavigateBack }) {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaintDetail();
  }, [complaintId]);

  const fetchComplaintDetail = async () => {
    try {
      const res = await fetch(`/api/complaints/${complaintId || 1}`);
      const json = await res.json();
      if (json.success && json.complaint) {
        setComplaint(json.complaint);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !complaint) {
    return <div className="p-8 text-center text-xs font-bold text-slate-400">Loading complaint details...</div>;
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs max-w-xl mx-auto space-y-5">
      
      {/* Header Bar */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={onNavigateBack} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{complaint.title}</h2>
            <div className="text-xs font-mono font-bold text-slate-400 mt-0.5">{complaint.ticket_number}</div>
          </div>
        </div>

        <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-extrabold px-3 py-1 rounded-full">
          {complaint.status}
        </span>
      </div>

      {/* Metadata Badges */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-1">
          <span>🏛️</span>
          <span>{complaint.category}</span>
        </div>
        <span>•</span>
        <div className="flex items-center space-x-1 text-rose-600">
          <Flag className="w-3.5 h-3.5 fill-rose-600" />
          <span>{complaint.urgency || 'High'}</span>
        </div>
        <span>•</span>
        <div className="flex items-center space-x-1 text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{complaint.created_at || '25 May 2024, 10:30 AM'}</span>
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="text-xs font-bold text-slate-900 mb-1">Description</div>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {complaint.description || 'There are large potholes on the main road causing problems for vehicles and accidents during rains.'}
        </p>
      </div>

      {/* Location */}
      <div>
        <div className="text-xs font-bold text-slate-900 mb-1">Location</div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{complaint.location}</span>
          </div>
          <button className="text-blue-600 font-bold hover:underline text-[11px]">View on Map</button>
        </div>
      </div>

      {/* Images Grid */}
      {complaint.images && complaint.images.length > 0 && (
        <div>
          <div className="text-xs font-bold text-slate-900 mb-2">Images</div>
          <div className="grid grid-cols-3 gap-2">
            {complaint.images.slice(0, 3).map((img, idx) => (
              <div key={idx} className="h-20 rounded-xl overflow-hidden bg-slate-100 relative border border-slate-200">
                <img src={img} alt={`Complaint ${idx}`} className="w-full h-full object-cover" />
                {idx === 2 && complaint.images.length > 3 && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white font-extrabold text-sm">
                    +{complaint.images.length - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vertical Tracking Status Timeline */}
      <div className="pt-2">
        <div className="text-xs font-extrabold text-slate-900 mb-4">Tracking Status</div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          
          {/* Step 1: Submitted */}
          <div className="relative">
            <div className="absolute -left-[23px] top-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
              ✓
            </div>
            <div className="text-xs font-extrabold text-slate-900">Submitted</div>
            <div className="text-[11px] text-slate-400 font-medium">25 May 2024, 10:30 AM</div>
          </div>

          {/* Step 2: Under Review */}
          <div className="relative">
            <div className="absolute -left-[23px] top-0.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] ring-4 ring-blue-100">
              ●
            </div>
            <div className="text-xs font-extrabold text-blue-700">Under Review</div>
            <div className="text-[11px] text-slate-400 font-medium">25 May 2024, 02:15 PM</div>

            {/* Popup Tooltip Card matching reference image */}
            <div className="mt-2 p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-[11px] font-medium text-blue-900 max-w-xs shadow-2xs">
              Your complaint is being reviewed by the concerned department.
            </div>
          </div>

          {/* Pending Steps */}
          {['Demand Aggregated', 'Project Proposed', 'Project Approved', 'Project Completed'].map((stepTitle, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[23px] top-0.5 w-4 h-4 rounded-full bg-slate-200 border-2 border-white text-slate-400 flex items-center justify-center text-[8px]">
                ○
              </div>
              <div className="text-xs font-semibold text-slate-400">{stepTitle}</div>
              <div className="text-[11px] text-slate-300">Pending</div>
            </div>
          ))}

        </div>
      </div>

    </div>
  );
}
