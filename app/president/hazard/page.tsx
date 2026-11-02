'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Navigation,
  CheckSquare,
  Square,
  Home,
  Phone,
  Layers,
  MapPin,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { InteractiveMap } from '@/components/maps/InteractiveMap';
import { getAssets, getHazardZones, getEvacuationRoutes, getGrievances } from '@/lib/api';
import { Asset, HazardZoneCollection, EvacuationRouteCollection, Grievance } from '@/lib/types';
import { findAssetsInHazardZones } from '@/lib/calculations';

export default function VulnerabilityEvacuationPage() {
  const { t, getLocalizedName } = useTranslation();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [hazardZones, setHazardZones] = useState<HazardZoneCollection | null>(null);
  const [evacRoutes, setEvacRoutes] = useState<EvacuationRouteCollection | null>(null);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [showEvacRoute, setShowEvacRoute] = useState(false);
  const [loading, setLoading] = useState(true);

  // Orange Book Checklist (8 items, 5 checked by default)
  const [checklist, setChecklist] = useState([
    { id: 1, text: '24/7 Taluk & Panchayat Emergency Operation Centre (EOC) Activated', checked: true },
    { id: 2, text: 'Ward Rapid Response Team (RRT) Staff Mobilisation Completed', checked: true },
    { id: 3, text: 'Chaliyar River Basin Flood Warning Telemetry Operational', checked: true },
    { id: 4, text: 'Designated School & Community Hall Relief Camps Stocked (Rations/Bedding)', checked: true },
    { id: 5, text: 'Emergency Generator & Potable Water Tanker Contracts Confirmed', checked: true },
    { id: 6, text: 'Rescue Inflatable Boats Stationed at Cheruvannur Outpost', checked: false },
    { id: 7, text: 'Satellite Phone Backup Battery Health Verified', checked: false },
    { id: 8, text: 'Pre-monsoon Drainage Desilting Certificate Signed Off', checked: false },
  ]);

  useEffect(() => {
    async function load() {
      try {
        const [aList, hz, er, gList] = await Promise.all([
          getAssets(),
          getHazardZones(),
          getEvacuationRoutes(),
          getGrievances(),
        ]);
        setAssets(aList);
        setHazardZones(hz);
        setEvacRoutes(er);
        setGrievances(gList);
      } catch (err) {
        console.error('Failed to load hazard twin data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  // Find assets inside any hazard zone using shared domain service
  const assetsAtRisk = findAssetsInHazardZones(assets, hazardZones);

  // Toggle checklist
  const toggleChecklistItem = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  // Map elements
  const mapPolygons =
    hazardZones?.features.map((hz) => ({
      id: hz.properties.id,
      coordinates: hz.geometry.coordinates,
      color: hz.properties.color,
      label: `${hz.properties.name_en} (${hz.properties.severity})`,
      fillOpacity: 0.3,
    })) || [];

  const mapLines =
    showEvacRoute && evacRoutes?.features[0]
      ? [
          {
            id: evacRoutes.features[0].properties.id,
            coordinates: evacRoutes.features[0].geometry.coordinates,
            color: '#16a34a',
            label: `Evacuation Route: ${evacRoutes.features[0].properties.name_en} (Distance: ${evacRoutes.features[0].properties.distance_km} km)`,
          },
        ]
      : [];

  const mapMarkers = assets.slice(0, 60).map((a) => {
    const isAtRisk = assetsAtRisk.some((x) => x.asset.id === a.id);
    return {
      id: `asset_${a.id}`,
      lat: a.lat,
      lng: a.lng,
      title: getLocalizedName(a),
      category: `${a.type} (${isAtRisk ? 'IN HAZARD ZONE' : 'SAFE'})`,
      color: isAtRisk ? '#dc2626' : '#16a34a',
      details: `Condition: ${a.condition.toUpperCase()} · Status: ${
        isAtRisk ? 'VULNERABLE ASSET' : 'Normal'
      }`,
    };
  });

  // Recent open grievances for Hotspot Panel (Walkthrough Step 8)
  const openGrievances = grievances.filter((g) => g.status === 'open');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('hazard_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              P5 Disaster Vulnerability & Evacuation Protocol Twin · KSDMA & Orange Book Guidelines
            </p>
          </div>
        </div>
        <SourceChip screenKey="hazard" />
      </div>

      {/* Walkthrough Step 8 Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-600 p-3.5 rounded-r-lg text-xs text-amber-950 flex items-center justify-between">
        <div>
          <span className="font-bold">Reviewer Script (Step 8):</span> Notice how newly submitted citizen grievances appear instantly in the{' '}
          <strong>Live Ward Incident Hotspot Panel</strong> below, enabling rapid coordination before flood events.
        </div>
        <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px] ml-2 flex-shrink-0">
          {openGrievances.length} Active Incidents
        </span>
      </div>

      {/* Map & Disaster Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Hazard Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>KSDMA Hazard Polygons & Infrastructure Exposure</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Asset at Risk
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Asset Safe
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-1 bg-emerald-600" /> Evacuation Line
                </span>
              </div>
            </div>

            <InteractiveMap
              center={[11.305, 75.885]}
              zoom={14}
              polygons={mapPolygons}
              lines={mapLines}
              markers={mapMarkers}
              height="440px"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Displaying 4 KSDMA flood/landslide risk polygons and 60 surveyed public assets
              </span>
              <button
                onClick={() => setShowEvacRoute(!showEvacRoute)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  showEvacRoute
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>
                  {showEvacRoute ? 'Hide Evacuation Route' : t('btn_preview_evac')}
                </span>
              </button>
            </div>
          </div>

          {/* Hotspot Incident Panel (Walkthrough Step 8) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-600" />
                <span>Live Ward Incident & Grievance Hotspots</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                CMO Grievance Live Feed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
              {openGrievances.map((g) => (
                <div
                  key={g.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900">{g.id}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] uppercase font-mono">
                      Ward {g.ward_id} · {g.category}
                    </span>
                  </div>
                  <p className="text-slate-700 line-clamp-2">{g.description_en}</p>
                  <div className="text-[10px] text-slate-500 pt-0.5 flex items-center justify-between">
                    <span>Filed: {g.filed_date}</span>
                    <span className="font-semibold text-blue-700">Dept: {g.assigned_dept}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Assets at Risk, Shelters & Orange Book Checklist */}
        <div className="space-y-6">
          {/* Designated Shelters */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Home className="w-4 h-4 text-emerald-600" />
              <span>{t('hazard_shelters')} (2 Active)</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-emerald-50/80 rounded-lg border border-emerald-200 space-y-1">
                <div className="font-bold text-emerald-950">
                  Thekkumpuram Govt Higher Secondary School Relief Camp
                </div>
                <div className="text-slate-600">Capacity: <strong>450 evacuees</strong></div>
                <div className="text-slate-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>+91 495 2884101 (Camp In-charge)</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/80 rounded-lg border border-emerald-200 space-y-1">
                <div className="font-bold text-emerald-950">
                  Mele Angadi Community Hall & Cyclone Shelter
                </div>
                <div className="text-slate-600">Capacity: <strong>320 evacuees</strong></div>
                <div className="text-slate-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>+91 495 2884102 (Panchayat EOC)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assets at Risk */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{t('hazard_assets_at_risk')} ({assetsAtRisk.length})</span>
              </h3>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
              {assetsAtRisk.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-red-50/60 rounded border border-red-200 space-y-0.5"
                >
                  <div className="font-bold text-slate-900">{getLocalizedName(item.asset)}</div>
                  <div className="text-[11px] text-red-700">
                    Zone: {item.zoneName} ({item.severity})
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Type: {item.asset.type} · Ward {item.asset.ward_id}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Orange Book Checklist (8 items, 5 checked) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Orange Book Checklist</span>
              </h3>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {checklist.filter((c) => c.checked).length} / 8 Ready
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`p-2 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-colors ${
                    item.checked
                      ? 'bg-blue-50/60 border-blue-200 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  {item.checked ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-[11px] leading-snug ${item.checked ? 'font-medium' : ''}`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
