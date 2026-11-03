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
  Sliders,
  Radio,
  Send,
  Droplets,
  Sun,
  Activity,
  Info,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { InteractiveMap } from '@/components/maps/InteractiveMap';
import { getAssets, getHazardZones, getEvacuationRoutes, getGrievances } from '@/lib/api';
import { Asset, HazardZoneCollection, EvacuationRouteCollection, Grievance } from '@/lib/types';
import { findAssetsInHazardZones } from '@/lib/calculations';
import {
  evaluateDisasterRisk,
  DEFAULT_TELEMETRY,
  WeatherTelemetryInput,
  DisasterEvaluationResult,
} from '@/lib/hazard-engine';

export default function VulnerabilityEvacuationPage() {
  const { t, getLocalizedName } = useTranslation();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [hazardZones, setHazardZones] = useState<HazardZoneCollection | null>(null);
  const [evacRoutes, setEvacRoutes] = useState<EvacuationRouteCollection | null>(null);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [showEvacRoute, setShowEvacRoute] = useState(true);
  const [loading, setLoading] = useState(true);

  // Telemetry Input State for Early Warning Simulator
  const [telemetry, setTelemetry] = useState<WeatherTelemetryInput>(DEFAULT_TELEMETRY);
  const [activeTab, setActiveTab] = useState<'flood' | 'drought'>('flood');
  const [broadcastSent, setBroadcastSent] = useState(false);

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

  // Multi-factor disaster risk evaluation
  const evaluation: DisasterEvaluationResult = evaluateDisasterRisk(telemetry);

  // Find assets inside any hazard zone using shared domain service
  const assetsAtRisk = findAssetsInHazardZones(assets, hazardZones);

  // Toggle checklist
  const toggleChecklistItem = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  // Scenario Presets
  const applyPreset = (preset: 'normal' | 'monsoon_orange' | 'critical_cloudburst' | 'drought') => {
    setBroadcastSent(false);
    if (preset === 'normal') {
      setTelemetry({
        rainfall_mm_24h: 15,
        rainfall_intensity_mm_hr: 2,
        river_level_meters: 5.4,
        reservoir_storage_percent: 52,
        imd_alert: 'GREEN',
        drainage_blockage_percent: 10,
        monsoon_deficit_percent: 0,
        groundwater_depletion_meters: 0.2,
      });
      setActiveTab('flood');
    } else if (preset === 'monsoon_orange') {
      setTelemetry(DEFAULT_TELEMETRY);
      setActiveTab('flood');
    } else if (preset === 'critical_cloudburst') {
      setTelemetry({
        rainfall_mm_24h: 185,
        rainfall_intensity_mm_hr: 42,
        river_level_meters: 9.7, // Above danger mark
        reservoir_storage_percent: 94,
        imd_alert: 'RED',
        drainage_blockage_percent: 65,
        monsoon_deficit_percent: -20,
        groundwater_depletion_meters: 0.0,
      });
      setActiveTab('flood');
    } else if (preset === 'drought') {
      setTelemetry({
        rainfall_mm_24h: 0,
        rainfall_intensity_mm_hr: 0,
        river_level_meters: 2.8,
        reservoir_storage_percent: 22,
        imd_alert: 'GREEN',
        drainage_blockage_percent: 5,
        monsoon_deficit_percent: 48,
        groundwater_depletion_meters: 2.1,
      });
      setActiveTab('drought');
    }
  };

  // Map elements
  const mapPolygons =
    hazardZones?.features.map((hz) => ({
      id: hz.properties.id,
      coordinates: hz.geometry.coordinates,
      color: hz.properties.color,
      label: `${hz.properties.name_en} (${hz.properties.severity})`,
      fillOpacity: 0.35,
    })) || [];

  const mapLines =
    showEvacRoute && evacRoutes?.features
      ? evacRoutes.features.map((r) => ({
          id: r.properties.id,
          coordinates: r.geometry.coordinates,
          color: '#16a34a',
          label: `Evacuation Route: ${r.properties.name_en} (${r.properties.distance_km} km)`,
        }))
      : [];

  const mapMarkers = assets.map((a) => {
    const isAtRisk = assetsAtRisk.some((x) => x.asset.id === a.id);
    return {
      id: `asset_${a.id}`,
      lat: a.lat,
      lng: a.lng,
      title: getLocalizedName(a),
      category: `${a.type.toUpperCase()} · ${isAtRisk ? 'IN HAZARD ZONE' : 'SAFE'}`,
      color: isAtRisk ? '#dc2626' : '#16a34a',
      details: `Condition: ${a.condition.toUpperCase()} · Maintained: ${a.last_maintained} · Sanchaya ID #${a.id}`,
      lastInspected: a.last_maintained,
      verificationStatus: 'verified' as const,
    };
  });

  const openGrievances = grievances.filter((g) => g.status === 'open');

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t('hazard_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              P5 Disaster Management Digital Twin · Multi-Factor Early Warning &amp; Response Engine
            </p>
          </div>
        </div>
        <SourceChip screenKey="hazard_twin" />
      </div>

      {/* Simulator Scenario Presets */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-coconut-700" />
          <span className="font-bold text-slate-800">Telemetry Scenario Simulator:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyPreset('normal')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
          >
            Seasonal Normal
          </button>
          <button
            onClick={() => applyPreset('monsoon_orange')}
            className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition-colors"
          >
            Heavy Monsoon (Orange)
          </button>
          <button
            onClick={() => applyPreset('critical_cloudburst')}
            className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 font-bold transition-colors"
          >
            Simulate Cloudburst (Red Danger)
          </button>
          <button
            onClick={() => applyPreset('drought')}
            className="px-2.5 py-1 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-900 font-bold transition-colors"
          >
            Drought &amp; Water Deficit
          </button>
        </div>
      </div>

      {/* Real-Time Risk Classification & Explainability Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-md space-y-4 ${
          evaluation.risk_level === 'CRITICAL'
            ? 'bg-red-50 border-red-300 text-red-950'
            : evaluation.risk_level === 'WARNING'
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : evaluation.risk_level === 'WATCH'
            ? 'bg-yellow-50 border-yellow-300 text-yellow-950'
            : 'bg-emerald-50 border-emerald-300 text-emerald-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3 rounded-xl ${
                evaluation.risk_level === 'CRITICAL'
                  ? 'bg-red-600 text-white animate-pulse'
                  : evaluation.risk_level === 'WARNING'
                  ? 'bg-amber-600 text-white'
                  : evaluation.risk_level === 'WATCH'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Automated Disaster Evaluation Verdict
              </span>
              <h2 className="text-xl sm:text-2xl font-black">{evaluation.verdict_title}</h2>
              <p className="text-xs font-semibold opacity-80 mt-0.5">
                Composite Risk Index: {evaluation.score} / 100 · IMD {telemetry.imd_alert} Alert
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-white/90 border border-black/10 text-xs font-black shadow-2xs font-mono">
              Chaliyar Gauge: {telemetry.river_level_meters}m
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/90 border border-black/10 text-xs font-black shadow-2xs font-mono">
              Rainfall: {telemetry.rainfall_mm_24h}mm/24h
            </span>
          </div>
        </div>

        {/* Transparent Reason Factors */}
        <div className="space-y-1.5 text-xs">
          <span className="font-bold uppercase text-[10px] tracking-wider opacity-70">
            Explainable Decision Factors:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {evaluation.explanation.map((fact, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-white/80 rounded-lg border border-black/5 text-[11px] leading-relaxed"
              >
                {fact}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Automatic Emergency Response Alert (When Warning or Critical) */}
      {evaluation.admin_alert && (
        <section className="bg-gradient-to-r from-red-950 via-slate-900 to-red-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-red-700/60 space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-800/80 pb-4">
            <div className="flex items-center gap-3">
              <Radio className="w-6 h-6 text-red-400 animate-pulse" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                  {evaluation.admin_alert.id}
                </span>
                <h3 className="text-lg font-black">{evaluation.admin_alert.headline}</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
              Immediate Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* Action Checklist */}
            <div className="space-y-3">
              <h4 className="font-bold text-red-200 uppercase tracking-wide text-[11px]">
                Administrative Standard Operating Procedures (SOP)
              </h4>
              <ul className="space-y-2">
                {evaluation.admin_alert.action_checklist.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 bg-red-950/60 p-2.5 rounded-lg border border-red-800/40">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-slate-200 leading-snug">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Public Emergency Broadcast Notification Draft */}
            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-red-200 uppercase tracking-wide text-[11px] mb-2">
                  Emergency Broadcast Dispatch (SMS &amp; Public Warning Gateway)
                </h4>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-red-800/60 space-y-2 font-mono text-[11px]">
                  <div className="text-red-300 font-bold border-b border-red-900/60 pb-1">
                    English Broadcast:
                  </div>
                  <p className="text-slate-300">{evaluation.admin_alert.broadcast_sms_template_en}</p>
                  <div className="text-red-300 font-bold border-b border-red-900/60 pb-1 pt-1 font-sans">
                    മലയാളം സന്ദേശം:
                  </div>
                  <p className="text-slate-300 font-sans">{evaluation.admin_alert.broadcast_sms_template_ml}</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setBroadcastSent(true)}
                  disabled={broadcastSent}
                  className={`w-full py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    broadcastSent
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-lg'
                  }`}
                >
                  {broadcastSent ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simulated Public Warning Broadcast Dispatched</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Dispatch Simulated Broadcast to Ward RRT Cells</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid: Left Map & Exposure, Right Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Map & Ward Exposure Ledger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leaflet Hazard Map */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-600" />
                <h3 className="font-bold text-slate-900">
                  KSDMA Hazard Atlas &amp; Infrastructure Assets ({assets.length} Assets Mapped)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEvacRoute(!showEvacRoute)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    showEvacRoute
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {showEvacRoute ? '✓ Evacuation Lines Active' : 'Show Evacuation Lines'}
                </button>
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

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Red Polygons: KSDMA Flood Plain · Amber Polygons: Kottakkunnu Landslide Zone</span>
              <span className="font-bold text-red-700">
                {assetsAtRisk.length} Assets inside hazard contours
              </span>
            </div>
          </div>

          {/* Aggregated Ward Population Exposure (DPDP Compliant - Demographic Sums) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-red-600" />
                <span>Aggregated Ward Population Exposure (Demographic Census GIS Overlay)</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                No Individual Location Tracking
              </span>
            </div>

            {evaluation.vulnerable_wards.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Ward</th>
                      <th className="py-2 px-3">Primary Hazard</th>
                      <th className="py-2 px-3">Exposed Population</th>
                      <th className="py-2 px-3">Exposed Dwellings</th>
                      <th className="py-2 px-3">Severity</th>
                      <th className="py-2 px-3">Mandated Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {evaluation.vulnerable_wards.map((w) => (
                      <tr key={w.ward_id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{w.ward_name}</td>
                        <td className="py-2.5 px-3 uppercase text-[11px] font-semibold text-slate-700">
                          {w.hazard_type}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {w.exposed_population.toLocaleString()} citizens
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {w.exposed_households} households
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              w.risk_severity === 'HIGH'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {w.risk_severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                          {w.recommended_action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3 text-center">
                All wards currently within normal safety buffers. No population evacuation mandated.
              </p>
            )}
          </div>

          {/* Drought Monitoring Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-600" />
                <span>Agricultural Drought &amp; Water Balance Tracking</span>
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                evaluation.drought_status === 'SEVERE_DROUGHT'
                  ? 'bg-red-100 text-red-800'
                  : evaluation.drought_status === 'MODERATE_DROUGHT'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {evaluation.drought_status.replace('_', ' ')}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {evaluation.drought_summary}
            </p>

            <div className="grid grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Monsoon Deficit</span>
                <strong className="text-sm text-slate-900 font-mono">
                  {telemetry.monsoon_deficit_percent > 0 ? `-${telemetry.monsoon_deficit_percent}%` : 'Normal'}
                </strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Reservoir Storage</span>
                <strong className="text-sm text-slate-900 font-mono">
                  {telemetry.reservoir_storage_percent}% Available
                </strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Water Table Drop</span>
                <strong className="text-sm text-slate-900 font-mono">
                  {telemetry.groundwater_depletion_meters}m below norm
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Shelters, Assets at Risk & Orange Book */}
        <div className="space-y-6">
          {/* Designated Shelters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Home className="w-4 h-4 text-emerald-600" />
              <span>Designated Relief Shelters ({evaluation.active_shelters.length})</span>
            </h3>

            <div className="space-y-2 text-xs">
              {evaluation.active_shelters.map((s) => (
                <div key={s.id} className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1">
                  <div className="font-bold text-emerald-950">{s.name}</div>
                  <div className="text-slate-600">Capacity: <strong>{s.capacity} evacuees</strong></div>
                  <div className="text-slate-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{s.contact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assets in Hazard Contour */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Assets at Hazard Risk ({assetsAtRisk.length})</span>
              </h3>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
              {assetsAtRisk.slice(0, 10).map((item, idx) => (
                <div key={idx} className="p-2.5 bg-red-50/60 rounded-lg border border-red-200 space-y-0.5">
                  <div className="font-bold text-slate-900">{getLocalizedName(item.asset)}</div>
                  <div className="text-[11px] text-red-700">
                    Zone: {item.zoneName} ({item.severity})
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Type: {item.asset.type.toUpperCase()} · Ward {item.asset.ward_id}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Orange Book Checklist */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>KSDMA Orange Book Preparedness</span>
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
