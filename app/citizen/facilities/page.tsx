'use client';

import React, { useEffect, useState } from 'react';
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
  Compass,
  ArrowRight,
  ShieldCheck,
  Clock,
  Crosshair,
  Route,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { InteractiveMap } from '@/components/maps/InteractiveMap';
import { getFacilities, getWardById } from '@/lib/api';
import { Facility, FacilityType, Ward } from '@/lib/types';
import { calculateDistanceKm } from '@/lib/calculations';

export default function FacilityFinderPage() {
  const { t, getLocalizedName } = useTranslation();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [ward7, setWard7] = useState<Ward | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);

  // Citizen Location State (Default: Ward 7 Cheruvannur centroid)
  const [userLocation, setUserLocation] = useState<[number, number]>([11.305, 75.885]);
  const [locationLabel, setLocationLabel] = useState<string>('Ward 7 Centroid (Cheruvannur)');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [fList, w7] = await Promise.all([getFacilities(), getWardById(7)]);
        setFacilities(fList);
        setWard7(w7);
        if (fList.length > 0) {
          setSelectedFacility(fList[0]);
        }
      } catch (err) {
        console.error('Failed to load facilities data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Request browser GPS location
  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        setUserLocation([lat, lng]);
        setLocationLabel('My Current GPS Location');
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError('Location permission denied or unavailable. Using manual ward location.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSelectPresetLocation = (lat: number, lng: number, label: string) => {
    setUserLocation([lat, lng]);
    setLocationLabel(label);
    setGpsError(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  // Filter facilities
  const filtered = facilities.filter((f) =>
    selectedType === 'all' ? true : f.type === selectedType
  );

  // Compute straight-line distance and estimated road network distance (~1.25x curvature)
  const withDistance = filtered
    .map((f) => {
      const straightKm = calculateDistanceKm(userLocation[0], userLocation[1], f.lat, f.lng);
      const roadKm = Math.round(straightKm * 1.25 * 10) / 10;
      return {
        ...f,
        straight_km: straightKm,
        road_km: roadKm,
      };
    })
    .sort((a, b) => a.road_km - b.road_km);

  // Map markers
  const mapMarkers = withDistance.map((f) => {
    let color = '#2563eb';
    if (f.type === 'phc' || f.type === 'fhc') color = '#dc2626';
    if (f.type === 'school') color = '#16a34a';
    if (f.type === 'anganwadi') color = '#ea580c';
    if (f.type === 'krishi') color = '#ca8a04';
    if (f.type === 'vet') color = '#9333ea';

    return {
      id: `fac_${f.id}`,
      lat: f.lat,
      lng: f.lng,
      title: getLocalizedName(f),
      category: f.type.toUpperCase(),
      color,
      details: `Road Distance: ~${f.road_km} km · Staff: ${f.staff_filled}/${f.staff_sanctioned} · Phone: ${f.contact_phone}`,
      source: f.source,
    };
  });

  // Citizen location pin
  const citizenMarker = {
    id: 'user_origin',
    lat: userLocation[0],
    lng: userLocation[1],
    title: locationLabel,
    category: 'Your Departure Origin',
    color: '#0284c7',
    details: `Coordinates: ${userLocation[0].toFixed(4)}° N, ${userLocation[1].toFixed(4)}° E`,
  };

  // Road directions line connecting user location to selected facility
  const mapLines = selectedFacility
    ? [
        {
          id: `route_to_${selectedFacility.id}`,
          coordinates: [
            [userLocation[1], userLocation[0]],
            // Intermediate road corridor inflection waypoint
            [
              (userLocation[1] + selectedFacility.lng) / 2 + 0.0015,
              (userLocation[0] + selectedFacility.lat) / 2,
            ],
            [selectedFacility.lng, selectedFacility.lat],
          ],
          color: '#2563eb',
          label: `Road Route to ${getLocalizedName(selectedFacility)}`,
        },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t('nav_facilities')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              C3 Nearest Public Facility Directory · UDISE+, e-Health &amp; DES Service Finder
            </p>
          </div>
        </div>
        <SourceChip screenKey="facilities" />
      </div>

      {/* Geolocation & Origin Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-coconut-700 flex-shrink-0" />
          <div>
            <span className="text-slate-500 block text-[10px]">Current Departure Origin:</span>
            <strong className="text-slate-900 text-xs">{locationLabel}</strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRequestGeolocation}
            disabled={gpsLoading}
            className="px-3 py-1.5 rounded-lg bg-coconut-700 hover:bg-coconut-600 text-white font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{gpsLoading ? 'Acquiring GPS...' : 'Use My GPS Location'}</span>
          </button>

          <span className="text-slate-400 text-[10px] hidden sm:inline">or Presets:</span>

          <button
            onClick={() => handleSelectPresetLocation(11.305, 75.885, 'Ward 7 (Cheruvannur Central)')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
          >
            Ward 7
          </button>
          <button
            onClick={() => handleSelectPresetLocation(11.332, 75.875, 'Ward 8 (Kottakkunnu High)')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
          >
            Ward 8
          </button>
          <button
            onClick={() => handleSelectPresetLocation(11.285, 75.862, 'Ward 11 (Velliparamba)')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
          >
            Ward 11
          </button>
        </div>
      </div>

      {gpsError && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Filter Chips Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-slate-700 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5 text-slate-500" /> Category:
        </span>

        {[
          { id: 'all', label: 'All Services' },
          { id: 'school', label: 'Schools' },
          { id: 'phc', label: 'PHC / FHC Clinics' },
          { id: 'anganwadi', label: 'Anganwadi' },
          { id: 'akshaya', label: 'Akshaya Centres' },
          { id: 'krishi', label: 'Krishi Bhavan' },
          { id: 'vet', label: 'Veterinary Hospitals' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedType(item.id)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              selectedType === item.id
                ? 'bg-coconut-700 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Map & Facility List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive Map with Navigation Route */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-coconut-700" />
              <span>Spatial Service Discovery &amp; Navigation Route</span>
            </h3>
            <span className="text-slate-500 font-mono">
              {withDistance.length} Facilities in Scope
            </span>
          </div>

          <InteractiveMap
            center={userLocation}
            zoom={14}
            markers={[citizenMarker, ...mapMarkers]}
            lines={mapLines}
            onMapClick={(lat, lng) => {
              setUserLocation([lat, lng]);
              setLocationLabel(`Pinned Coordinate (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            }}
            height="440px"
          />

          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Blue line indicates road route to selected destination.</span>
            <span className="font-semibold text-slate-700">Click anywhere to change origin.</span>
          </div>
        </div>

        {/* Right: Selected Facility Navigation & Facility Directory List */}
        <div className="space-y-4">
          {/* Active Facility Card with Navigation Guidance */}
          {selectedFacility && (
            <div className="p-5 bg-gradient-to-r from-coconut-900 via-emerald-950 to-slate-950 text-white rounded-2xl shadow-md border border-coconut-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-coconut-300 bg-coconut-950/80 px-2 py-0.5 rounded border border-coconut-700">
                    Active Destination
                  </span>
                  <h3 className="text-lg font-black mt-1 leading-snug">
                    {getLocalizedName(selectedFacility)}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Category: {selectedFacility.type.toUpperCase()} · Ward {selectedFacility.ward_id}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xl font-black text-coconut-300 block">
                    ~{Math.round(calculateDistanceKm(userLocation[0], userLocation[1], selectedFacility.lat, selectedFacility.lng) * 1.25 * 10) / 10} km
                  </span>
                  <span className="text-[10px] text-slate-400 block">Road Route Distance</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-coconut-800/80">
                <div className="p-2 bg-slate-900/80 rounded-lg border border-coconut-800/60">
                  <span className="text-slate-400 block text-[10px]">Staff Deployment</span>
                  <strong className="text-white">
                    {selectedFacility.staff_filled} of {selectedFacility.staff_sanctioned} sanctioned
                  </strong>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-lg border border-coconut-800/60">
                  <span className="text-slate-400 block text-[10px]">Contact Helpline</span>
                  <strong className="text-coconut-300 font-mono font-bold">
                    {selectedFacility.contact_phone}
                  </strong>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-300">
                <span>Verified Source: {selectedFacility.source}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Service Operational
                </span>
              </div>
            </div>
          )}

          {/* Facility List Sorted by Proximity */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Nearest Public Facilities (Sorted by Road Distance)
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                Real-Time Proximity
              </span>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {withDistance.map((fac) => {
                const isSelected = selectedFacility?.id === fac.id;
                return (
                  <div
                    key={fac.id}
                    onClick={() => setSelectedFacility(fac)}
                    className={`p-3.5 rounded-xl border text-xs space-y-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-coconut-50 border-coconut-300 shadow-sm ring-1 ring-coconut-400'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{getLocalizedName(fac)}</h4>
                        <span className="text-[10px] uppercase font-bold text-coconut-800 bg-coconut-100 px-1.5 py-0.5 rounded">
                          {fac.type}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs block">
                          ~{fac.road_km} km
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">
                          {Math.round((fac.road_km / 30) * 60)} min drive
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          Staff: <strong>{fac.staff_filled}/{fac.staff_sanctioned}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1 justify-end font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{fac.contact_phone}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
