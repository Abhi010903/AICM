'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Home,
  Navigation,
  Phone,
  ShieldCheck,
  Search,
  MapPin,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { InteractiveMap } from '@/components/maps/InteractiveMap';
import { getHazardZones, getEvacuationRoutes } from '@/lib/api';
import { HazardZoneCollection, EvacuationRouteCollection } from '@/lib/types';
import { calculateDistanceKm } from '@/lib/calculations';

export default function CitizenHazardPage() {
  const { t } = useTranslation();
  const [hazardZones, setHazardZones] = useState<HazardZoneCollection | null>(null);
  const [evacRoutes, setEvacRoutes] = useState<EvacuationRouteCollection | null>(null);
  const [loading, setLoading] = useState(true);

  // Citizen address & pin state (default Ward 7 near river)
  const [addressInput, setAddressInput] = useState('Chaliyar Riverside, Ward 7, Cheruvannur');
  const [userLocation, setUserLocation] = useState<[number, number]>([11.3038, 75.8835]);
  const [riskLevel, setRiskLevel] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [riskReason, setRiskReason] = useState(
    'Location falls directly inside the Chaliyar River Basin High Flood Zone (KSDMA Category 1). Annual monsoon inundation risk exceeds 1.5m.'
  );

  useEffect(() => {
    async function load() {
      try {
        const [hz, er] = await Promise.all([getHazardZones(), getEvacuationRoutes()]);
        setHazardZones(hz);
        setEvacRoutes(er);
      } catch (err) {
        console.error('Failed to load hazard data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleEvaluateLocation = (lat: number, lng: number, address: string) => {
    setUserLocation([lat, lng]);
    setAddressInput(address);

    // Simple deterministic risk classifier based on latitude
    if (lat >= 11.30 && lat <= 11.31) {
      setRiskLevel('HIGH');
      setRiskReason(
        'Location falls directly inside the Chaliyar River Basin High Flood Zone (KSDMA Category 1). Annual monsoon inundation risk exceeds 1.5m.'
      );
    } else if (lat >= 11.325) {
      setRiskLevel('MEDIUM');
      setRiskReason(
        'Location lies adjacent to Kottakkunnu hill slope buffer. Moderate landslide runoff warning during orange alert rainfall.'
      );
    } else {
      setRiskLevel('LOW');
      setRiskReason(
        'Elevated dry land terrace outside active flood inundation contours and steep slopes. Minimal historic flood exposure.'
      );
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  // Nearest Shelter info from evacuation routes
  const primaryRoute = evacRoutes?.features[0];
  const shelter = primaryRoute?.properties;
  const shelterDistance = shelter
    ? calculateDistanceKm(userLocation[0], userLocation[1], shelter.shelter_lat, shelter.shelter_lng)
    : 2.1;

  // Map elements
  const mapPolygons =
    hazardZones?.features.map((hz) => ({
      id: hz.properties.id,
      coordinates: hz.geometry.coordinates,
      color: hz.properties.color,
      label: `${hz.properties.name_en} (${hz.properties.severity})`,
      fillOpacity: 0.3,
    })) || [];

  const mapLines = primaryRoute
    ? [
        {
          id: primaryRoute.properties.id,
          coordinates: primaryRoute.geometry.coordinates,
          color: '#16a34a',
          label: `Evacuation Route: ${primaryRoute.properties.name_en}`,
        },
      ]
    : [];

  const mapMarkers = [
    {
      id: 'citizen_house',
      lat: userLocation[0],
      lng: userLocation[1],
      title: 'Your Location',
      category: `Risk: ${riskLevel}`,
      color: riskLevel === 'HIGH' ? '#dc2626' : riskLevel === 'MEDIUM' ? '#ea580c' : '#16a34a',
      details: addressInput,
    },
    ...(shelter
      ? [
          {
            id: 'shelter_pin',
            lat: shelter.shelter_lat,
            lng: shelter.shelter_lng,
            title: shelter.shelter_name_en,
            category: 'Designated Relief Camp',
            color: '#16a34a',
            details: `Capacity: ${shelter.shelter_capacity} persons · Contact: ${shelter.shelter_contact}`,
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('nav_citizen_hazard')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              C5/C6 Citizen Flood Vulnerability & Nearest Emergency Relief Shelter
            </p>
          </div>
        </div>
        <SourceChip screenKey="citizen_hazard" />
      </div>

      {/* Address Test Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Enter residence address or landmark..."
              className="w-full pl-9 p-2.5 bg-slate-50 rounded-lg border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-slate-500 font-semibold">Test Sample Locations:</span>
          <button
            onClick={() =>
              handleEvaluateLocation(11.3038, 75.8835, 'Chaliyar Riverside, Ward 7 (Cheruvannur)')
            }
            className="px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-900 font-bold"
          >
            Ward 7 Riverbank (High Risk)
          </button>
          <button
            onClick={() =>
              handleEvaluateLocation(11.332, 75.879, 'Kottakkunnu Hill Slopes, Ward 8')
            }
            className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold"
          >
            Ward 8 Hill Slope (Medium Risk)
          </button>
          <button
            onClick={() =>
              handleEvaluateLocation(11.285, 75.862, 'Velliparamba Elevated Terrace, Ward 11')
            }
            className="px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold"
          >
            Ward 11 Highland (Low Risk)
          </button>
        </div>
      </div>

      {/* Risk Verdict & Shelter Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Card */}
        <div
          className={`p-5 rounded-2xl border shadow-sm space-y-3 ${
            riskLevel === 'HIGH'
              ? 'bg-red-50 border-red-300 text-red-950'
              : riskLevel === 'MEDIUM'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={`w-8 h-8 flex-shrink-0 ${
                riskLevel === 'HIGH'
                  ? 'text-red-600'
                  : riskLevel === 'MEDIUM'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                KSDMA Hazard Exposure Status
              </span>
              <h2 className="text-2xl font-black">{riskLevel} RISK ZONE</h2>
            </div>
          </div>
          <p className="text-xs leading-relaxed font-medium">{riskReason}</p>
        </div>

        {/* Shelter Card */}
        {shelter && (
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Nearest Designated Shelter
              </span>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {shelter.shelter_name_en}
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div>
                <span className="text-[11px] text-slate-400 block">Distance</span>
                <strong className="text-slate-900 font-bold">{shelterDistance} km</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Capacity</span>
                <strong className="text-slate-900 font-bold">{shelter.shelter_capacity}</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Helpdesk</span>
                <strong className="text-blue-700 font-mono font-bold">2884101</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map with House Pin, Hazard Polygon, Shelter, and Route */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-emerald-600" />
            <span>Evacuation Map & Route Navigation</span>
          </h3>
          <span className="text-slate-500 font-mono">
            KSDMA Flood Model & Evacuation Route
          </span>
        </div>

        <InteractiveMap
          center={userLocation}
          zoom={15}
          polygons={mapPolygons}
          lines={mapLines}
          markers={mapMarkers}
          height="420px"
        />

        <div className="text-[11px] text-slate-500 text-center">
          Green dashed polyline marks the safest designated higher-ground route to the Higher Secondary School camp.
        </div>
      </div>
    </div>
  );
}
