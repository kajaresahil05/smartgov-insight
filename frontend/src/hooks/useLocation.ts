import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Coordinates,
  GeolocationResult,
  getAccuracyInfo,
  requestDeviceLocation,
  reverseGeocodeCoordinates
} from '../services/locationService';

export type LocationSource = 'gps' | 'manual_map' | 'address_search' | 'saved' | 'default';

export interface UseLocationOptions {
  initialCoords?: Coordinates;
  initialAddress?: string;
  initialSource?: LocationSource;
  autoRequest?: boolean;
}

export interface UseLocationReturn {
  coords: Coordinates | null;
  accuracy: number | null;
  accuracyInfo: { label: string; badgeColor: string; isHighAccuracy: boolean } | null;
  address: string;
  loading: boolean;
  error: string | null;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  source: LocationSource;
  requestGPS: () => Promise<GeolocationResult | null>;
  setCoordinates: (lat: number, lon: number, customAddress?: string, newSource?: LocationSource) => Promise<void>;
  setAddress: (address: string) => void;
  clearError: () => void;
  reset: () => void;
}

export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
  const {
    initialCoords = null,
    initialAddress = '',
    initialSource = 'default',
    autoRequest = false
  } = options;

  const [coords, setCoords] = useState<Coordinates | null>(initialCoords);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [address, setAddressState] = useState<string>(initialAddress);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<LocationSource>(initialSource);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

  // Request counter to discard stale async requests
  const requestIdRef = useRef<number>(0);

  // Check browser permission status if supported
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((perm) => {
          setPermissionState(perm.state as 'prompt' | 'granted' | 'denied');
          perm.onchange = () => {
            setPermissionState(perm.state as 'prompt' | 'granted' | 'denied');
          };
        })
        .catch(() => {
          setPermissionState('unknown');
        });
    }
  }, []);

  // Request device location via Browser Geolocation API
  const requestGPS = useCallback(async (): Promise<GeolocationResult | null> => {
    const currentReqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const geoResult = await requestDeviceLocation();
      if (currentReqId !== requestIdRef.current) return null; // Stale request

      setCoords(geoResult.coords);
      setAccuracy(geoResult.accuracy);
      setSource('gps');
      setPermissionState('granted');

      // Reverse geocode to readable address
      const geocode = await reverseGeocodeCoordinates(
        geoResult.coords.latitude,
        geoResult.coords.longitude
      );

      if (currentReqId === requestIdRef.current) {
        setAddressState(geocode.formatted_address);
      }

      setLoading(false);
      return geoResult;
    } catch (err: any) {
      if (currentReqId !== requestIdRef.current) return null;
      setLoading(false);
      const errMsg = err?.message || 'Failed to obtain GPS location.';
      setError(errMsg);
      if (errMsg.includes('denied')) {
        setPermissionState('denied');
      }
      return null;
    }
  }, []);

  // Set coordinates manually (e.g., from map click, marker drag, or address search)
  const setCoordinates = useCallback(
    async (lat: number, lon: number, customAddress?: string, newSource: LocationSource = 'manual_map') => {
      const currentReqId = ++requestIdRef.current;
      setCoords({ latitude: lat, longitude: lon });
      setSource(newSource);
      setError(null);

      // If it's manual, we do not have GPS hardware accuracy
      if (newSource !== 'gps') {
        setAccuracy(null);
      }

      if (customAddress) {
        setAddressState(customAddress);
        return;
      }

      // Reverse geocode if no custom address was supplied
      setLoading(true);
      try {
        const geocode = await reverseGeocodeCoordinates(lat, lon);
        if (currentReqId === requestIdRef.current) {
          setAddressState(geocode.formatted_address);
        }
      } catch (err) {
        console.warn('[useLocation] Reverse geocode error:', err);
      } finally {
        if (currentReqId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  const setAddress = useCallback((newAddr: string) => {
    setAddressState(newAddr);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setCoords(initialCoords);
    setAccuracy(null);
    setAddressState(initialAddress);
    setLoading(false);
    setError(null);
    setSource(initialSource);
  }, [initialCoords, initialAddress, initialSource]);

  // Optionally auto-request GPS on mount (only if configured)
  useEffect(() => {
    if (autoRequest) {
      requestGPS();
    }
  }, [autoRequest, requestGPS]);

  const accuracyInfo = accuracy != null ? getAccuracyInfo(accuracy) : null;

  return {
    coords,
    accuracy,
    accuracyInfo,
    address,
    loading,
    error,
    permissionState,
    source,
    requestGPS,
    setCoordinates,
    setAddress,
    clearError,
    reset
  };
}
