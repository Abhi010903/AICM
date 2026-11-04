'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { calculateDistanceKm } from './calculations';

export interface CitizenLocation {
  lat: number;
  lng: number;
  source: 'demo' | 'gps' | 'manual';
  accuracy?: number; // meters
  timestamp: number;
  label_en: string;
  label_ml: string;
}

export interface LocationContextType {
  location: CitizenLocation;
  loading: boolean;
  error: string | null;
  requestGpsLocation: () => Promise<boolean>;
  setManualLocation: (lat: number, lng: number, labelEn?: string, labelMl?: string) => void;
  setPresetLocation: (lat: number, lng: number, labelEn: string, labelMl: string) => void;
  resetToDemoLocation: () => void;
  isOutsideKunnamangalam: boolean;
  distanceFromKunnamangalamKm: number;
}

// Default demonstration location: Ward 7 Cheruvannur Centroid (Kunnamangalam Grama Panchayat)
export const KUNNAMANGALAM_DEMO_LOCATION: CitizenLocation = {
  lat: 11.305,
  lng: 75.885,
  source: 'demo',
  timestamp: Date.now(),
  label_en: 'Ward 7 (Cheruvannur Central)',
  label_ml: 'വാർഡ് 7 (ചെറുവണ്ണൂർ സെൻട്രൽ)',
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = 'aicm_citizen_location_v1';

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<CitizenLocation>(KUNNAMANGALAM_DEMO_LOCATION);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Restore saved location from sessionStorage on mount (if available)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CitizenLocation;
        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          setLocation(parsed);
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  // Compute distance from Kunnamangalam centroid
  const distanceFromKunnamangalamKm = useMemo(() => {
    return Math.round(calculateDistanceKm(location.lat, location.lng, 11.305, 75.885) * 10) / 10;
  }, [location.lat, location.lng]);

  const isOutsideKunnamangalam = distanceFromKunnamangalamKm > 25;

  const saveLocation = useCallback((newLoc: CitizenLocation) => {
    setLocation(newLoc);
    setError(null);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newLoc));
      } catch {
        // Ignore storage write errors
      }
    }
  }, []);

  // Request browser GPS location
  const requestGpsLocation = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return false;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lng = Number(pos.coords.longitude.toFixed(5));
          const accuracy = Math.round(pos.coords.accuracy || 0);
          const distKm = Math.round(calculateDistanceKm(lat, lng, 11.305, 75.885) * 10) / 10;

          let labelEn = `My GPS Location (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;
          let labelMl = `എന്റെ ജി.പി.എസ് സ്ഥാനം (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;

          if (distKm <= 15) {
            labelEn = 'My GPS Location (Kunnamangalam Area)';
            labelMl = 'എന്റെ ജി.പി.എസ് സ്ഥാനം (കുന്നമംഗലം പ്രദേശം)';
          }

          const newLoc: CitizenLocation = {
            lat,
            lng,
            source: 'gps',
            accuracy,
            timestamp: Date.now(),
            label_en: labelEn,
            label_ml: labelMl,
          };

          saveLocation(newLoc);
          setLoading(false);
          resolve(true);
        },
        (err) => {
          setLoading(false);
          let msg = 'Unable to acquire live GPS location.';
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'Location permission denied by user. You can tap on the map to set your location.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = 'GPS signal unavailable from device. Retaining current location.';
          } else if (err.code === err.TIMEOUT) {
            msg = 'GPS location request timed out. Retaining current location.';
          }
          setError(msg);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
  }, [saveLocation]);

  // Set manual location via map click or coordinate input
  const setManualLocation = useCallback(
    (lat: number, lng: number, labelEn?: string, labelMl?: string) => {
      const cleanLat = Number(lat.toFixed(5));
      const cleanLng = Number(lng.toFixed(5));
      const newLoc: CitizenLocation = {
        lat: cleanLat,
        lng: cleanLng,
        source: 'manual',
        timestamp: Date.now(),
        label_en: labelEn || `Pinned Point (${cleanLat.toFixed(4)}°, ${cleanLng.toFixed(4)}°)`,
        label_ml: labelMl || `തിരഞ്ഞെടുത്ത സ്ഥാനം (${cleanLat.toFixed(4)}°, ${cleanLng.toFixed(4)}°)`,
      };
      saveLocation(newLoc);
    },
    [saveLocation]
  );

  // Set preset ward location
  const setPresetLocation = useCallback(
    (lat: number, lng: number, labelEn: string, labelMl: string) => {
      const newLoc: CitizenLocation = {
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        source: 'demo',
        timestamp: Date.now(),
        label_en: labelEn,
        label_ml: labelMl,
      };
      saveLocation(newLoc);
    },
    [saveLocation]
  );

  // Reset back to Kunnamangalam demonstration centroid
  const resetToDemoLocation = useCallback(() => {
    saveLocation(KUNNAMANGALAM_DEMO_LOCATION);
  }, [saveLocation]);

  const value = useMemo(
    () => ({
      location,
      loading,
      error,
      requestGpsLocation,
      setManualLocation,
      setPresetLocation,
      resetToDemoLocation,
      isOutsideKunnamangalam,
      distanceFromKunnamangalamKm,
    }),
    [
      location,
      loading,
      error,
      requestGpsLocation,
      setManualLocation,
      setPresetLocation,
      resetToDemoLocation,
      isOutsideKunnamangalam,
      distanceFromKunnamangalamKm,
    ]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export const useCitizenLocation = (): LocationContextType => {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useCitizenLocation must be used within a LocationProvider');
  }
  return ctx;
};
