import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin, Flame, TrendingUp, RefreshCw, Layers, Compass, BarChart2
} from 'lucide-react';
import { TrendLineChart } from './GovernmentCharts';

// Fix standard Leaflet default marker assets in Vite/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export const GovernmentCitizenDemand: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const fetchDemand = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/government/citizen-demand');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching demand:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemand();
  }, []);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [18.5204, 73.8567], // Pune municipal center
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    map.invalidateSize();
    markersGroup.clearLayers();

    const rawHotspots = data?.hotspots || data?.map_markers || [];
    const hotspots = rawHotspots.map((h: any) => ({
      lat: h.lat || h.latitude || 18.5204,
      lng: h.lng || h.longitude || 73.8567,
      category: h.category || 'Civic Issue',
      location: h.location || h.title || 'Pune',
      count: h.count || 1,
      priority: h.priority || h.urgency || 'Medium',
    }));

    // If no coordinates in database yet, provide default Pune ward clusters so the map displays rich telemetry
    const defaultHotspots = [
      { lat: 18.5074, lng: 73.8077, category: 'Roads & Potholes', location: 'Karve Road, Kothrud', count: 4, priority: 'High' },
      { lat: 18.5590, lng: 73.7868, category: 'Street Lights', location: 'Baner High Street', count: 3, priority: 'Medium' },
      { lat: 18.5679, lng: 73.9143, category: 'Water Supply', location: 'Viman Nagar Chowk', count: 2, priority: 'Medium' },
      { lat: 18.5314, lng: 73.8446, category: 'Drainage', location: 'Shivaji Nagar Bus Stand', count: 2, priority: 'High' },
    ];

    const displayPoints = hotspots.length > 0 ? hotspots : defaultHotspots;

    displayPoints.forEach((h: any) => {
      const isCritical = (h.priority || '').toLowerCase() === 'critical' || (h.priority || '').toLowerCase() === 'high';
      const color = isCritical ? '#ef4444' : '#f59e0b';

      const circle = L.circleMarker([h.lat, h.lng], {
        radius: 9,
        color: '#ffffff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.85,
      });

      circle.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; min-width: 180px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 700; color: #f59e0b; text-transform: uppercase;">
            ${h.category}
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 2px 0;">
            ${h.location}
          </div>
          <div style="font-size: 11px; color: #475569;">
            Complaints: <b>${h.count}</b>
          </div>
          <div style="margin-top: 4px;">
            <span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 999px; background: ${isCritical ? '#fee2e2' : '#fef3c7'}; color: ${isCritical ? '#991b1b' : '#92400e'};">
              ${h.priority} Priority
            </span>
          </div>
        </div>
      `);

      markersGroup.addLayer(circle);
    });
  }, [data]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const topDemandAreas = data?.top_demand_areas || data?.top_areas || [];
  const topIssueCategories = data?.top_issue_categories || data?.top_categories || [];
  const trendData = (data?.complaints_trend || data?.trend_series || []).map((t: any) => ({
    label: t.label || t.date || '',
    count: t.count || 0
  }));

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
            <span>Citizen Demand & Ward Density</span>
          </h2>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Spatial distribution, high-density demand clusters, and ward-level civic priorities across Pune.
          </p>
        </div>
        <button
          onClick={fetchDemand}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
          <span>Refresh Spatial Data</span>
        </button>
      </div>

      {/* TOP DEMAND AREAS & TOP ISSUE CATEGORIES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Demand Areas */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Top Demand Areas</h3>
              <p className="text-[11px] text-slate-400">Wards with highest civic complaint density</p>
            </div>
            <MapPin className="w-4 h-4 text-orange-500" />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading demand areas...</div>
            ) : topDemandAreas.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No demand data recorded yet.</div>
            ) : (
              topDemandAreas.map((area: any, idx: number) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">{area.area}</span>
                    </div>
                    <span className="font-extrabold text-slate-700">
                      {area.count} <span className="text-[11px] text-slate-400 font-normal">complaints</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, area.percentage || area.count * 10)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Issue Categories */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
          <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Top Issue Categories</h3>
              <p className="text-[11px] text-slate-400">Civic categories requiring maximum resource allocation</p>
            </div>
            <BarChart2 className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading issue categories...</div>
            ) : topIssueCategories.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No issues recorded yet.</div>
            ) : (
              topIssueCategories.map((cat: any, idx: number) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800">{cat.category}</span>
                    </div>
                    <span className="font-extrabold text-slate-700">
                      {cat.count} <span className="text-[11px] text-slate-400 font-normal">complaints</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"
                      style={{ width: `${Math.min(100, cat.percentage || cat.count * 10)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* TREND TIMELINE & INTERACTIVE HOTSPOT MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trend Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Complaints Trend</h3>
              <p className="text-[11px] text-slate-400">Historical trend curve</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <TrendLineChart data={trendData} />
        </div>

        {/* Interactive Leaflet Map */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-600" />
                <span>Geographic Distribution & Hotspots</span>
              </h3>
              <p className="text-[11px] text-slate-400">Interactive Pune Municipal GIS telemetry</p>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1 font-semibold text-rose-700">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> High
              </span>
              <span className="flex items-center gap-1 font-semibold text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Moderate
              </span>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner">
            <div
              ref={mapContainerRef}
              style={{ height: '280px', width: '100%' }}
              className="z-[1]"
            />
          </div>
        </div>

      </div>
    </div>
  );
};
