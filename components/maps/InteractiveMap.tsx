'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Info, WifiOff } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  title: string;
  category?: string;
  color?: string;
  details?: string;
}

export interface MapPolygon {
  id: string;
  coordinates: number[][][]; // GeoJSON format: [[[lng, lat], ...]]
  color: string;
  label?: string;
  fillOpacity?: number;
}

export interface MapLine {
  id: string;
  coordinates: number[][]; // GeoJSON format: [[lng, lat], ...]
  color: string;
  label?: string;
}

interface InteractiveMapProps {
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  markers?: MapMarker[];
  polygons?: MapPolygon[];
  lines?: MapLine[];
  onMapClick?: (lat: number, lng: number) => void;
  selectedPoint?: [number, number] | null;
  height?: string;
  className?: string;
}

// Pure HTML escaping helper to prevent XSS in Leaflet popup bindings (security.md)
function escapeHtml(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center = [11.305, 75.885],
  zoom = 14,
  markers = [],
  polygons = [],
  lines = [],
  onMapClick,
  selectedPoint,
  height = '420px',
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const { t } = useTranslation();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tileError, setTileError] = useState(false);

  const centerLat = center[0];
  const centerLng = center[1];

  useEffect(() => {
    let isMounted = true;

    // Load leaflet client-side
    const initLeaflet = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted) return;

      // Clean up previous map instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: zoom,
        zoomControl: true,
      });

      // Add OpenStreetMap tiles
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      });

      tileLayer.on('tileerror', () => {
        if (isMounted) setTileError(true);
      });

      tileLayer.addTo(map);

      // Handle map click
      if (onMapClick) {
        map.on('click', (e: any) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }

      mapInstanceRef.current = map;
      if (isMounted) setMapLoaded(true);
    };

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center & zoom
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([centerLat, centerLng], zoom);
    }
  }, [centerLat, centerLng, zoom]);

  // Update dynamic layers (markers, polygons, lines)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((LModule) => {
      const L = LModule.default;

      // Clear old layers
      layersRef.current.forEach((layer) => map.removeLayer(layer));
      layersRef.current = [];

      // Render Polygons
      polygons.forEach((poly) => {
        try {
          // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
          const latLngs = poly.coordinates[0].map(([lng, lat]) => [lat, lng]);
          const polygonLayer = L.polygon(latLngs as any, {
            color: poly.color || '#3b82f6',
            fillColor: poly.color || '#3b82f6',
            fillOpacity: poly.fillOpacity || 0.35,
            weight: 2,
          }).addTo(map);

          if (poly.label) {
            polygonLayer.bindPopup(`<strong>${escapeHtml(poly.label)}</strong>`);
          }
          layersRef.current.push(polygonLayer);
        } catch (e) {
          console.warn('Failed to render polygon', e);
        }
      });

      // Render Lines (Evacuation Routes)
      lines.forEach((line) => {
        try {
          const latLngs = line.coordinates.map(([lng, lat]) => [lat, lng]);
          const lineLayer = L.polyline(latLngs as any, {
            color: line.color || '#16a34a',
            weight: 4,
            dashArray: '6, 8',
          }).addTo(map);

          if (line.label) {
            lineLayer.bindPopup(`<strong>${escapeHtml(line.label)}</strong>`);
          }
          layersRef.current.push(lineLayer);
        } catch (e) {
          console.warn('Failed to render polyline', e);
        }
      });

      // Render Markers
      markers.forEach((m) => {
        try {
          const customIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `<div style="background-color: ${
              m.color || '#2563eb'
            }; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4);"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          const markerLayer = L.marker([m.lat, m.lng], { icon: customIcon }).addTo(map);

          const popupHtml = `
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
              <strong style="font-size: 13px; color: #0f172a;">${escapeHtml(m.title)}</strong>
              ${m.category ? `<div style="color: #64748b; margin-top: 2px;">Type: ${escapeHtml(m.category)}</div>` : ''}
              ${m.details ? `<div style="margin-top: 4px; color: #334155;">${escapeHtml(m.details)}</div>` : ''}
              <div style="margin-top: 4px; font-size: 10px; color: #94a3b8;">Coords: ${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}</div>
            </div>
          `;

          markerLayer.bindPopup(popupHtml);
          layersRef.current.push(markerLayer);
        } catch (e) {
          console.warn('Failed to render marker', e);
        }
      });

      // Render Selected Pin if present
      if (selectedPoint) {
        const pinIcon = L.divIcon({
          className: 'selected-pin-marker',
          html: `<div style="background-color: #dc2626; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(220,38,38,0.8); animation: bounce 1s infinite;"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const pinLayer = L.marker([selectedPoint[0], selectedPoint[1]], { icon: pinIcon }).addTo(map);
        pinLayer.bindPopup('<strong>Selected Location</strong>').openPopup();
        layersRef.current.push(pinLayer);
      }
    });
  }, [mapLoaded, markers, polygons, lines, selectedPoint]);

  return (
    <div className={`relative rounded-lg overflow-hidden border border-slate-300 shadow-sm ${className}`}>
      {/* Offline Alert Fallback Banner if tile error occurs */}
      {tileError && (
        <div className="absolute top-2 left-2 right-2 z-[500] bg-amber-50 border border-amber-300 text-amber-900 text-xs px-3 py-1.5 rounded shadow flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>{t('offline_fallback')}</span>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="bg-slate-100" />
    </div>
  );
};
