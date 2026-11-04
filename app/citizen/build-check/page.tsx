'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckSquare,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Building2,
  FileCheck,
  ArrowRight,
  ShieldAlert,
  Info,
  Layers,
  FileText,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { InteractiveMap } from '@/components/maps/InteractiveMap';
import { getParcelBySurveyNumber, getParcels, getHazardZones } from '@/lib/api';
import { LandParcel, SitingEvaluation, HazardZoneCollection } from '@/lib/types';
import { evaluateSitingCompliance } from '@/lib/siting-rules';

function BuildCheckContent() {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isMl = language === 'ml';
  const initialSurvey = searchParams.get('survey') || '412/2';
  const [surveyNumber, setSurveyNumber] = useState<string>(initialSurvey);
  const [buildingType, setBuildingType] = useState<string>('residential');
  const [address, setAddress] = useState<string>('Cheruvannur Central, Ward 7');
  const [allParcels, setAllParcels] = useState<LandParcel[]>([]);
  const [hazardZones, setHazardZones] = useState<HazardZoneCollection | null>(null);
  const [evaluation, setEvaluation] = useState<SitingEvaluation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [parcelsList, hz] = await Promise.all([getParcels(), getHazardZones()]);
        setAllParcels(parcelsList);
        setHazardZones(hz);

        const found = parcelsList.find((p) => p.survey_number === initialSurvey) || parcelsList[0];
        if (found) {
          setEvaluation(evaluateSitingCompliance(found, 'residential'));
        }
      } catch (err) {
        console.error('Failed to load build check data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [initialSurvey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = allParcels.find(
      (p) => p.survey_number.toLowerCase() === surveyNumber.trim().toLowerCase()
    );
    if (found) {
      setEvaluation(evaluateSitingCompliance(found, buildingType));
      setErrorMsg(null);
    } else {
      setEvaluation(null);
      setErrorMsg(
        isMl
          ? `സർവേ നമ്പർ "${surveyNumber}" കഡാസ്ട്രൽ വിവരങ്ങളിൽ കണ്ടെത്താനായില്ല.`
          : `Survey parcel "${surveyNumber}" was not found in cadastral demo records.`
      );
    }
  };

  const handleSelectSurvey = (sNo: string) => {
    setSurveyNumber(sNo);
    const found = allParcels.find((p) => p.survey_number === sNo);
    if (found) {
      setEvaluation(evaluateSitingCompliance(found, buildingType));
      setErrorMsg(null);
    } else {
      setEvaluation(null);
      setErrorMsg(
        isMl
          ? `സർവേ നമ്പർ "${sNo}" കഡാസ്ട്രൽ വിവരങ്ങളിൽ കണ്ടെത്താനായില്ല.`
          : `Survey parcel "${sNo}" was not found in cadastral demo records.`
      );
    }
  };

  if (loading && !evaluation) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  // Map elements
  const currentParcel = evaluation?.parcel;
  const parcelCoords = currentParcel?.geometry.coordinates[0][0] || [75.885, 11.305];
  const mapCenter: [number, number] = [parcelCoords[1], parcelCoords[0]];

  const mapPolygons = [
    ...(hazardZones?.features.map((hz) => ({
      id: hz.properties.id,
      coordinates: hz.geometry.coordinates,
      color:
        hz.properties.severity === 'high'
          ? '#dc2626'
          : hz.properties.severity === 'medium'
          ? '#ea580c'
          : '#ca8a04',
      label: isMl
        ? `${hz.properties.name_ml || hz.properties.name_en} (${hz.properties.severity})`
        : `${hz.properties.name_en} (${hz.properties.severity})`,
      fillOpacity: 0.25,
    })) || []),
    ...(currentParcel
      ? [
          {
            id: `parcel_${currentParcel.survey_number}`,
            coordinates: currentParcel.geometry.coordinates,
            color:
              currentParcel.classification === 'nilam'
                ? '#dc2626'
                : currentParcel.classification === 'wetland'
                ? '#ca8a04'
                : '#16a34a',
            label: isMl
              ? `സർവേ ${currentParcel.survey_number} · ${currentParcel.classification}`
              : `Survey ${currentParcel.survey_number} · ${currentParcel.classification.toUpperCase()}`,
            fillOpacity: 0.65,
          },
        ]
      : []),
  ];

  const getVerdictDisplay = () => {
    if (!evaluation) return '';
    if (isMl) {
      if (evaluation.citizen_verdict === 'PASS') return 'അനുമതിയുണ്ട്';
      if (evaluation.citizen_verdict === 'NEEDS APPROVAL') return 'പ്രത്യേക അനുമതി ആവശ്യമാണ്';
      return 'നിർമ്മാണം അനുവദനീയമല്ല';
    }
    return evaluation.citizen_verdict;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('build_check_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {isMl
                ? 'C2 സ്വയംപ്രേരിത നിർമ്മാണ അനുമതി പ്രീ-ചെക്ക് · കേരള കഡാസ്ട്രൽ ചട്ടങ്ങൾ'
                : 'C2 Automated Building Feasibility Pre-Check · Kerala Cadastral & Spatial Rule Verification'}
            </p>
          </div>
        </div>
        <SourceChip screenKey="build_check" />
      </div>

      {/* Advisory Banner */}
      <div className="bg-slate-100 border border-slate-300 p-3.5 rounded-xl text-xs text-slate-700 flex items-start gap-2.5 shadow-2xs">
        <ShieldAlert className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {isMl ? (
            <>
              <strong>നിയമപരമായ അറിയിപ്പ്:</strong> ഈ നിർമ്മാണ അനുമതി പരിശോധന ഡെമോ കഡാസ്ട്രൽ വിവരങ്ങളും വെള്ളപ്പൊക്ക സാധ്യതാ ഭൂപടങ്ങളും അടിസ്ഥാനമാക്കി തയ്യാറാക്കിയതാണ്. ഔദ്യോഗിക കെട്ടിട നിർമ്മാണ അനുമതിക്കായി കേരള സർക്കാരിന്റെ <em>സങ്കേതം (IKM)</em> പോർട്ടൽ മുഖേന അപേക്ഷ സമർപ്പിക്കേണ്ടതാണ്.
            </>
          ) : (
            <>
              <strong>Statutory Verification Notice:</strong> This advisory pre-check runs deterministic spatial rules against demonstration cadastral records and modeled flood hazard overlays. Official building permits require formal cadastral verification and statutory filing on the Government of Kerala <em>Sanketham (IKM)</em> portal.
            </>
          )}
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Survey Input */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">{t('build_survey_label')}:</label>
            <input
              type="text"
              value={surveyNumber}
              onChange={(e) => setSurveyNumber(e.target.value)}
              placeholder="e.g. 412/2"
              className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-coconut-500 focus:outline-none"
              required
            />
          </div>

          {/* Building Type */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">{t('build_bldg_type')}:</label>
            <select
              value={buildingType}
              onChange={(e) => {
                setBuildingType(e.target.value);
                if (evaluation?.parcel) {
                  setEvaluation(evaluateSitingCompliance(evaluation.parcel, e.target.value));
                }
              }}
              className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-coconut-500 focus:outline-none"
            >
              <option value="residential">{t('build_type_res')}</option>
              <option value="commercial">{t('build_type_comm')}</option>
            </select>
          </div>

          {/* Location / Address */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">
              {isMl ? 'സ്ഥലത്തിന്റെ മേൽവിലാസം / അടയാളം:' : 'Property Address / Landmark:'}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-coconut-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {/* Quick Demo Parcels */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-500 font-medium">
                {isMl ? 'മാതൃകാ പരിശോധനകൾ:' : 'Test Cadastral Cases:'}
              </span>
              <button
                type="button"
                onClick={() => handleSelectSurvey('412/2')}
                className="px-2.5 py-1 rounded-lg bg-red-100 text-red-900 font-bold hover:bg-red-200 transition-colors"
              >
                {isMl ? '412/2 (നിലം / അനുമതിയില്ല)' : '412/2 (Nilam / Not Permitted)'}
              </button>
              <button
                type="button"
                onClick={() => handleSelectSurvey('316/3')}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold hover:bg-emerald-200 transition-colors"
              >
                {isMl ? '316/3 (പുരയിടം / അനുമതിയുണ്ട്)' : '316/3 (Purayidom / Clear Pass)'}
              </button>
              <button
                type="button"
                onClick={() => handleSelectSurvey('324/4')}
                className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold hover:bg-amber-200 transition-colors"
              >
                {isMl ? '324/4 (വെള്ളപ്പൊക്ക മേഖല / പ്രത്യേക അനുമതി)' : '324/4 (Flood Hazard / Needs Approval)'}
              </button>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-coconut-700 hover:bg-coconut-600 text-white font-bold rounded-xl shadow transition-colors flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>{btn_check_text(isMl)}</span>
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Cadastral Details & Map Grid */}
      {evaluation && currentParcel && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Verdict & Findings & Map */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verdict Card */}
            <div
              className={`p-6 rounded-2xl border shadow-md space-y-5 ${
                evaluation.citizen_verdict === 'PASS'
                  ? 'bg-emerald-50 border-emerald-300'
                  : evaluation.citizen_verdict === 'NEEDS APPROVAL'
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-red-50 border-red-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
                <div className="flex items-center gap-3.5">
                  {evaluation.citizen_verdict === 'PASS' ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 flex-shrink-0" />
                  ) : evaluation.citizen_verdict === 'NEEDS APPROVAL' ? (
                    <AlertTriangle className="w-10 h-10 text-amber-600 flex-shrink-0" />
                  ) : (
                    <AlertOctagon className="w-10 h-10 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {isMl ? 'ഓട്ടോമേറ്റഡ് പരിശോധനാ ഫലം' : 'Automated Feasibility Result'}
                    </span>
                    <h2
                      className={`text-2xl sm:text-3xl font-black ${
                        evaluation.citizen_verdict === 'PASS'
                          ? 'text-emerald-900'
                          : evaluation.citizen_verdict === 'NEEDS APPROVAL'
                          ? 'text-amber-950'
                          : 'text-red-950'
                      }`}
                    >
                      {getVerdictDisplay()}
                    </h2>
                  </div>
                </div>

                <Link
                  href={`/citizen/plot?survey=${currentParcel.survey_number}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-colors self-start sm:self-auto"
                >
                  <MapPin className="w-4 h-4 text-coconut-700" />
                  <span>{isMl ? 'കഡാസ്ട്രൽ ഭൂപടം കാണുക' : 'Inspect Cadastral Plot'}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>

              {/* Statutory Evaluation Findings */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                  {isMl ? 'നിയമപരമായ പരിശോധനാ കണ്ടെത്തലുകൾ' : 'Statutory Evaluation Breakdown'}
                </h3>
                <div className="space-y-2">
                  {evaluation.reasons.map((r, i) => (
                    <div
                      key={i}
                      className="p-3.5 bg-white/95 rounded-xl border border-slate-200/80 shadow-2xs text-xs space-y-1"
                    >
                      <p className="font-bold text-slate-900">
                        {isMl ? r.message_ml : r.message_en}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Guidance */}
              <div className="pt-2 text-xs">
                {evaluation.citizen_verdict === 'PASS' ? (
                  <p className="text-emerald-950 font-medium leading-relaxed">
                    {isMl
                      ? 'ഈ സ്ഥലം കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ പാലിക്കുന്നു. അംഗീകൃത എഞ്ചിനീയറുടെ സഹായത്തോടെ പ്ലാൻ തയ്യാറാക്കി സർക്കാരിന്റെ സങ്കേതം പോർട്ടലിൽ അപേക്ഷിക്കാം.'
                      : 'This parcel complies with standard Kerala Panchayat Building Rules. You may engage an empaneled civil engineer to prepare architectural plans and submit via the Sanketham portal.'}
                  </p>
                ) : evaluation.citizen_verdict === 'NEEDS APPROVAL' ? (
                  <p className="text-amber-950 font-medium leading-relaxed">
                    {isMl
                      ? 'പ്രത്യേക നിബന്ധനകളോടെ അനുമതി: വെള്ളപ്പൊക്ക സാധ്യതാ മേഖലയിലോ ചരിഞ്ഞ പ്രദേശത്തോ ആയതിനാൽ തറ ഉയർത്തലും ദുരന്ത നിവാരണ അതോറിറ്റി എൻ.ഒ.സി യും നിർബന്ധമാണ്.'
                      : 'Conditional approval: Elevated plinth structural design and Disaster Management NOC are required due to proximity to flood contours or steep terrain.'}
                  </p>
                ) : (
                  <p className="text-red-950 font-medium leading-relaxed">
                    {isMl ? (
                      <>
                        2008-ലെ <em>കേരള നെൽവയൽ തണ്ണീർത്തട സംരക്ഷണ നിയമപ്രകാരമോ</em> റോഡ് സെറ്റ്-ബാക്ക് കുറവായതിനാലോ (&lt; 3m) നിർമ്മാണം പൂർണ്ണമായും നിരോധിച്ചിരിക്കുന്നു. അനുമതിയില്ലാതെ നിർമ്മാണം നടത്തിയാൽ നിയമനടപടികൾ നേരിടേണ്ടിവരും.
                      </>
                    ) : (
                      <>
                        Construction is strictly prohibited under the <em>Kerala Conservation of Paddy Land &amp; Wetland Act, 2008</em> or road setback breach (&lt; 3m). Conversion or unauthorized building will incur statutory penalties.
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Cadastral Polygon Map */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs">
                <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-coconut-700" />
                  <span>
                    {isMl
                      ? 'കഡാസ്ട്രൽ അതിർത്തിയും ദുരന്ത സാധ്യതാ ലെയറും'
                      : 'Cadastral Boundary on KSDMA Hazard Grid'}
                  </span>
                </h3>
                <span className="font-mono text-slate-500">
                  {isMl
                    ? `വില്ലേജ്: ${currentParcel.village_ml} · വാർഡ് ${currentParcel.ward_id}`
                    : `Village: ${currentParcel.village_en} · Ward ${currentParcel.ward_id}`}
                </span>
              </div>

              <InteractiveMap
                center={mapCenter}
                zoom={16}
                polygons={mapPolygons}
                height="320px"
              />

              <div className="text-[11px] text-slate-500 text-center">
                {isMl
                  ? 'KSDMA വെള്ളപ്പൊക്ക സാധ്യതാ ലെയറുകൾക്ക് മുകളിൽ ഭൂമിയുടെ അതിർത്തി അടയാളപ്പെടുത്തിയിരിക്കുന്നു.'
                  : 'Highlighted polygon shows parcel boundary over KSDMA flood plain layers.'}
              </div>
            </div>
          </div>

          {/* Right 1 Col: Cadastral Attributes & Plain-Language Rights */}
          <div className="space-y-6">
            {/* Cadastral Record Details */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {t('cadastral_record')}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    {isMl
                      ? `സർവേ ${currentParcel.survey_number}`
                      : `Survey ${currentParcel.survey_number}`}
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                    currentParcel.classification === 'nilam'
                      ? 'bg-red-100 text-red-800'
                      : currentParcel.classification === 'wetland'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {t(`class_${currentParcel.classification}`)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{t('total_area')}:</span>
                  <strong className="text-slate-900 font-bold">
                    {currentParcel.area_cents} {t('cents')}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{t('road_setback')}</span>
                  <strong className={currentParcel.road_setback_ok ? 'text-emerald-700' : 'text-red-700'}>
                    {currentParcel.road_setback_ok
                      ? t('compliant_3m')
                      : t('breach_3m')}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">{t('hazard_exposure')}:</span>
                  <strong className="text-amber-800 uppercase font-mono">
                    {currentParcel.hazard_zone}
                  </strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">{isMl ? 'വില്ലേജ്:' : 'Village:'}</span>
                  <strong className="text-slate-800">
                    {isMl ? currentParcel.village_ml : currentParcel.village_en}
                  </strong>
                </div>
              </div>
            </div>

            {/* Permitted Activities */}
            <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 text-xs space-y-2">
              <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t('plot_what_you_can_do')}</span>
              </h4>
              <ul className="space-y-1.5 pl-2">
                {(isMl
                  ? currentParcel.permitted_activities_ml
                  : currentParcel.permitted_activities_en
                ).map((act, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-slate-800 font-medium">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Restricted Activities */}
            <div className="bg-red-50/80 p-4 rounded-xl border border-red-200 text-xs space-y-2">
              <h4 className="font-bold text-red-950 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-red-600" />
                <span>{t('plot_restricted_actions')}</span>
              </h4>
              <ul className="space-y-1.5 pl-2">
                {(isMl
                  ? currentParcel.restricted_activities_ml
                  : currentParcel.restricted_activities_en
                ).map((act, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-slate-800 font-medium">
                    <span className="text-red-600 font-bold">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function btn_check_text(isMl: boolean) {
  return isMl ? 'അനുമതി സാധുത പരിശോധിക്കുക' : 'Evaluate Building Feasibility';
}

export default function BuildCheckPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <BuildCheckContent />
    </Suspense>
  );
}
