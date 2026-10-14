import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2, ArrowUpDown } from 'lucide-react';
import L from 'leaflet';
import { requestDeviceLocation, reverseGeocodeCoordinates } from '../services/locationService';

// Custom Project Marker Icon
const createProjectMarkerIcon = (category: string) => {
  let color = '#059669'; // default emerald
  if (category === 'Road') color = '#d97706'; // amber
  if (category === 'Water') color = '#0284c7'; // sky
  if (category === 'Drainage') color = '#7c3aed'; // violet

  return L.divIcon({
    className: 'custom-proj-pin',
    html: `
      <div style="position: relative; width: 34px; height: 42px; display: flex; align-items: center; justify-content: center;">
        <svg width="32" height="40" viewBox="0 0 384 512" fill="${color}" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.35));">
          <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 38],
    popupAnchor: [0, -36]
  });
};

// User Location Marker (Pulse Blue)
const createUserMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-user-pin',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 28px; height: 28px; background: rgba(37, 99, 235, 0.25); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 14px; height: 14px; background: #2563eb; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

interface ProjectsNearMeProps {
  userLocation?: string;
  userCoords?: { latitude: number; longitude: number };
  onSelectProject?: (projectId: number) => void;
}

export default function ProjectsNearMe({
  userLocation,
  userCoords,
  onSelectProject
}: ProjectsNearMeProps) {
  // State for user position
  const [currentLat, setCurrentLat] = useState<number>(userCoords?.latitude || 18.5074);
  const [currentLon, setCurrentLon] = useState<number>(userCoords?.longitude || 73.8077);
  const [addressLabel, setAddressLabel] = useState<string>(userLocation || 'Kothrud, Pune');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationSource, setLocationSource] = useState<'gps' | 'saved' | 'default'>('saved');

  // Filter & Data States
  const [projects, setProjects] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Fetch Nearby Projects
  const fetchNearbyProjects = async () => {
    setLoading(true);
    try {
      let url = `/api/location/projects/nearby?lat=${currentLat}&lon=${currentLon}&radius_km=${radiusKm}`;
      if (activeCategory !== 'All') {
        url += `&category=${encodeURIComponent(activeCategory)}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.projects)) {
        setProjects(json.projects);
      } else {
        setProjects([]);
      }
    } catch (e) {
      console.error('Error fetching nearby projects:', e);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyProjects();
  }, [currentLat, currentLon, activeCategory, radiusKm]);

  // Request Device GPS
  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const geo = await requestDeviceLocation();
      setCurrentLat(geo.coords.latitude);
      setCurrentLon(geo.coords.longitude);
      setLocationSource('gps');

      const geocode = await reverseGeocodeCoordinates(
        geo.coords.latitude,
        geo.coords.longitude
      );
      setAddressLabel(geocode.formatted_address.split(',')[0] + ', Pune');
    } catch (err: any) {
      alert(err?.message || 'Could not access GPS. Please check location permissions.');
    } finally {
      setIsLocating(false);
    }
  };

  // Leaflet Map Initialization and Layer Management
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

    // User Origin Marker
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

    // Projects Markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      projects.forEach((proj) => {
        if (proj.latitude && proj.longitude) {
          const pin = L.marker([proj.latitude, proj.longitude], {
            icon: createProjectMarkerIcon(proj.category)
          });

          const popupContent = `
            <div style="font-family: sans-serif; font-size: 12px; min-width: 170px;">
              <div style="font-weight: 800; color: #0f172a; margin-bottom: 3px;">${proj.title}</div>
              <div style="color: #64748b; font-size: 11px; margin-bottom: 5px;">${proj.category} • ${proj.status}</div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 4px; font-weight: 700; color: #059669;">
                <span>⚡ ${proj.distance_formatted}</span>
                <span>${proj.progress}% Done</span>
              </div>
            </div>
          `;

          pin.bindPopup(popupContent);
          pin.on('click', () => {
            setSelectedProjectId(proj.id);
          });

          markersLayerRef.current?.addLayer(pin);
        }
      });
    }

    // Smoothly pan map to user origin or fit bounds
    map.panTo([currentLat, currentLon], { animate: true });
  }, [currentLat, currentLon, projects, addressLabel]);

  // Clean up Leaflet on unmount
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
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs max-w-xl mx-auto space-y-5">
      {/* Header & Location Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Projects Near Me
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Real-time Haversine distance from your coordinates
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

      {/* Origin Location Card */}
      <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center space-x-2 truncate pr-2">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold text-slate-800 truncate">Origin: {addressLabel}</span>
        </div>
        <span className="font-mono text-[10px] text-slate-400 shrink-0">
          {currentLat.toFixed(4)}°N, {currentLon.toFixed(4)}°E
        </span>
      </div>

      {/* Category & Radius Filters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {['All', 'Road', 'Water', 'Drainage'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 ${
                  activeCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value={5}>Within 5 km</option>
            <option value={15}>Within 15 km</option>
            <option value={25}>Within 25 km</option>
            <option value={50}>Within 50 km</option>
          </select>
        </div>
      </div>

      {/* Interactive Leaflet Map */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
        <div ref={mapContainerRef} style={{ height: '220px', width: '100%' }} className="z-[1]" />
        
        {/* Map Legend Overlay */}
        <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md text-[10px] font-semibold text-slate-700 shadow border border-slate-200 flex items-center space-x-2">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
            <span>You</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            <span>Road</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
            <span>Water</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
            <span>Drainage</span>
          </span>
        </div>
      </div>

      {/* Projects List Sorted by Haversine Distance */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
          <span className="flex items-center space-x-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Sorted by Haversine Distance</span>
          </span>
          <span>{projects.length} Projects Found</span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs font-bold text-slate-400 flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Calculating proximity from GPS...</span>
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-3">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  if (onSelectProject) onSelectProject(proj.id);
                }}
                className={`p-3.5 rounded-2xl border transition-all bg-white cursor-pointer flex items-center justify-between ${
                  selectedProjectId === proj.id
                    ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-sm'
                    : 'border-slate-150 hover:border-emerald-400 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                    <img
                      src={proj.image || 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=400&q=80'}
                      alt={proj.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {proj.title}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center space-x-2">
                      <span>{proj.location}</span>
                    </div>

                    <div className="flex items-center space-x-2 mt-1.5">
                      {/* Real Distance Badge */}
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center space-x-0.5">
                        <span>📍</span>
                        <span>{proj.distance_formatted}</span>
                      </span>

                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{proj.progress}%</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      proj.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}
                  >
                    {proj.status}
                  </span>
                  <div className="text-[10px] text-slate-400 font-medium mt-1">
                    {proj.expected_end ? `Due ${proj.expected_end}` : 'In progress'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 px-6 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-center space-y-2">
            <div className="text-2xl">🗺️</div>
            <h3 className="text-sm font-extrabold text-slate-900">
              No Government Projects within {radiusKm} km
            </h3>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
              Try expanding the distance radius or filtering by a different category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
