'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Info, Layers, Globe, Eye } from 'lucide-react';

export interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  title: string;
  category?: string;
  color?: string;
  details?: string;
  lastUpdated?: string;
  lastInspected?: string;
  photoUrl?: string;
  photoDate?: string;
  source?: string;
  verificationStatus?: 'verified' | 'synthetic' | 'illustrative';
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

type BasemapStyle = 'positron' | 'osm' | 'satellite';

interface BasemapDef {
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
}

const BASEMAP_TILES: Record<BasemapStyle, BasemapDef> = {
  positron: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team',
    maxZoom: 18,
    subdomains: ['a', 'b', 'c'],
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
  },
};

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
  const tileLayerRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState<BasemapStyle>('positron');

  const centerLat = center[0];
  const centerLng = center[1];

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true;

    const initLeaflet = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: zoom,
        zoomControl: true,
      });

      // Default basemap layer
      const basemapConfig = BASEMAP_TILES[currentBasemap];
      const tileLayer = L.tileLayer(basemapConfig.url, {
        attribution: basemapConfig.attribution,
        maxZoom: basemapConfig.maxZoom,
        subdomains: basemapConfig.subdomains || 'abc',
      });

      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;

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

  // Update Basemap Tiles when currentBasemap changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((LModule) => {
      const L = LModule.default;
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const basemapConfig = BASEMAP_TILES[currentBasemap];
      const newTileLayer = L.tileLayer(basemapConfig.url, {
        attribution: basemapConfig.attribution,
        maxZoom: basemapConfig.maxZoom,
        subdomains: basemapConfig.subdomains || 'abc',
      });

      newTileLayer.addTo(map);
      tileLayerRef.current = newTileLayer;
    });
  }, [currentBasemap, mapLoaded]);

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

      // Clear old vector layers
      layersRef.current.forEach((layer) => map.removeLayer(layer));
      layersRef.current = [];

      // Render Polygons (Hazard Zones & Cadastral Parcels)
      polygons.forEach((poly) => {
        try {
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

      // Render Lines (Evacuation Routes & Road Corridors)
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

      // Render Markers with Data Freshness & Provenance
      markers.forEach((m) => {
        try {
          const markerColor = m.color || '#2563eb';
          const customIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: `<div style="background-color: ${markerColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4);"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });

          const markerLayer = L.marker([m.lat, m.lng], { icon: customIcon }).addTo(map);

          // Build rich provenance popup
          const statusBadge =
            m.verificationStatus === 'verified'
              ? '<span style="display:inline-block; font-size:9px; background:#dcfce7; color:#166534; font-weight:bold; padding:1px 5px; border-radius:4px; margin-top:3px;">GROUND-VERIFIED</span>'
              : m.verificationStatus === 'synthetic'
              ? '<span style="display:inline-block; font-size:9px; background:#f1f5f9; color:#475569; font-weight:bold; padding:1px 5px; border-radius:4px; margin-top:3px;">SYNTHETIC SEED</span>'
              : m.verificationStatus === 'illustrative'
              ? '<span style="display:inline-block; font-size:9px; background:#fef9c3; color:#854d0e; font-weight:bold; padding:1px 5px; border-radius:4px; margin-top:3px;">ILLUSTRATIVE</span>'
              : '';

          const popupHtml = `
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 170px;">
              <strong style="font-size: 13px; color: #0f172a; display:block;">${escapeHtml(m.title)}</strong>
              ${m.category ? `<div style="color: #64748b; font-size: 11px; margin-top: 1px;">Type: ${escapeHtml(m.category)}</div>` : ''}
              ${m.details ? `<div style="margin-top: 4px; color: #334155; font-size: 11px;">${escapeHtml(m.details)}</div>` : ''}
              ${m.source ? `<div style="margin-top: 2px; color: #64748b; font-size: 10px;">Source: ${escapeHtml(m.source)}</div>` : ''}
              ${m.lastInspected ? `<div style="margin-top: 3px; color: #475569; font-size: 10px;">Inspected: <strong>${escapeHtml(m.lastInspected)}</strong></div>` : ''}
              ${statusBadge ? `<div style="margin-top: 2px;">${statusBadge}</div>` : ''}
              <div style="margin-top: 4px; font-size: 9px; color: #94a3b8; font-family: monospace;">Coords: ${m.lat.toFixed(4)}° N, ${m.lng.toFixed(4)}° E</div>
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
    <div className={`relative rounded-xl overflow-hidden border border-slate-300 shadow-sm ${className}`}>
      {/* Basemap Switcher Control in Top Right */}
      <div className="absolute top-2.5 right-2.5 z-[500] bg-white/95 backdrop-blur-xs rounded-lg p-1 shadow-md border border-slate-200 flex items-center gap-1 text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setCurrentBasemap('positron')}
          className={`px-2 py-1 rounded transition-colors ${
            currentBasemap === 'positron'
              ? 'bg-coconut-700 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Clean Vector Cartography"
        >
          Clean
        </button>
        <button
          type="button"
          onClick={() => setCurrentBasemap('osm')}
          className={`px-2 py-1 rounded transition-colors ${
            currentBasemap === 'osm'
              ? 'bg-coconut-700 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="OpenStreetMap Standard"
        >
          Street
        </button>
        <button
          type="button"
          onClick={() => setCurrentBasemap('satellite')}
          className={`px-2 py-1 rounded transition-colors ${
            currentBasemap === 'satellite'
              ? 'bg-coconut-700 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          title="Esri Satellite Imagery"
        >
          Satellite
        </button>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="bg-slate-100" />
    </div>
  );
};
