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
  const { t, language } = useTranslation();
  const isMl = language === 'ml';

  const [hazardZones, setHazardZones] = useState<HazardZoneCollection | null>(null);
  const [evacRoutes, setEvacRoutes] = useState<EvacuationRouteCollection | null>(null);
  const [loading, setLoading] = useState(true);

  // Citizen address & pin state (default Ward 7 near river)
  const [addressInput, setAddressInput] = useState(
    isMl ? 'ചാലിയാർ പുഴയോരം, വാർഡ് 7, ചെറുവണ്ണൂർ' : 'Chaliyar Riverside, Ward 7, Cheruvannur'
  );
  const [userLocation, setUserLocation] = useState<[number, number]>([11.3038, 75.8835]);
  const [riskLevel, setRiskLevel] = useState<'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE'>('HIGH');
  const [riskReason, setRiskReason] = useState(
    isMl
      ? 'സ്ഥലം ചാലിയാർ റിവർ ബേസിൻ അതിതീവ്ര വെള്ളപ്പൊക്ക മേഖലയിൽ (KSDMA കാറ്റഗറി 1) നേരിട്ട് ഉൾപ്പെടുന്നു. കാലവർഷത്തിൽ 1.5 മീറ്ററിലധികം വെള്ളപ്പൊക്ക സാധ്യത.'
      : 'Location falls directly inside the Chaliyar River Basin High Flood Zone (KSDMA Category 1). Annual monsoon inundation risk exceeds 1.5m.'
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
      setRiskReason(
        isMl
          ? 'ദുരന്ത സാധ്യതാ വിവരങ്ങൾ താൽക്കാലികമായി ലഭ്യമല്ല.'
          : 'Hazard zone spatial data is temporarily unavailable. Unable to determine exposure.'
      );
      return;
    }

    // Derive deterministic hazard risk using isPointInPolygon on bundled KSDMA hazard polygons
    let matchedRisk: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    let matchedReason = isMl
      ? 'വെള്ളപ്പൊക്ക സാധ്യതാ മേഖലയ്ക്ക് പുറത്തുള്ള ഉയർന്ന പ്രദേശം. ചരിത്രപരമായി പ്രളയ സാധ്യത കുറവ്.'
      : 'Elevated dry land terrace outside active flood inundation contours and steep slopes. Minimal historic flood exposure.';

    for (const hz of hazardZones.features) {
      const polyCoords = hz.geometry.coordinates[0];
      if (isPointInPolygon([lng, lat], polyCoords)) {
        const zoneName = isMl ? hz.properties.name_ml : hz.properties.name_en;
        if (hz.properties.hazard_type === 'flood_high') {
          matchedRisk = 'HIGH';
          matchedReason = isMl
            ? `സ്ഥലം ${zoneName} (${hz.properties.severity}) മേഖലയിൽ നേരിട്ട് ഉൾപ്പെടുന്നു. 1.5 മീറ്ററിലധികം വെള്ളപ്പൊക്ക സാധ്യത.`
            : `Location falls directly inside ${zoneName} (${hz.properties.severity}). Annual monsoon inundation risk exceeds 1.5m.`;
          break;
        } else if (hz.properties.hazard_type === 'landslide') {
          matchedRisk = 'MEDIUM';
          matchedReason = isMl
            ? `സ്ഥലം ${zoneName} (${hz.properties.severity}) മേഖലയിലാണ്. ശക്തമായ മഴയിൽ ഉരുൾപൊട്ടൽ സാധ്യത.`
            : `Location lies in ${zoneName} (${hz.properties.severity}). Moderate landslide runoff warning during orange alert rainfall.`;
          break;
        } else if (hz.properties.hazard_type === 'flood_med') {
          matchedRisk = 'MEDIUM';
          matchedReason = isMl
            ? `സ്ഥലം ${zoneName} (${hz.properties.severity}) മേഖലയിലാണ്. കനത്ത മഴയിൽ വെള്ളക്കെട്ടിന് സാധ്യത.`
            : `Location lies in ${zoneName} (${hz.properties.severity}). Waterlogging risk during heavy rainfall events.`;
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
  const shelterName = shelter ? (isMl ? shelter.shelter_name_ml : shelter.shelter_name_en) : '';

  // Map elements
  const mapPolygons =
    hazardZones?.features.map((hz) => ({
      id: hz.properties.id,
      coordinates: hz.geometry.coordinates,
      color: hz.properties.color,
      label: `${isMl ? hz.properties.name_ml : hz.properties.name_en} (${hz.properties.severity})`,
      fillOpacity: 0.3,
    })) || [];

  const mapLines = primaryRoute
    ? [
        {
          id: primaryRoute.properties.id,
          coordinates: primaryRoute.geometry.coordinates,
          color: '#16a34a',
          label: `${t('evac_corridor')}: ${isMl ? primaryRoute.properties.name_ml : primaryRoute.properties.name_en}`,
        },
      ]
    : [];

  const mapMarkers = [
    {
      id: 'citizen_house',
      lat: userLocation[0],
      lng: userLocation[1],
      title: t('your_location'),
      category: `${t('hazard_exposure')}: ${riskLevel}`,
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
            title: shelterName,
            category: t('designated_relief_camp'),
            color: '#16a34a',
            details: `${t('capacity_persons')}: ${shelter.shelter_capacity} · ${t('helpdesk_contact')}: ${shelter.shelter_contact}`,
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
              {t('citizen_hazard_subtitle')}
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
              placeholder={t('enter_residence_address')}
              className="w-full pl-9 p-2.5 bg-slate-50 rounded-lg border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <span>{t('evaluate_location')}</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-slate-500 font-semibold">{t('test_sample_locations')}</span>
          <button
            onClick={() =>
              handleEvaluateLocation(
                11.3038,
                75.8835,
                isMl ? 'ചാലിയാർ പുഴയോരം, വാർഡ് 7 (ചെറുവണ്ണൂർ)' : 'Chaliyar Riverside, Ward 7 (Cheruvannur)'
              )
            }
            className="px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-900 font-bold"
          >
            {t('sample_ward7_riverbank')}
          </button>
          <button
            onClick={() =>
              handleEvaluateLocation(
                11.332,
                75.879,
                isMl ? 'കോട്ടക്കുന്ന് കുന്നിൻചെരിവ്, വാർഡ് 8' : 'Kottakkunnu Hill Slopes, Ward 8'
              )
            }
            className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold"
          >
            {t('sample_ward8_hillslope')}
          </button>
          <button
            onClick={() =>
              handleEvaluateLocation(
                11.285,
                75.862,
                isMl ? 'വെള്ളിപറമ്പ് ഉയർന്ന പ്രദേശം, വാർഡ് 11' : 'Velliparamba Elevated Terrace, Ward 11'
              )
            }
            className="px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold"
          >
            {t('sample_ward11_highland')}
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
                {t('ksdma_exposure_status')}
              </span>
              <h2 className="text-2xl font-black">
                {riskLevel === 'UNAVAILABLE' ? t('data_unavailable_title') : `${riskLevel} ${t('risk_zone_suffix')}`}
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
                {t('nearest_shelter_label')}
              </span>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {shelterName}
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div>
                <span className="text-[11px] text-slate-400 block">{t('route_length')}</span>
                <strong className="text-slate-900 font-bold">{shelterDistance} km</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">{t('capacity_persons')}</span>
                <strong className="text-slate-900 font-bold">{shelter.shelter_capacity}</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">{t('helpdesk_contact')}</span>
                <strong className="text-blue-700 font-mono font-bold">2884101</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-center text-center">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {t('evac_corridor')}
              </span>
              <h3 className="text-base font-bold text-slate-800">
                {riskLevel === 'LOW'
                  ? t('no_evac_corridor_needed')
                  : riskLevel === 'UNAVAILABLE'
                  ? t('evac_guidance_unavailable')
                  : t('no_evac_corridor_available')}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {riskLevel === 'LOW'
                  ? t('evac_low_risk_msg')
                  : riskLevel === 'UNAVAILABLE'
                  ? t('evac_unavail_msg')
                  : t('evac_no_route_msg')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Map with House Pin, Hazard Polygon, Shelter, and Route */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between text-xs">
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-emerald-600" />
            <span>{t('evac_nav_title')}</span>
          </h3>
          <span className="text-slate-500 font-mono">
            {t('ksdma_flood_model_sub')}
          </span>
        </div>

        <InteractiveMap
          center={userLocation}
          zoom={15}
          polygons={mapPolygons}
          lines={mapLines}
          markers={mapMarkers}
          onMapClick={(lat, lng) =>
            handleEvaluateLocation(lat, lng, `${t('map_selected_location')} (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
          }
          height="420px"
        />

        <div className="text-[11px] text-slate-500 text-center">
          {primaryRoute
            ? `${t('green_route_info')} ${isMl ? primaryRoute.properties.name_ml : primaryRoute.properties.name_en}.`
            : t('no_active_route_info')}
        </div>
      </div>
    </div>
  );
}
