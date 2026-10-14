import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2, ArrowUpDown } from 'lucide-react';
import L from 'leaflet';
import { requestDeviceLocation, reverseGeocodeCoordinates } from '../services/locationService';

// Issue Pin Color based on Status
const createIssueMarkerIcon = (status: string) => {
  let color = '#d97706'; // Under Review (amber)
  if (status === 'In Progress') color = '#2563eb'; // blue
  if (status === 'Resolved') color = '#059669'; // emerald

  return L.divIcon({
    className: 'custom-issue-pin',
    html: `
      <div style="position: relative; width: 30px; height: 38px; display: flex; align-items: center; justify-content: center;">
        <svg width="28" height="36" viewBox="0 0 384 512" fill="${color}" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.3));">
          <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/>
        </svg>
      </div>
    `,
    iconSize: [30, 38],
    iconAnchor: [15, 34],
    popupAnchor: [0, -32]
  });
};

const createUserMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-user-pin',
    html: `
      <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 26px; height: 26px; background: rgba(37, 99, 235, 0.25); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 14px; height: 14px; background: #2563eb; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13]
  });
};

interface CommunityIssuesProps {
  userLocation?: string;
  userCoords?: { latitude: number; longitude: number };
  onReportIssue?: () => void;
}

export default function CommunityIssues({
  userLocation,
  userCoords,
  onReportIssue
}: CommunityIssuesProps) {
  const [currentLat, setCurrentLat] = useState<number>(userCoords?.latitude || 18.5074);
  const [currentLon, setCurrentLon] = useState<number>(userCoords?.longitude || 73.8077);
  const [addressLabel, setAddressLabel] = useState<string>(userLocation || 'Kothrud, Pune');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationSource, setLocationSource] = useState<'gps' | 'saved' | 'default'>('saved');

  const [stats, setStats] = useState({
    total_issues: 0,
    citizens_involved: 0,
    categories: 0,
    this_month: 0
  });
  const [issues, setIssues] = useState<any[]>([]);
  const [radiusKm, setRadiusKm] = useState<number>(20);
  const [loading, setLoading] = useState(true);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Fetch Nearby Community Issues
  const fetchNearbyIssues = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/location/community-issues/nearby?lat=${currentLat}&lon=${currentLon}&radius_km=${radiusKm}`
      );
      const json = await res.json();
      if (json.success) {
        setStats(json.stats || { total_issues: 0, citizens_involved: 0, categories: 0, this_month: 0 });
        setIssues(json.issues || []);
      }
    } catch (e) {
      console.error('Error fetching nearby community issues:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyIssues();
  }, [currentLat, currentLon, radiusKm]);

  // Request GPS
  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const geo = await requestDeviceLocation();
      setCurrentLat(geo.coords.latitude);
      setCurrentLon(geo.coords.longitude);
      setLocationSource('gps');

      const geocode = await reverseGeocodeCoordinates(geo.coords.latitude, geo.coords.longitude);
      setAddressLabel(geocode.formatted_address.split(',')[0] + ', Pune');
    } catch (err: any) {
      alert(err?.message || 'Could not access GPS. Please check location permissions.');
    } finally {
      setIsLocating(false);
    }
  };

  // Leaflet Map Setup
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLon],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;
    map.invalidateSize();

    // User Origin Pin
    if (!userMarkerRef.current) {
      const uMarker = L.marker([currentLat, currentLon], {
        icon: createUserMarkerIcon(),
        zIndexOffset: 1000
      }).bindPopup(`<b>Your Origin</b><br/>${addressLabel}`);
      uMarker.addTo(map);
      userMarkerRef.current = uMarker;
    } else {
      userMarkerRef.current.setLatLng([currentLat, currentLon]);
      userMarkerRef.current.setPopupContent(`<b>Your Origin</b><br/>${addressLabel}`);
    }

    // Community Issues Pins
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      issues.forEach((item) => {
        if (item.latitude && item.longitude) {
          const pin = L.marker([item.latitude, item.longitude], {
            icon: createIssueMarkerIcon(item.status)
          });

          const popupContent = `
            <div style="font-family: sans-serif; font-size: 12px; min-width: 160px;">
              <div style="font-weight: 800; color: #0f172a; margin-bottom: 2px;">${item.title}</div>
              <div style="font-size: 10px; color: #64748b; margin-bottom: 4px;">${item.ticket_number} • ${item.category}</div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 3px; font-weight: 700;">
                <span style="color: #059669;">📍 ${item.distance_formatted}</span>
                <span style="font-size: 10px; color: #475569;">${item.status}</span>
              </div>
            </div>
          `;

          pin.bindPopup(popupContent);
          markersLayerRef.current?.addLayer(pin);
        }
      });
    }

    map.panTo([currentLat, currentLon], { animate: true });
  }, [currentLat, currentLon, issues, addressLabel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersLayerRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-2xs max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Community Issues</h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Civic complaints reported in your geographic vicinity
          </p>
        </div>

        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
            locationSource === 'gps'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
          }`}
          title="Detect precise GPS location"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Locating...</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              <span>{locationSource === 'gps' ? 'GPS Active' : 'Use My GPS'}</span>
            </>
          )}
        </button>
      </div>

      {/* Origin Location Pill & Radius Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
        <div className="flex items-center space-x-2 truncate">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold text-slate-800 truncate">Origin: {addressLabel}</span>
          <span className="font-mono text-[10px] text-slate-400">
            ({currentLat.toFixed(4)}°N, {currentLon.toFixed(4)}°E)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-[11px] text-slate-500 font-semibold">Radius:</label>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="text-xs font-semibold px-2 py-0.5 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
            <option value={20}>Within 20 km</option>
            <option value={50}>Within 50 km</option>
          </select>
        </div>
      </div>

      {/* 4 Stat Overview Grid */}
      <div>
        <div className="text-xs font-extrabold text-slate-900 mb-2">Overview in Area</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[#eefdf5] border border-emerald-100/70 p-4 rounded-2xl">
            <div className="text-2xl font-extrabold text-emerald-600">{stats.total_issues}</div>
            <div className="text-[11px] font-bold text-emerald-900 mt-1">Total Issues Reported</div>
          </div>

          <div className="bg-[#fffbeb] border border-amber-100/70 p-4 rounded-2xl">
            <div className="text-2xl font-extrabold text-amber-600">{stats.citizens_involved}</div>
            <div className="text-[11px] font-bold text-amber-900 mt-1">Citizens Involved</div>
          </div>

          <div className="bg-[#eff6ff] border border-blue-100/70 p-4 rounded-2xl">
            <div className="text-2xl font-extrabold text-blue-600">{stats.categories}</div>
            <div className="text-[11px] font-bold text-blue-900 mt-1">Categories</div>
          </div>

          <div className="bg-[#f5f3ff] border border-purple-100/70 p-4 rounded-2xl">
            <div className="text-2xl font-extrabold text-purple-600">{stats.this_month}</div>
            <div className="text-[11px] font-bold text-purple-900 mt-1">This Month</div>
          </div>
        </div>
      </div>

      {/* Interactive Map of Community Issues */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-extrabold text-slate-900">Map of Issues in Your Area</span>
          <span className="text-[10px] text-slate-500 font-medium">Click pin to view details</span>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
          <div ref={mapContainerRef} style={{ height: '220px', width: '100%' }} className="z-[1]" />
          
          {/* Map Legend */}
          <div className="absolute bottom-2 left-2 z-[1000] bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-semibold text-slate-700 shadow border border-slate-200 flex items-center space-x-2.5">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
              <span>You</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              <span>Under Review</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
              <span>In Progress</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>Resolved</span>
            </span>
          </div>
        </div>
      </div>

      {/* Recent Issues List with Proximity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Issues Sorted by Distance ({issues.length})</span>
          </h3>
          {onReportIssue && (
            <button
              type="button"
              onClick={onReportIssue}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              + Report New Issue
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-6 text-xs font-bold text-slate-400 flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading nearby civic issues...</span>
          </div>
        ) : issues.length > 0 ? (
          <div className="space-y-2.5">
            {issues.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border border-slate-150 hover:border-emerald-300 transition-all bg-white flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold shrink-0">
                    🏛️
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {item.ticket_number} • {item.category} • {item.location}
                    </div>
                    <div className="mt-1">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center space-x-0.5">
                        <span>📍</span>
                        <span>{item.distance_formatted}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 ml-2 ${
                    item.status === 'Resolved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : item.status === 'In Progress'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
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
              <div className="text-xs font-bold text-slate-800">
                No issues reported within {radiusKm} km yet.
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                Be the first to report an issue and help improve your community.
              </div>
            </div>
            {onReportIssue && (
              <button
                type="button"
                onClick={onReportIssue}
                className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm"
              >
                Report an Issue
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
