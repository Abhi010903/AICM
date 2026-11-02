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
import { HazardZoneCollection, EvacuationRouteCollection, EvacuationRouteFeature } from '@/lib/types';
import { calculateDistanceKm, isPointInPolygon } from '@/lib/calculations';

export default function CitizenHazardPage() {
  const { t } = useTranslation();
  const [hazardZones, setHazardZones] = useState<HazardZoneCollection | null>(null);
  const [evacRoutes, setEvacRoutes] = useState<EvacuationRouteCollection | null>(null);
  const [loading, setLoading] = useState(true);

  // Citizen address & pin state (default Ward 7 near river)
  const [addressInput, setAddressInput] = useState('Chaliyar Riverside, Ward 7, Cheruvannur');
  const [userLocation, setUserLocation] = useState<[number, number]>([11.3038, 75.8835]);
  const [riskLevel, setRiskLevel] = useState<'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE'>('HIGH');
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

    if (!hazardZones || !hazardZones.features) {
      setRiskLevel('UNAVAILABLE');
      setRiskReason('Hazard zone spatial data is temporarily unavailable. Unable to determine exposure.');
      return;
    }

    // Derive deterministic hazard risk using isPointInPolygon on bundled KSDMA hazard polygons
    let matchedRisk: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    let matchedReason =
      'Elevated dry land terrace outside active flood inundation contours and steep slopes. Minimal historic flood exposure.';

    for (const hz of hazardZones.features) {
      const polyCoords = hz.geometry.coordinates[0];
      if (isPointInPolygon([lng, lat], polyCoords)) {
        if (hz.properties.hazard_type === 'flood_high') {
          matchedRisk = 'HIGH';
          matchedReason = `Location falls directly inside ${hz.properties.name_en} (${hz.properties.severity}). Annual monsoon inundation risk exceeds 1.5m.`;
          break;
        } else if (hz.properties.hazard_type === 'landslide') {
          matchedRisk = 'MEDIUM';
          matchedReason = `Location lies in ${hz.properties.name_en} (${hz.properties.severity}). Moderate landslide runoff warning during orange alert rainfall.`;
          break;
        } else if (hz.properties.hazard_type === 'flood_med') {
          matchedRisk = 'MEDIUM';
          matchedReason = `Location lies in ${hz.properties.name_en} (${hz.properties.severity}). Waterlogging risk during heavy rainfall events.`;
        }
      }
    }

    setRiskLevel(matchedRisk);
    setRiskReason(matchedReason);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  // Match evacuation route whose origin serves userLocation (within reasonable proximity)
  let nearestRoute: EvacuationRouteFeature | undefined;
  let minOriginDist = Infinity;

  if (evacRoutes && evacRoutes.features) {
    for (const r of evacRoutes.features) {
      const origin = r.geometry.coordinates[0];
      const distToOrigin = calculateDistanceKm(
        userLocation[0],
        userLocation[1],
        origin[1],
        origin[0]
      );
      if (distToOrigin <= 1.5 && distToOrigin < minOriginDist) {
        minOriginDist = distToOrigin;
        nearestRoute = r;
      }
    }
  }

  const primaryRoute = nearestRoute;
  const shelter = primaryRoute?.properties;
  const shelterDistance = shelter?.distance_km ?? 0;

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
      color:
        riskLevel === 'HIGH'
          ? '#dc2626'
          : riskLevel === 'MEDIUM'
          ? '#ea580c'
          : riskLevel === 'LOW'
          ? '#16a34a'
          : '#64748b',
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEvaluateLocation(userLocation[0], userLocation[1], addressInput);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
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
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Evaluate Location</span>
          </button>
        </form>

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
              : riskLevel === 'LOW'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-slate-50 border-slate-300 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={`w-8 h-8 flex-shrink-0 ${
                riskLevel === 'HIGH'
                  ? 'text-red-600'
                  : riskLevel === 'MEDIUM'
                  ? 'text-amber-600'
                  : riskLevel === 'LOW'
                  ? 'text-emerald-600'
                  : 'text-slate-500'
              }`}
            />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                KSDMA Hazard Exposure Status
              </span>
              <h2 className="text-2xl font-black">
                {riskLevel === 'UNAVAILABLE' ? 'DATA UNAVAILABLE' : `${riskLevel} RISK ZONE`}
              </h2>
            </div>
          </div>
          <p className="text-xs leading-relaxed font-medium">{riskReason}</p>
        </div>

        {/* Shelter Card */}
        {shelter ? (
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
                <span className="text-[11px] text-slate-400 block">Route Length</span>
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
        ) : (
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-center text-center">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Evacuation Corridor
              </span>
              <h3 className="text-base font-bold text-slate-800">
                {riskLevel === 'LOW'
                  ? 'No Designated Evacuation Corridor Needed'
                  : riskLevel === 'UNAVAILABLE'
                  ? 'Evacuation Guidance Unavailable'
                  : 'No Designated Evacuation Corridor Available'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {riskLevel === 'LOW'
                  ? 'This location is on elevated terrain outside active hazard inundation routes. For emergency inquiries, contact the Grama Panchayat Control Cell.'
                  : riskLevel === 'UNAVAILABLE'
                  ? 'Hazard-zone data is unavailable, so evacuation guidance cannot be determined. For emergency inquiries, contact the Grama Panchayat Control Cell.'
                  : 'No designated evacuation corridor is within 1.5 km of this location. Follow local emergency guidance and contact the Grama Panchayat Control Cell.'}
              </p>
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
          onMapClick={(lat, lng) =>
            handleEvaluateLocation(lat, lng, `Pinned Coordinate (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
          }
          height="420px"
        />

        <div className="text-[11px] text-slate-500 text-center">
          {primaryRoute
            ? `Green polyline marks the safest designated higher-ground route: ${primaryRoute.properties.name_en}.`
            : 'No active evacuation route line designated for this location.'}
        </div>
      </div>
    </div>
  );
}
