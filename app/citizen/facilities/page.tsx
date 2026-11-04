'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Hospital,
  School,
  GraduationCap,
  Baby,
  Building,
  Sprout,
  HeartPulse,
  Navigation,
  Phone,
  Filter,
  MapPin,
  Users,
  Crosshair,
  CheckCircle2,
  Clock,
  Car,
  Footprints,
  AlertCircle,
  ExternalLink,
  Search,
  Shield,
  Flame,
  Landmark,
  UtensilsCrossed,
  Info,
  X,
  FileText,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { InteractiveMap, MapMarker, MapLine } from '@/components/maps/InteractiveMap';
import { CitizenLocationBar } from '@/components/common/CitizenLocationBar';
import { Modal } from '@/components/common/Modal';
import { useCitizenLocation } from '@/lib/location-context';
import { discoverFacilitiesForOrigin, FacilityDiscoveryResult } from '@/lib/facility-discovery';
import { Facility } from '@/lib/types';
import { calculateDistanceKm } from '@/lib/calculations';

interface RouteInfo {
  distanceKm: number;
  driveTimeMin: number;
  walkTimeMin: number;
  coordinates: number[][]; // GeoJSON: [[lng, lat], ...]
  isLiveOsrm: boolean;
  steps: string[];
}

export default function FacilityFinderPage() {
  const { t, language, getLocalizedName } = useTranslation();
  const isMl = language === 'ml';

  // Shared Universal Location
  const {
    location,
    setManualLocation,
    isOutsideKunnamangalam,
    distanceFromKunnamangalamKm,
    resetToDemoLocation,
  } = useCitizenLocation();

  // Facility discovery state
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [discoveryMeta, setDiscoveryMeta] = useState<FacilityDiscoveryResult | null>(null);
  const [loadingFacilities, setLoadingFacilities] = useState<boolean>(true);

  // Filters & Selection
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  // Full Details Modal State
  const [facilityDetailsModal, setFacilityDetailsModal] = useState<Facility | null>(null);

  // Route state
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routingLoading, setRoutingLoading] = useState<boolean>(false);
  const [routingError, setRoutingError] = useState<string | null>(null);

  // Race condition guard refs
  const activeRequestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Discover facilities whenever departure origin coordinates change (Part 5)
  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    async function loadFacilities() {
      setLoadingFacilities(true);
      try {
        const result = await discoverFacilitiesForOrigin(
          location.lat,
          location.lng,
          controller.signal
        );
        if (!isCancelled) {
          setFacilities(result.facilities);
          setDiscoveryMeta(result);

          // Clear or auto-select destination when facility set refreshes
          if (result.facilities.length > 0) {
            setSelectedFacility(result.facilities[0]);
          } else {
            setSelectedFacility(null);
            setRouteInfo(null);
          }
        }
      } catch (err: any) {
        if (!isCancelled && err.name !== 'AbortError') {
          console.warn('Facility discovery error', err);
        }
      } finally {
        if (!isCancelled) {
          setLoadingFacilities(false);
        }
      }
    }

    loadFacilities();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [location.lat, location.lng]);

  // Centralized Route Generation with Race-Condition Protection (Part 3)
  const calculateRouteToFacility = useCallback(
    async (targetFacility: Facility) => {
      // Abort any existing in-flight OSRM request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const currentRequestId = ++activeRequestIdRef.current;

      setRoutingLoading(true);
      setRoutingError(null);

      const originLat = location.lat;
      const originLng = location.lng;
      const destLat = targetFacility.lat;
      const destLng = targetFacility.lng;
      const destName = isMl ? targetFacility.name_ml : targetFacility.name_en;

      const straightKm = calculateDistanceKm(originLat, originLng, destLat, destLng);
      const fallbackRoadKm = Math.round(straightKm * 1.28 * 10) / 10;
      const fallbackDriveMin = Math.max(1, Math.round((fallbackRoadKm / 30) * 60));
      const fallbackWalkMin = Math.max(2, Math.round((fallbackRoadKm / 4.5) * 60));

      // Intermediate curved path points for fallback
      const midLng = (originLng + destLng) / 2 + 0.0018;
      const midLat = (originLat + destLat) / 2;
      const fallbackCoords: number[][] = [
        [originLng, originLat],
        [midLng, midLat],
        [destLng, destLat],
      ];

      const fallbackSteps = [
        isMl
          ? `പുറപ്പെടുന്ന സ്ഥലത്തുനിന്ന് പ്രധാന റോഡിലേക്ക് പ്രവേശിക്കുക (${Math.round(fallbackRoadKm * 0.3 * 10) / 10} കി.മീ)`
          : `Depart origin and turn onto connecting road corridor (${Math.round(fallbackRoadKm * 0.3 * 10) / 10} km)`,
        isMl
          ? `${destName} ദിശയിലേക്ക് മുന്നോട്ട് പോവുക (${Math.round(fallbackRoadKm * 0.5 * 10) / 10} കി.മീ)`
          : `Proceed towards ${destName} (${Math.round(fallbackRoadKm * 0.5 * 10) / 10} km)`,
        isMl
          ? `${destName} പ്രവേശന കവാടത്തിൽ എത്തിച്ചേരുക`
          : `Arrive at ${destName} entrance gate`,
      ];

      try {
        // OSRM expects: /route/v1/driving/{lon},{lat};{lon},{lat} (Longitude before Latitude!)
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;

        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(osrmUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        // Discard response if a newer selection occurred in the meantime
        if (currentRequestId !== activeRequestIdRef.current) return;

        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const r = data.routes[0];
            const distKm = Math.round((r.distance / 1000) * 10) / 10;
            const driveMin = Math.max(1, Math.round(r.duration / 60));
            const walkMin = Math.max(2, Math.round((distKm / 4.5) * 60));
            const osrmCoords: number[][] = r.geometry.coordinates;

            const legSteps: string[] = [];
            if (r.legs && r.legs[0] && r.legs[0].steps) {
              r.legs[0].steps.slice(0, 5).forEach((st: any) => {
                if (st.name && st.name.trim()) {
                  legSteps.push(
                    isMl
                      ? `${st.name} വഴി ${Math.round(st.distance)} മീറ്റർ സഞ്ചരിക്കുക`
                      : `Follow ${st.name} for ${Math.round(st.distance)}m`
                  );
                }
              });
            }

            setRouteInfo({
              distanceKm: distKm,
              driveTimeMin: driveMin,
              walkTimeMin: walkMin,
              coordinates: osrmCoords,
              isLiveOsrm: true,
              steps: legSteps.length > 0 ? legSteps : fallbackSteps,
            });
            setRoutingLoading(false);
            return;
          }
        }
      } catch (err: any) {
        if (currentRequestId !== activeRequestIdRef.current) return;
        // Graceful fallback to offline road corridor
      }

      // Offline curvature fallback
      setRouteInfo({
        distanceKm: fallbackRoadKm,
        driveTimeMin: fallbackDriveMin,
        walkTimeMin: fallbackWalkMin,
        coordinates: fallbackCoords,
        isLiveOsrm: false,
        steps: fallbackSteps,
      });
      setRoutingError(
        isMl
          ? 'ലൈവ് OSRM കണക്ഷൻ ലഭ്യമല്ല. റോഡ് ശൃംഖലയുടെ ഏകദേശ പാത നൽകിയിരിക്കുന്നു.'
          : 'Live OSRM service unreachable. Showing approximate road corridor.'
      );
      setRoutingLoading(false);
    },
    [location.lat, location.lng, isMl]
  );

  // Centralized Destination Selection Logic (Called by all 4 interaction modes)
  const handleSelectDestination = useCallback(
    (facility: Facility) => {
      setSelectedFacility(facility);
      void calculateRouteToFacility(facility);
    },
    [calculateRouteToFacility]
  );

  // Recalculate route whenever selectedFacility changes or location shifts
  useEffect(() => {
    if (selectedFacility) {
      void calculateRouteToFacility(selectedFacility);
    }
  }, [location.lat, location.lng, selectedFacility, calculateRouteToFacility]);

  // 13+ Service Category Filter definitions
  const filterCategories = useMemo(
    () => [
      { id: 'all', label: t('services_filter_all'), matchTypes: [] },
      { id: 'hospital', label: t('services_filter_hospital'), matchTypes: ['phc', 'fhc', 'hospital', 'clinic'] },
      { id: 'pharmacy', label: t('services_filter_pharmacy'), matchTypes: ['pharmacy'] },
      { id: 'school', label: t('services_filter_school'), matchTypes: ['school', 'college'] },
      { id: 'anganwadi', label: isMl ? 'അങ്കണവാടികൾ' : 'Anganwadi', matchTypes: ['anganwadi'] },
      { id: 'police', label: t('services_filter_police'), matchTypes: ['police'] },
      { id: 'fire', label: t('services_filter_fire'), matchTypes: ['fire_station'] },
      { id: 'bank', label: t('services_filter_bank'), matchTypes: ['bank'] },
      { id: 'akshaya', label: t('services_filter_akshaya'), matchTypes: ['akshaya'] },
      { id: 'krishi', label: t('services_filter_krishi'), matchTypes: ['krishi'] },
      { id: 'vet', label: isMl ? 'മൃഗാശുപത്രികൾ' : 'Veterinary Hospital', matchTypes: ['vet'] },
      { id: 'restaurant', label: t('services_filter_restaurant'), matchTypes: ['restaurant'] },
      { id: 'gov', label: t('services_filter_gov'), matchTypes: ['gov_office'] },
      { id: 'public', label: t('services_filter_public'), matchTypes: ['public_facility'] },
    ],
    [t, isMl]
  );

  // Filter and sort facilities by distance from departure origin
  const filteredFacilities = useMemo(() => {
    const selected = filterCategories.find((c) => c.id === selectedCategory);
    let list = facilities;

    if (selected && selected.matchTypes.length > 0) {
      list = list.filter((f) => selected.matchTypes.includes(f.type));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.name_en.toLowerCase().includes(q) ||
          f.name_ml.toLowerCase().includes(q) ||
          f.type.toLowerCase().includes(q)
      );
    }

    return list
      .map((f) => {
        const straightKm = calculateDistanceKm(location.lat, location.lng, f.lat, f.lng);
        const roadKm = Math.round(straightKm * 1.28 * 10) / 10;
        return {
          ...f,
          straight_km: straightKm,
          road_km: roadKm,
          drive_min: Math.max(1, Math.round((roadKm / 30) * 60)),
        };
      })
      .sort((a, b) => a.road_km - b.road_km);
  }, [facilities, selectedCategory, searchQuery, location.lat, location.lng, filterCategories]);

  // Setup Map Markers
  const mapMarkers: MapMarker[] = useMemo(() => {
    return filteredFacilities.map((f) => {
      let color = '#2563eb';
      if (f.type === 'phc' || f.type === 'fhc' || f.type === 'hospital') color = '#dc2626';
      if (f.type === 'school' || f.type === 'college') color = '#16a34a';
      if (f.type === 'anganwadi') color = '#ea580c';
      if (f.type === 'krishi') color = '#ca8a04';
      if (f.type === 'vet') color = '#9333ea';
      if (f.type === 'police' || f.type === 'fire_station') color = '#b91c1c';
      if (f.type === 'bank') color = '#0284c7';

      return {
        id: `fac_${f.id}`,
        lat: f.lat,
        lng: f.lng,
        title: getLocalizedName(f),
        category: f.type.toUpperCase(),
        color,
        details: isMl
          ? `റോഡ് ദൂരം: ~${f.road_km} കി.മീ · ഫോൺ: ${f.contact_phone}`
          : `Road Distance: ~${f.road_km} km · Phone: ${f.contact_phone}`,
        source: f.source,
      };
    });
  }, [filteredFacilities, getLocalizedName, isMl]);

  // Departure origin pin
  const originMarker: MapMarker = useMemo(
    () => ({
      id: 'user_origin',
      lat: location.lat,
      lng: location.lng,
      title: isMl ? location.label_ml : location.label_en,
      category: isMl ? 'പുറപ്പെടുന്ന സ്ഥാനം' : 'Departure Origin',
      color: '#0284c7',
      details: `${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E`,
    }),
    [location.lat, location.lng, location.label_en, location.label_ml, isMl]
  );

  // Active Road Navigation Route Polyline
  const mapLines: MapLine[] = useMemo(() => {
    if (!routeInfo || !selectedFacility) return [];
    return [
      {
        id: `route_active_${selectedFacility.id}`,
        coordinates: routeInfo.coordinates,
        color: '#2563eb',
        label: isMl
          ? `${getLocalizedName(selectedFacility)} ലേക്കുള്ള റോഡ് പാത (~${routeInfo.distanceKm} കി.മീ)`
          : `Road Route to ${getLocalizedName(selectedFacility)} (~${routeInfo.distanceKm} km)`,
      },
    ];
  }, [routeInfo, selectedFacility, getLocalizedName, isMl]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('nav_facilities')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {t('services_desc')}
            </p>
          </div>
        </div>
        <SourceChip screenKey="facilities" />
      </div>

      {/* Universal Geolocation Origin Bar */}
      <CitizenLocationBar />

      {/* Discovery Status Banner (Part 5) */}
      {discoveryMeta && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-slate-700">
              {isMl ? 'ഡാറ്റാ സ്രോതസ്സ്:' : 'Data Source:'}{' '}
              <strong className="text-slate-900">{discoveryMeta.sourceDescription}</strong>
            </span>
          </div>

          {discoveryMeta.isDemo && isOutsideKunnamangalam && (
            <button
              onClick={() => resetToDemoLocation()}
              className="text-xs font-bold text-coconut-700 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isMl ? 'കുന്നമംഗലം മാതൃകയിലേക്ക് മാറ്റുക' : 'Switch Origin to Kunnamangalam'}</span>
            </button>
          )}
        </div>
      )}

      {/* Honest Error Notice when outside facilities cannot be found */}
      {discoveryMeta?.error && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{discoveryMeta.error}</p>
            <p className="text-[11px] text-amber-800">
              {isMl
                ? 'കുന്നമംഗലം ഗ്രാമപഞ്ചായത്തിലെ മാതൃകാ കേന്ദ്രങ്ങൾ കാണാൻ താഴെയുള്ള ബട്ടൺ അമർത്തുക.'
                : 'You can switch back to the Kunnamangalam demonstration area to view verified demo facilities.'}
            </p>
            <button
              onClick={() => resetToDemoLocation()}
              className="mt-1 px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-[11px]"
            >
              {isMl ? 'കുന്നമംഗലത്തേക്ക് മടങ്ങുക' : 'Return to Kunnamangalam Demo'}
            </button>
          </div>
        </div>
      )}

      {/* Search Input & 13+ Category Filter Chips */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('services_search_placeholder')}
              className="w-full pl-9 p-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-coconut-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1 mr-1 text-[11px]">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>{isMl ? 'വിഭാഗം:' : 'Category:'}</span>
          </span>

          {filterCategories.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedCategory(item.id)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                selectedCategory === item.id
                  ? 'bg-coconut-700 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Map with Road Route + Facility Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* Left: Interactive Map with Individual Route Rendering */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-coconut-700" />
              <span>{t('services_road_route')}</span>
            </h3>
            <span className="text-slate-500 font-mono text-[11px]">
              {filteredFacilities.length} {isMl ? 'കേന്ദ്രങ്ങൾ' : 'Facilities'}
            </span>
          </div>

          <InteractiveMap
            center={[location.lat, location.lng]}
            zoom={14}
            markers={[originMarker, ...mapMarkers]}
            lines={mapLines}
            selectedMarkerId={selectedFacility ? `fac_${selectedFacility.id}` : null}
            fitBoundsToLines={true}
            onMarkerClick={(markerId) => {
              // Mode 1: Clicking Map Marker selects destination & calculates route
              const idStr = String(markerId);
              if (idStr.startsWith('fac_')) {
                const facId = Number(idStr.replace('fac_', ''));
                const target = facilities.find((f) => f.id === facId);
                if (target) {
                  handleSelectDestination(target);
                }
              }
            }}
            onMapClick={(lat, lng) => {
              // Allows manual departure pin placement
              setManualLocation(lat, lng);
            }}
            height="460px"
          />

          <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1">
            <span className="font-semibold text-slate-700">
              {isMl
                ? 'മാപ്പിലെ കേന്ദ്രങ്ങളിൽ തൊട്ട് റൂട്ട് കാണാം.'
                : 'Tap any facility marker to draw its road route.'}
            </span>
            <span className="text-slate-500">
              {isMl ? 'മാപ്പിൽ തൊട്ട് സ്ഥാനം മാറ്റാം.' : 'Tap map to shift departure point.'}
            </span>
          </div>

          {/* Routing Error Notice */}
          {routingError && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>{routingError}</span>
            </div>
          )}

          {/* Honest Traffic Disclosure */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {t('services_traffic_disclaimer')}
            </p>
          </div>
        </div>

        {/* Right: Active Destination Details & Facility Directory */}
        <div className="space-y-4 min-w-0">
          {/* Active Facility Card */}
          {selectedFacility ? (
            <div className="p-5 bg-gradient-to-r from-coconut-900 via-emerald-950 to-slate-950 text-white rounded-2xl shadow-md border border-coconut-800 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-coconut-300 bg-coconut-950/80 px-2 py-0.5 rounded border border-coconut-700">
                      {isMl ? 'തിരഞ്ഞെടുത്ത ലക്ഷ്യസ്ഥാനം' : 'Active Destination'}
                    </span>
                    {routingLoading && (
                      <span className="text-[10px] text-coconut-400 animate-pulse font-mono">
                        {isMl ? 'റൂട്ട് കണക്കാക്കുന്നു...' : 'Routing...'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black mt-1 leading-snug">
                    {getLocalizedName(selectedFacility)}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {isMl
                      ? `തരം: ${selectedFacility.type.toUpperCase()} · ${selectedFacility.ward_id > 0 ? `വാർഡ് ${selectedFacility.ward_id}` : 'മേഖല'}`
                      : `Category: ${selectedFacility.type.toUpperCase()} · ${selectedFacility.ward_id > 0 ? `Ward ${selectedFacility.ward_id}` : 'Region'}`}
                  </p>
                </div>

                {routeInfo && (
                  <div className="text-right flex-shrink-0">
                    <span className="text-2xl font-black text-coconut-300 block">
                      ~{routeInfo.distanceKm} {isMl ? 'കി.മീ' : 'km'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {t('services_road_distance')}
                    </span>
                  </div>
                )}
              </div>

              {/* Travel Time Stats */}
              {routeInfo && (
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-coconut-800/80">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-coconut-800/60 flex items-center gap-2">
                    <Car className="w-4 h-4 text-coconut-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        {isMl ? 'വാഹന യാത്ര' : 'Drive Time'}
                      </span>
                      <strong className="text-white font-bold text-xs">
                        ~{routeInfo.driveTimeMin} {isMl ? 'മിനിറ്റ്' : 'min'}
                      </strong>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-coconut-800/60 flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        {isMl ? 'നടത്തം (ഏകദേശം)' : 'Walk Estimate'}
                      </span>
                      <strong className="text-white font-bold text-xs">
                        ~{routeInfo.walkTimeMin} {isMl ? 'മിനിറ്റ്' : 'min'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Route Summary Steps */}
              {routeInfo && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-coconut-300 uppercase tracking-wider">
                      {t('services_route_steps')}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {routeInfo.isLiveOsrm ? 'OSRM Live' : 'Network Fallback'}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-300">
                    {routeInfo.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-coconut-400 font-bold">•</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Operational & Contact Info */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-coconut-800/80">
                <div className="p-2 bg-slate-900/80 rounded-lg border border-coconut-800/60">
                  <span className="text-slate-400 block text-[10px]">
                    {isMl ? 'ജീവനക്കാർ' : 'Staffing'}
                  </span>
                  <strong className="text-white">
                    {selectedFacility.staff_filled > 0
                      ? `${selectedFacility.staff_filled} / ${selectedFacility.staff_sanctioned}`
                      : 'Verified Local Unit'}
                  </strong>
                </div>

                <div className="p-2 bg-slate-900/80 rounded-lg border border-coconut-800/60">
                  <span className="text-slate-400 block text-[10px]">
                    {isMl ? 'ഹെൽപ്പ്‌ലൈൻ ഫോൺ' : 'Helpline'}
                  </span>
                  <a
                    href={`tel:${selectedFacility.contact_phone}`}
                    className="text-coconut-300 font-mono font-bold hover:underline block truncate"
                  >
                    {selectedFacility.contact_phone}
                  </a>
                </div>
              </div>

              {/* Action Buttons: Full Details Modal Trigger (Part 2) */}
              <div className="pt-2 flex items-center justify-between border-t border-coconut-800/80">
                <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                  {selectedFacility.source}
                </span>

                <button
                  type="button"
                  onClick={() => setFacilityDetailsModal(selectedFacility)}
                  className="px-3.5 py-1.5 bg-coconut-700 hover:bg-coconut-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isMl ? 'സമ്പൂർണ്ണ വിവരങ്ങൾ' : 'Full Details'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              {isMl ? 'സേവന കേന്ദ്രം തിരഞ്ഞെടുക്കുക' : 'Select a facility to view road route and full details'}
            </div>
          )}

          {/* Facility List Sorted by Proximity */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {isMl
                  ? 'സമീപ സേവന കേന്ദ്രങ്ങൾ (റോഡ് ദൂര ക്രമത്തിൽ)'
                  : 'Public Facilities by Road Distance'}
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {filteredFacilities.length} {isMl ? 'ലഭ്യം' : 'found'}
              </span>
            </div>

            {loadingFacilities ? (
              <p className="text-xs text-slate-500 text-center py-6 animate-pulse">
                {isMl ? 'സേവന കേന്ദ്രങ്ങൾ തിരയുന്നു...' : 'Discovering public facilities around origin...'}
              </p>
            ) : filteredFacilities.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-slate-500">
                  {isMl
                    ? 'തിരഞ്ഞെടുത്ത വിഭാഗത്തിൽ സേവന കേന്ദ്രങ്ങൾ ലഭ്യമല്ല.'
                    : 'No public facilities found matching your search or location.'}
                </p>
                {isOutsideKunnamangalam && (
                  <button
                    onClick={() => resetToDemoLocation()}
                    className="px-3 py-1.5 bg-coconut-700 hover:bg-coconut-600 text-white text-xs font-bold rounded-lg"
                  >
                    {isMl ? 'കുന്നമംഗലം മാതൃകാ ലിസ്റ്റ് കാണുക' : 'View Kunnamangalam Demo Records'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredFacilities.map((fac) => {
                  const isSelected = selectedFacility?.id === fac.id;
                  return (
                    <div
                      key={fac.id}
                      onClick={() => handleSelectDestination(fac)}
                      className={`p-3.5 rounded-xl border text-xs space-y-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-coconut-50 border-coconut-400 shadow-sm ring-1 ring-coconut-400'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {getLocalizedName(fac)}
                          </h4>
                          <span className="text-[10px] uppercase font-bold text-coconut-800 bg-coconut-100 px-1.5 py-0.5 rounded">
                            {fac.type}
                          </span>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs block">
                            ~{fac.road_km} {isMl ? 'കി.മീ' : 'km'}
                          </span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">
                            ~{fac.drive_min} {isMl ? 'മിനിറ്റ്' : 'min'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{fac.contact_phone}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDestination(fac);
                            setFacilityDetailsModal(fac);
                          }}
                          className="text-coconut-700 hover:text-coconut-900 font-bold hover:underline"
                        >
                          {isMl ? 'വിശദാംശങ്ങൾ' : 'Full Details'} &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULL DETAILS MODAL FOR FACILITIES (Part 2) */}
      {facilityDetailsModal && (
        <Modal
          isOpen={!!facilityDetailsModal}
          onClose={() => setFacilityDetailsModal(null)}
          badge={
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-coconut-800 bg-coconut-100 px-2 py-0.5 rounded">
                {facilityDetailsModal.type}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                ID: {facilityDetailsModal.id}
              </span>
            </div>
          }
          title={getLocalizedName(facilityDetailsModal)}
          subtitle={
            facilityDetailsModal.ward_id > 0
              ? isMl
                ? `കുന്നമംഗലം ഗ്രാമപഞ്ചായത്ത് · വാർഡ് ${facilityDetailsModal.ward_id}`
                : `Kunnamangalam Grama Panchayat · Ward ${facilityDetailsModal.ward_id}`
              : facilityDetailsModal.source
          }
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
              {/* Distance and Travel Summary */}
              {routeInfo && (
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div>
                    <span className="text-slate-500 text-[10px] block">{isMl ? 'റോഡ് ദൂരം' : 'Road Distance'}</span>
                    <strong className="text-sm font-black text-slate-900">~{routeInfo.distanceKm} km</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">{isMl ? 'വാഹന യാത്ര' : 'Drive Time'}</span>
                    <strong className="text-sm font-black text-coconut-700">~{routeInfo.driveTimeMin} min</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">{isMl ? 'നടത്തം (ഏകദേശം)' : 'Walk Estimate'}</span>
                    <strong className="text-sm font-black text-slate-700">~{routeInfo.walkTimeMin} min</strong>
                  </div>
                </div>
              )}

              {/* Operational Specs Grid */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[10px] block">{isMl ? 'പ്രവർത്തന പദവി' : 'Operational Status'}</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isMl ? 'പ്രവർത്തനസജ്ജം' : 'Operational / Active'}</span>
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] block">{isMl ? 'ഹെൽപ്പ്‌ലൈൻ ഫോൺ' : 'Helpline Phone'}</span>
                  <a
                    href={`tel:${facilityDetailsModal.contact_phone}`}
                    className="font-bold text-coconut-700 font-mono text-xs hover:underline block mt-0.5"
                  >
                    {facilityDetailsModal.contact_phone}
                  </a>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] block">{isMl ? 'ജീവനക്കാരുടെ എണ്ണം' : 'Staff Deployment'}</span>
                  <strong className="text-slate-900 text-xs">
                    {facilityDetailsModal.staff_filled > 0
                      ? `${facilityDetailsModal.staff_filled} / ${facilityDetailsModal.staff_sanctioned}`
                      : 'Local Authority Supervised'}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] block">{isMl ? 'ഭൂമിശാസ്ത്ര കോർഡിനേറ്റുകൾ' : 'Coordinates'}</span>
                  <strong className="text-slate-900 font-mono text-[11px]">
                    {facilityDetailsModal.lat.toFixed(4)}° N, {facilityDetailsModal.lng.toFixed(4)}° E
                  </strong>
                </div>

                <div className="col-span-2 pt-1 border-t border-slate-200">
                  <span className="text-slate-500 text-[10px] block">{isMl ? 'ഔദ്യോഗിക ഡാറ്റാ സ്രോതസ്സ്' : 'Authoritative Data Source'}</span>
                  <strong className="text-slate-800 text-xs">{facilityDetailsModal.source}</strong>
                </div>
              </div>

              {/* Embedded Mini-Map showing Facility & Route with Automatic Dimension Invalidation */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-coconut-700" />
                  <span>{isMl ? 'സ്ഥലവും റോഡ് പാതയും' : 'Facility Location & Route'}</span>
                </h4>
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner min-w-0 w-full">
                  <InteractiveMap
                    center={[facilityDetailsModal.lat, facilityDetailsModal.lng]}
                    zoom={15}
                    markers={[
                      originMarker,
                      {
                        id: `modal_fac_${facilityDetailsModal.id}`,
                        lat: facilityDetailsModal.lat,
                        lng: facilityDetailsModal.lng,
                        title: getLocalizedName(facilityDetailsModal),
                        category: facilityDetailsModal.type.toUpperCase(),
                        color: '#dc2626',
                      },
                    ]}
                    lines={mapLines}
                    fitBoundsToLines={true}
                    height="200px"
                  />
                </div>
              </div>

              {/* Turn-by-Turn Directions List */}
              {routeInfo && routeInfo.steps.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <h4 className="font-bold text-slate-800 text-xs">
                    {isMl ? 'റൂട്ട് നിർദ്ദേശങ്ങൾ' : 'Route Navigation Steps'}
                  </h4>
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {routeInfo.steps.map((st, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-slate-700">
                        <span className="font-bold text-coconut-700 min-w-[14px]">{i + 1}.</span>
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setFacilityDetailsModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 text-xs"
              >
                {isMl ? 'അടയ്ക്കുക' : 'Close'}
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectDestination(facilityDetailsModal);
                  setFacilityDetailsModal(null);
                }}
                className="px-4 py-2 bg-coconut-700 hover:bg-coconut-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{isMl ? 'പ്രധാന മാപ്പിൽ കാണുക' : 'View Route on Main Map'}</span>
              </button>
            </div>
        </Modal>
      )}
    </div>
  );
}
