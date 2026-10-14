// Reusable Location Service for SmartGov Insight
// Provides Browser Geolocation API, OpenStreetMap reverse/forward geocoding, and distance calculations

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeolocationResult {
  coords: Coordinates;
  accuracy: number; // meters
  timestamp: number;
  isGPS: boolean;
  accuracyLabel: string;
}

export interface ReverseGeocodeResult {
  formatted_address: string;
  display_name: string;
  latitude: number;
  longitude: number;
  details?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
}

export interface SearchLocationResult {
  display_name: string;
  latitude: number;
  longitude: number;
  type?: string;
}

// Client-side in-memory cache for reverse geocoding to prevent redundant network calls
const clientGeocodeCache = new Map<string, ReverseGeocodeResult>();

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371.0; // Earth radius in km
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats distance into a human-readable string.
 */
export function formatDistanceString(distKm: number): string {
  if (isNaN(distKm) || distKm == null) return '';
  if (distKm < 1.0) {
    const meters = Math.round(distKm * 1000);
    return `${meters} m away`;
  }
  return `${distKm.toFixed(1)} km away`;
}

/**
 * Categorizes reported GPS accuracy into an informative label.
 */
export function getAccuracyInfo(accuracyMeters: number): {
  label: string;
  badgeColor: string;
  isHighAccuracy: boolean;
} {
  if (accuracyMeters <= 30) {
    return {
      label: `High GPS Accuracy (±${Math.round(accuracyMeters)}m)`,
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      isHighAccuracy: true
    };
  } else if (accuracyMeters <= 150) {
    return {
      label: `Good Accuracy (±${Math.round(accuracyMeters)}m)`,
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200',
      isHighAccuracy: false
    };
  } else {
    return {
      label: `Approximate Location (±${Math.round(accuracyMeters)}m)`,
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
      isHighAccuracy: false
    };
  }
}

/**
 * Obtains the device's actual position using the Browser Geolocation API.
 * Uses high accuracy, a 10s timeout, and a 30s maximum cache age.
 */
export function requestDeviceLocation(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000
  }
): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser or operating system.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = position.coords.accuracy || 50;
        const info = getAccuracyInfo(accuracy);
        resolve({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          accuracy,
          timestamp: position.timestamp,
          isGPS: info.isHighAccuracy,
          accuracyLabel: info.label
        });
      },
      (error) => {
        let msg = 'Failed to obtain device location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission was denied. Please allow location access or choose on map.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Device location is currently unavailable. Please pick a location on map.';
            break;
          case error.TIMEOUT:
            msg = 'Location request timed out. Please retry or pick a location on map.';
            break;
          default:
            msg = error.message || 'Unknown location error.';
        }
        reject(new Error(msg));
      },
      options
    );
  });
}

/**
 * Reverse geocodes coordinates into a human-readable address.
 * Leverages the backend proxy with caching to respect OSM / Nominatim usage policies.
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lon: number
): Promise<ReverseGeocodeResult> {
  const cacheKey = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
  if (clientGeocodeCache.has(cacheKey)) {
    return clientGeocodeCache.get(cacheKey)!;
  }

  try {
    const res = await fetch(`/api/location/reverse-geocode?lat=${lat}&lon=${lon}`);
    const json = await res.json();
    if (json.success) {
      const result: ReverseGeocodeResult = {
        formatted_address: json.formatted_address || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        display_name: json.display_name || json.formatted_address,
        latitude: lat,
        longitude: lon,
        details: json.details
      };
      clientGeocodeCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('[LocationService] Reverse geocode network error, using fallback:', err);
  }

  // Local graceful fallback
  const fallbackResult: ReverseGeocodeResult = {
    formatted_address: `Civic Location (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E), Pune`,
    display_name: `Civic Location (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E), Pune`,
    latitude: lat,
    longitude: lon
  };
  return fallbackResult;
}

/**
 * Forward geocodes an address search query into location suggestions.
 */
export async function searchAddressLocation(
  query: string
): Promise<SearchLocationResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(`/api/location/search?q=${encodeURIComponent(query.trim())}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.results)) {
      return json.results;
    }
  } catch (err) {
    console.warn('[LocationService] Address search error:', err);
  }
  return [];
}
