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
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { getParcelBySurveyNumber, getParcels } from '@/lib/api';
import { LandParcel, SitingEvaluation } from '@/lib/types';
import { evaluateSitingCompliance } from '@/lib/siting-rules';

function BuildCheckContent() {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialSurvey = searchParams.get('survey') || '412/2';
  const [surveyNumber, setSurveyNumber] = useState<string>(initialSurvey);
  const [buildingType, setBuildingType] = useState<string>('residential');
  const [address, setAddress] = useState<string>('Cheruvannur Central, Ward 7');
  const [allParcels, setAllParcels] = useState<LandParcel[]>([]);
  const [evaluation, setEvaluation] = useState<SitingEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const parcelsList = await getParcels();
        setAllParcels(parcelsList);

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
    const found = allParcels.find((p) => p.survey_number.toLowerCase() === surveyNumber.trim().toLowerCase());
    if (found) {
      setEvaluation(evaluateSitingCompliance(found, buildingType));
    }
  };

  const handleSelectSurvey = (sNo: string) => {
    setSurveyNumber(sNo);
    const found = allParcels.find((p) => p.survey_number === sNo);
    if (found) {
      setEvaluation(evaluateSitingCompliance(found, buildingType));
    }
  };

  if (loading && !evaluation) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('build_check_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              C2 Automated Building Pre-Check · Sanketham & ReLIS Digital Verification
            </p>
          </div>
        </div>
        <SourceChip screenKey="build_check" />
      </div>

      {/* Advisory Banner */}
      <div className="bg-slate-100 border border-slate-300 p-3.5 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Statutory Disclaimer:</strong> This portal offers an automated digital twin pre-check based on digitized cadastral registers and KSDMA flood layers. Official formal permits must be obtained via the Government of Kerala Sanketham portal.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Survey Input */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">{t('build_survey_label')}:</label>
            <input
              type="text"
              value={surveyNumber}
              onChange={(e) => setSurveyNumber(e.target.value)}
              placeholder="e.g. 412/2"
              className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
              className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="residential">{t('build_type_res')}</option>
              <option value="commercial">{t('build_type_comm')}</option>
            </select>
          </div>

          {/* Location / Address */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Property Address / Ward:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-500 font-medium">Test Parcels:</span>
              <button
                type="button"
                onClick={() => handleSelectSurvey('412/2')}
                className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold hover:bg-red-200"
              >
                412/2 (Nilam / Fail)
              </button>
              <button
                type="button"
                onClick={() => handleSelectSurvey('308/1')}
                className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200"
              >
                308/1 (Purayidom / Pass)
              </button>
              <button
                type="button"
                onClick={() => handleSelectSurvey('324/2')}
                className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold hover:bg-amber-200"
              >
                324/2 (Hazard / Needs Approval)
              </button>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition-colors flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>{t('btn_check_compliance')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Instant Verdict Card */}
      {evaluation && (
        <div
          className={`p-6 rounded-2xl border shadow-md space-y-5 ${
            evaluation.citizen_verdict === 'PASS'
              ? 'bg-emerald-50 border-emerald-300'
              : evaluation.citizen_verdict === 'NEEDS APPROVAL'
              ? 'bg-amber-50 border-amber-300'
              : 'bg-red-50 border-red-300'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
            <div className="flex items-center gap-3">
              {evaluation.citizen_verdict === 'PASS' ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-600 flex-shrink-0" />
              ) : evaluation.citizen_verdict === 'NEEDS APPROVAL' ? (
                <AlertTriangle className="w-10 h-10 text-amber-600 flex-shrink-0" />
              ) : (
                <AlertOctagon className="w-10 h-10 text-red-600 flex-shrink-0" />
              )}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Automated Building Feasibility Verdict
                </span>
                <h2
                  className={`text-2xl sm:text-3xl font-black ${
                    evaluation.citizen_verdict === 'PASS'
                      ? 'text-emerald-800'
                      : evaluation.citizen_verdict === 'NEEDS APPROVAL'
                      ? 'text-amber-800'
                      : 'text-red-800'
                  }`}
                >
                  {evaluation.citizen_verdict}
                </h2>
              </div>
            </div>

            <Link
              href={`/citizen/plot?survey=${evaluation.parcel.survey_number}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold shadow-2xs transition-colors"
            >
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>{t('btn_view_in_plot')}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {/* Plain-Language Findings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800">
              Statutory Evaluation Findings
            </h3>
            <div className="space-y-2">
              {evaluation.reasons.map((r, i) => (
                <div
                  key={i}
                  className="p-3 bg-white/90 rounded-lg border border-slate-200 shadow-2xs text-xs space-y-1"
                >
                  <p className="font-bold text-slate-900">{r.message_en}</p>
                  <p className="text-slate-600 text-[11px] font-malayalam">{r.message_ml}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Guidance */}
          <div className="pt-2 text-xs text-slate-600">
            {evaluation.citizen_verdict === 'PASS' ? (
              <p className="text-emerald-900 font-medium">
                This plot satisfies standard Kerala Panchayat Building Rules. You may proceed to prepare structural blueprints with an empaneled engineer and submit via Sanketham.
              </p>
            ) : evaluation.citizen_verdict === 'NEEDS APPROVAL' ? (
              <p className="text-amber-950 font-medium">
                Additional structural NOCs (Disaster Management plinth elevation or slope stability clearance) are mandated prior to municipal clearance.
              </p>
            ) : (
              <p className="text-red-950 font-medium">
                Construction on registered Nilam (Paddy land) or road setback breach is strictly prohibited under the Kerala Conservation of Paddy Land & Wetland Act. Infilling or unauthorized building will incur statutory penalties.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuildCheckPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading build check...</div>}>
      <BuildCheckContent />
    </Suspense>
  );
}
