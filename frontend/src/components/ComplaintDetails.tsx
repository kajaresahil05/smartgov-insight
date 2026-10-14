import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Flag, Calendar, CheckCircle2, Clock, Circle, Compass } from 'lucide-react';
import { LocationMapPicker } from './common/LocationMapPicker';

export default function ComplaintDetails({ complaintId, onNavigateBack }) {
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

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

  const hasCoords = complaint.latitude != null && complaint.longitude != null;

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
          <span>{complaint.created_at || 'Recently'}</span>
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="text-xs font-bold text-slate-900 mb-1">Description</div>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {complaint.description || 'No description provided.'}
        </p>
      </div>

      {/* Location Section */}
      <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-150 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-slate-800 font-bold">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Problem Location</span>
          </div>
          {hasCoords && (
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="text-emerald-700 hover:text-emerald-900 font-extrabold text-[11px] underline"
            >
              {showMap ? 'Hide Map' : 'View on Leaflet Map'}
            </button>
          )}
        </div>

        <p className="text-xs text-slate-700 font-semibold">{complaint.location}</p>

        {hasCoords && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
              {Number(complaint.latitude).toFixed(5)}°N, {Number(complaint.longitude).toFixed(5)}°E
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
              Source: {complaint.location_source === 'gps' ? 'Device GPS' : 'Map Pinpoint'}
            </span>
            {complaint.location_accuracy != null && (
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                Accuracy: ±{Math.round(complaint.location_accuracy)}m
              </span>
            )}
          </div>
        )}

        {/* Embedded Leaflet Map */}
        {showMap && hasCoords && (
          <div className="pt-2">
            <LocationMapPicker
              latitude={Number(complaint.latitude)}
              longitude={Number(complaint.longitude)}
              accuracy={complaint.location_accuracy}
              locationSource={complaint.location_source || 'map_picker'}
              interactive={false}
              height="200px"
              showSearchBar={false}
            />
          </div>
        )}
      </div>

      {/* Images Grid */}
      {complaint.images && complaint.images.length > 0 && (
        <div>
          <div className="text-xs font-bold text-slate-900 mb-2">Evidence Images</div>
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
            <div className="text-[11px] text-slate-400 font-medium">Received by Portal</div>
          </div>

          {/* Step 2: Under Review */}
          <div className="relative">
            <div className="absolute -left-[23px] top-0.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] ring-4 ring-blue-100">
              ●
            </div>
            <div className="text-xs font-extrabold text-blue-700">Under Review</div>
            <div className="text-[11px] text-slate-400 font-medium">Assigned to Local Ward Officer</div>

            <div className="mt-2 p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-[11px] font-medium text-blue-900 max-w-xs shadow-2xs">
              Your complaint is being reviewed by the concerned municipal department.
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
