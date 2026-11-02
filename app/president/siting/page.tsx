'use client';

import React, { useEffect, useState } from 'react';
import {
  Compass,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Building,
  Layers,
  Info,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { InteractiveMap } from '@/components/maps/InteractiveMap';
import { getWards, getParcels, getHazardZones } from '@/lib/api';
import { Ward, LandParcel, HazardZoneCollection, SitingEvaluation } from '@/lib/types';
import { evaluateSitingCompliance } from '@/lib/siting-rules';

export default function SitingCompliancePage() {
  const { t, getLocalizedName } = useTranslation();
  const [wards, setWards] = useState<Ward[]>([]);
  const [parcels, setParcels] = useState<LandParcel[]>([]);
  const [hazardZones, setHazardZones] = useState<HazardZoneCollection | null>(null);

  const [selectedWardId, setSelectedWardId] = useState<number>(7); // Default Ward 7 (Cheruvannur)
  const [selectedSurveyNo, setSelectedSurveyNo] = useState<string>('412/2'); // Default 412/2 for walkthrough
  const [workType, setWorkType] = useState<string>('residential');
  const [evaluation, setEvaluation] = useState<SitingEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [wList, pList, hz] = await Promise.all([
          getWards(),
          getParcels(),
          getHazardZones(),
        ]);
        setWards(wList);
        setParcels(pList);
        setHazardZones(hz);

        // Pre-evaluate default 412/2
        const p412 = pList.find((p) => p.survey_number === '412/2') || pList[0];
        if (p412) {
          setEvaluation(evaluateSitingCompliance(p412, 'residential'));
        }
      } catch (err) {
        console.error('Failed to load siting data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wid = Number(e.target.value);
    setSelectedWardId(wid);
    const wardParcels = parcels.filter((p) => p.ward_id === wid);
    if (wardParcels.length > 0) {
      const nextP = wardParcels[0];
      setSelectedSurveyNo(nextP.survey_number);
      setEvaluation(evaluateSitingCompliance(nextP, workType));
    }
  };

  const handleParcelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sNo = e.target.value;
    setSelectedSurveyNo(sNo);
    const found = parcels.find((p) => p.survey_number === sNo);
    if (found) {
      setEvaluation(evaluateSitingCompliance(found, workType));
    }
  };

  const handleWorkTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wt = e.target.value;
    setWorkType(wt);
    if (evaluation?.parcel) {
      setEvaluation(evaluateSitingCompliance(evaluation.parcel, wt));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  const selectedParcel = parcels.find((p) => p.survey_number === selectedSurveyNo);
  const wardParcels = parcels.filter((p) => p.ward_id === selectedWardId);

  // Map overlays setup
  const mapPolygons = [];

  // Hazard zones polygons
  if (hazardZones) {
    hazardZones.features.forEach((hz) => {
      mapPolygons.push({
        id: hz.properties.id,
        coordinates: hz.geometry.coordinates,
        color: hz.properties.color,
        label: `${hz.properties.name_en} (${hz.properties.severity})`,
        fillOpacity: 0.25,
      });
    });
  }

  // Selected Parcel polygon
  if (selectedParcel) {
    const verdictColor =
      evaluation?.verdict === 'PASS'
        ? '#16a34a'
        : evaluation?.verdict === 'CONDITIONAL'
        ? '#ca8a04'
        : '#dc2626';

    mapPolygons.push({
      id: `parcel_${selectedParcel.survey_number}`,
      coordinates: selectedParcel.geometry.coordinates,
      color: verdictColor,
      label: `Survey No: ${selectedParcel.survey_number} · ${selectedParcel.classification.toUpperCase()}`,
      fillOpacity: 0.6,
    });
  }

  // Calculate parcel center for map view
  const parcelCoords = selectedParcel?.geometry.coordinates[0][0] || [75.885, 11.305];
  const mapCenter: [number, number] = [parcelCoords[1], parcelCoords[0]];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('siting_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              P3 Plan Siting Compliance Engine · Statutory Land & Hazard Verification
            </p>
          </div>
        </div>
        <SourceChip screenKey="siting" />
      </div>

      {/* Walkthrough Highlight Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-3.5 rounded-r-lg text-xs text-blue-900 flex items-center justify-between">
        <div>
          <span className="font-bold">Reviewer Script (Step 4):</span> Select parcel{' '}
          <strong className="underline">412/2</strong> in Ward 7 Cheruvannur to verify the deterministic{' '}
          <strong className="text-red-700">FAIL</strong> verdict with statutory Nilam & setback constraints.
        </div>
        <button
          onClick={() => {
            setSelectedWardId(7);
            setSelectedSurveyNo('412/2');
            const p = parcels.find((x) => x.survey_number === '412/2');
            if (p) setEvaluation(evaluateSitingCompliance(p, workType));
          }}
          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] ml-2 flex-shrink-0"
        >
          Load 412/2
        </button>
      </div>

      {/* Form Controls & Instant Verdict */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Select Proposal Parameters</span>
          </h3>

          {/* Ward Select */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {t('siting_select_ward')}
            </label>
            <select
              value={selectedWardId}
              onChange={handleWardChange}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  Ward {w.number}: {getLocalizedName(w)}
                </option>
              ))}
            </select>
          </div>

          {/* Parcel Select */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {t('siting_select_parcel')}
            </label>
            <select
              value={selectedSurveyNo}
              onChange={handleParcelChange}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {wardParcels.map((p) => (
                <option key={p.survey_number} value={p.survey_number}>
                  Survey {p.survey_number} ({p.classification.toUpperCase()} · {p.area_cents} Cents)
                </option>
              ))}
            </select>
          </div>

          {/* Work Type Select */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {t('siting_work_type')}
            </label>
            <select
              value={workType}
              onChange={handleWorkTypeChange}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="residential">Residential House Construction</option>
              <option value="commercial">Commercial Building / Shop</option>
              <option value="public_infra">Panchayat Public Facility / Hall</option>
              <option value="drainage">Drainage & Culvert Work</option>
            </select>
          </div>

          {/* Selected Parcel Summary */}
          {selectedParcel && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1 text-slate-700">
              <div className="font-bold text-slate-900">Parcel Attributes:</div>
              <div>Classification: <strong className="uppercase">{selectedParcel.classification}</strong></div>
              <div>Area: <strong>{selectedParcel.area_cents} Cents</strong></div>
              <div>Hazard Zone: <strong className="uppercase text-amber-700">{selectedParcel.hazard_zone}</strong></div>
              <div>Road Setback: <strong>{selectedParcel.road_setback_ok ? 'Compliant (>3m)' : 'Breach (<3m)'}</strong></div>
            </div>
          )}
        </div>

        {/* Verdict & Reasons Column */}
        <div className="lg:col-span-2 space-y-4">
          {evaluation && (
            <div
              className={`p-6 rounded-xl border shadow-sm space-y-4 ${
                evaluation.verdict === 'PASS'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : evaluation.verdict === 'CONDITIONAL'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  {evaluation.verdict === 'PASS' ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                  ) : evaluation.verdict === 'CONDITIONAL' ? (
                    <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0" />
                  ) : (
                    <AlertOctagon className="w-8 h-8 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Compliance Verdict
                    </span>
                    <h2
                      className={`text-2xl font-black ${
                        evaluation.verdict === 'PASS'
                          ? 'text-emerald-700'
                          : evaluation.verdict === 'CONDITIONAL'
                          ? 'text-amber-700'
                          : 'text-red-700'
                      }`}
                    >
                      {evaluation.verdict}
                    </h2>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-500 block">Citizen View Equiv:</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-800">
                    {evaluation.citizen_verdict}
                  </span>
                </div>
              </div>

              {/* All Triggered Statutory Reasons */}
              <div className="space-y-2 pt-2 border-t border-slate-200/60">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                  {t('siting_reasons')}
                </h4>
                <div className="space-y-2">
                  {evaluation.reasons.map((r, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white/90 rounded-lg border border-slate-200 shadow-2xs text-xs space-y-1"
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            r.level === 'FAIL'
                              ? 'bg-red-600'
                              : r.level === 'CONDITIONAL'
                              ? 'bg-amber-600'
                              : 'bg-emerald-600'
                          }`}
                        />
                        <span className="text-slate-900 font-mono text-[11px]">{r.rule_id}</span>
                      </div>
                      <p className="text-slate-700 font-medium">{r.message_en}</p>
                      <p className="text-slate-500 text-[11px] font-malayalam">{r.message_ml}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Map with Parcel Boundary & Hazard Overlays */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>{t('siting_parcel_map')}</span>
              </h4>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-red-600 rounded-sm" /> High Flood
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm" /> Moderate Flood
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-sm" /> Selected Parcel
                </span>
              </div>
            </div>

            <InteractiveMap
              center={mapCenter}
              zoom={16}
              polygons={mapPolygons}
              height="380px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
