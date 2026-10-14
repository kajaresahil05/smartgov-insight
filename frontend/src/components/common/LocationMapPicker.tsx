import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { searchAddressLocation, SearchLocationResult } from '../../services/locationService';

// Fix standard Leaflet default marker assets in Vite/Webpack environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// Sleek Custom SVG Pin for Selected Location
const createCustomPinIcon = (color: string = '#059669', pulse: boolean = false) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="position: relative; width: 36px; height: 44px; display: flex; align-items: center; justify-content: center;">
        ${pulse ? `<div style="position: absolute; width: 44px; height: 44px; background: ${color}33; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
        <svg width="34" height="42" viewBox="0 0 384 512" fill="${color}" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
          <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/>
        </svg>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    popupAnchor: [0, -38]
  });
};

interface LocationMapPickerProps {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  interactive?: boolean;
  height?: string;
  zoom?: number;
  onLocationChange?: (lat: number, lon: number, address?: string) => void;
  onRequestGPS?: () => void;
  gpsLoading?: boolean;
  locationSource?: string;
  showSearchBar?: boolean;
  className?: string;
}

export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  latitude,
  longitude,
  accuracy = null,
  interactive = true,
  height = '340px',
  zoom = 15,
  onLocationChange,
  onRequestGPS,
  gpsLoading = false,
  locationSource = 'map_picker',
  showSearchBar = true,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchLocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Initialize or update map view
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create map if it does not exist yet
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: interactive
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;

      // Handle map click to reposition marker
      if (interactive) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          if (onLocationChange) {
            onLocationChange(lat, lng);
          }
        });
      }
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Ensure map bounds are clean
    map.invalidateSize();

    // Position marker
    const pinColor = locationSource === 'gps' ? '#2563eb' : '#059669';
    const pinIcon = createCustomPinIcon(pinColor, locationSource === 'gps');

    if (!markerRef.current) {
      const marker = L.marker([latitude, longitude], {
        icon: pinIcon,
        draggable: interactive
      }).addTo(map);

      if (interactive) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          if (onLocationChange) {
            onLocationChange(pos.lat, pos.lng);
          }
        });
      }

      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([latitude, longitude]);
      markerRef.current.setIcon(pinIcon);
      if (interactive && !markerRef.current.dragging?.enabled()) {
        markerRef.current.dragging?.enable();
      }
    }

    // Accuracy Circle
    if (accuracy && accuracy > 0) {
      if (!accuracyCircleRef.current) {
        accuracyCircleRef.current = L.circle([latitude, longitude], {
          radius: accuracy,
          color: locationSource === 'gps' ? '#3b82f6' : '#10b981',
          fillColor: locationSource === 'gps' ? '#93c5fd' : '#a7f3d0',
          fillOpacity: 0.22,
          weight: 1.5
        }).addTo(map);
      } else {
        accuracyCircleRef.current.setLatLng([latitude, longitude]);
        accuracyCircleRef.current.setRadius(accuracy);
      }
    } else if (accuracyCircleRef.current) {
      map.removeLayer(accuracyCircleRef.current);
      accuracyCircleRef.current = null;
    }

    // Pan map to new center smoothly
    map.panTo([latitude, longitude], { animate: true });
  }, [latitude, longitude, accuracy, interactive, zoom, onLocationChange, locationSource]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
      accuracyCircleRef.current = null;
    };
  }, []);

  // Handle Search Input
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchAddressLocation(query);
      setSearchResults(results);
      setShowDropdown(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSelectSearchResult = (result: SearchLocationResult) => {
    setShowDropdown(false);
    setSearchQuery(result.display_name.split(',')[0]);
    if (onLocationChange) {
      onLocationChange(result.latitude, result.longitude, result.display_name);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([result.latitude, result.longitude], 16, { animate: true });
    }
  };

  return (
    <div className={`relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-inner flex flex-col ${className}`}>
      {/* Top Map Action Bar */}
      {showSearchBar && interactive && (
        <div className="p-2.5 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 z-[1000] relative">
          {/* Address Search Field */}
          <div className="relative flex-1 min-w-[220px]">
            <div className="flex items-center px-3 py-1.5 rounded-lg border border-gray-200 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all text-xs">
              <svg className="w-3.5 h-3.5 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search area, road, landmark in Pune..."
                className="w-full bg-transparent focus:outline-none text-gray-700 placeholder-gray-400 text-xs"
              />
              {isSearching && (
                <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-[2000] text-xs">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-start space-x-2 border-b border-gray-50 last:border-0 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <div className="truncate">
                      <p className="font-medium text-gray-800 truncate">{item.display_name.split(',')[0]}</p>
                      <p className="text-[10px] text-gray-500 truncate">{item.display_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick GPS Button */}
          {onRequestGPS && (
            <button
              type="button"
              onClick={onRequestGPS}
              disabled={gpsLoading}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                locationSource === 'gps'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
              title="Obtain device GPS coordinates"
            >
              {gpsLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                  </svg>
                  <span>Use My GPS</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Leaflet Map Container */}
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="z-[1] focus:outline-none"
      />

      {/* Bottom Coordinate Bar */}
      <div className="px-3 py-1.5 bg-gray-900/90 text-white text-[11px] flex flex-wrap items-center justify-between gap-2 z-[1000] relative backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-gray-200">
            {latitude.toFixed(5)}°N, {longitude.toFixed(5)}°E
          </span>
          {accuracy != null && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
              ±{Math.round(accuracy)}m GPS
            </span>
          )}
        </div>

        {interactive && (
          <span className="text-[10px] text-gray-300">
            Click map or drag pin to fine-tune exact location
          </span>
        )}
      </div>
    </div>
  );
};
