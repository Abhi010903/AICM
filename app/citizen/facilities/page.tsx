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
  const [loading, setLoading] = useState(true);

  // Default origin: Ward 7 Cheruvannur centroid
  const originLat = 11.305;
  const originLng = 75.885;

  useEffect(() => {
    async function load() {
      try {
        const [fList, w7] = await Promise.all([getFacilities(), getWardById(7)]);
        setFacilities(fList);
        setWard7(w7);
      } catch (err) {
        console.error('Failed to load facilities data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  // Filter facilities
  const filtered = facilities.filter((f) =>
    selectedType === 'all' ? true : f.type === selectedType
  );

  // Compute distance for each and sort ascending
  const withDistance = filtered
    .map((f) => ({
      ...f,
      distance_km: calculateDistanceKm(originLat, originLng, f.lat, f.lng),
    }))
    .sort((a, b) => a.distance_km - b.distance_km);

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
      details: `Distance: ${f.distance_km} km · Staff: ${f.staff_filled}/${f.staff_sanctioned} (${f.contact_phone})`,
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('nav_facilities')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              C3 Nearest Facility Finder · UDISE+, DES & e-Health Service Directory
            </p>
          </div>
        </div>
        <SourceChip screenKey="facilities" />
      </div>

      {/* Filter Chips Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>

        {[
          { id: 'all', label: 'All Services' },
          { id: 'school', label: 'Schools' },
          { id: 'phc', label: 'PHC / FHC' },
          { id: 'anganwadi', label: 'Anganwadi' },
          { id: 'akshaya', label: 'Akshaya' },
          { id: 'krishi', label: 'Krishi Bhavan' },
          { id: 'vet', label: 'Veterinary' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedType(item.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              selectedType === item.id
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Map & Facility List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive Map Centred on Ward 7 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span>Centred on Ward 7 (Cheruvannur)</span>
            </h3>
            <span className="text-slate-500 font-mono">
              Displaying {withDistance.length} facilities
            </span>
          </div>

          <InteractiveMap
            center={[originLat, originLng]}
            zoom={14}
            markers={mapMarkers}
            selectedPoint={[originLat, originLng]}
            height="440px"
          />

          <div className="text-[11px] text-slate-500">
            Distances computed from Ward 7 Centroid (11.305° N, 75.885° E) via Haversine calculation.
          </div>
        </div>

        {/* Right: Facility List with Distance & Staffing */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              Nearest Facilities (Sorted by Distance)
            </h3>
            <span className="text-xs text-slate-500">
              Staffing & Contact Verified
            </span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {withDistance.map((fac) => (
              <div
                key={fac.id}
                className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs space-y-2 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{getLocalizedName(fac)}</h4>
                    <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      {fac.type}
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                    {fac.distance_km} km away
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Staffing: <strong>{fac.staff_filled}/{fac.staff_sanctioned} filled</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 justify-end">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono">{fac.contact_phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
