'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MapPin,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { InteractiveMap } from '@/components/maps/InteractiveMap';
import { getParcelBySurveyNumber, getParcels } from '@/lib/api';
import { LandParcel } from '@/lib/types';

function MyPlotContent() {
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isMl = language === 'ml';
  const initialSurvey = searchParams.get('survey') || '412/2';
  const [searchInput, setSearchInput] = useState<string>(initialSurvey);
  const [currentParcel, setCurrentParcel] = useState<LandParcel | null>(null);
  const [allParcels, setAllParcels] = useState<LandParcel[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pData, parcelsList] = await Promise.all([
          getParcelBySurveyNumber(initialSurvey),
          getParcels(),
        ]);
        setCurrentParcel(pData);
        setAllParcels(parcelsList);
      } catch (err) {
        console.error('Failed to load parcel data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [initialSurvey]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const found = await getParcelBySurveyNumber(searchInput);
      if (found) {
        setCurrentParcel(found);
      } else {
        setErrorMsg(
          isMl
            ? `സർവേ നമ്പർ "${searchInput}" ഡെമോ രേഖകളിൽ കണ്ടെത്താനായില്ല.`
            : `Survey parcel "${searchInput}" was not found in demo records.`
        );
      }
    } catch {
      setErrorMsg(isMl ? 'തിരയുന്നതിൽ പിശകുണ്ടായി.' : 'Error searching for parcel.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoParcel = (sNo: string) => {
    setSearchInput(sNo);
    const p = allParcels.find((x) => x.survey_number === sNo);
    if (p) {
      setCurrentParcel(p);
      setErrorMsg(null);
    }
  };

  if (loading && !currentParcel) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  // Map polygon setup
  const parcelCoords = currentParcel?.geometry.coordinates[0][0] || [75.885, 11.305];
  const mapCenter: [number, number] = [parcelCoords[1], parcelCoords[0]];

  const mapPolygons = currentParcel
    ? [
        {
          id: `parcel_${currentParcel.survey_number}`,
          coordinates: currentParcel.geometry.coordinates,
          color:
            currentParcel.classification === 'nilam'
              ? '#dc2626'
              : currentParcel.classification === 'wetland'
              ? '#ca8a04'
              : '#2563eb',
          label: isMl
            ? `സർവേ ${currentParcel.survey_number} · ${currentParcel.classification}`
            : `Survey No: ${currentParcel.survey_number} · ${currentParcel.classification.toUpperCase()}`,
          fillOpacity: 0.55,
        },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('nav_my_plot')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {isMl
                ? 'C1 എന്റെ ഭൂമി ഭൂപടത്തിൽ · എന്റെ ഭൂമി & റീലിസ് കഡാസ്ട്രൽ രേഖകൾ'
                : 'C1 My Plot on the Map · Ente Bhoomi & ReLIS Cadastral Records'}
            </p>
          </div>
        </div>
        <SourceChip screenKey="plot" />
      </div>

      {/* Walkthrough Tip */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-3.5 rounded-r-lg text-xs text-blue-900 flex items-center justify-between">
        <div>
          <span className="font-bold">{isMl ? 'ഡെമോ പാത (ഘട്ടം 6):' : 'Reviewer Script (Step 6):'}</span>{' '}
          {isMl ? (
            <>
              എംഎൽഎ സൈറ്റിംഗിൽ പരിശോധിച്ച അതേ ഭൂമിയുടെ അവകാശങ്ങൾ ലളിതമായ ഭാഷയിൽ കാണാൻ സർവേ നമ്പർ <strong>412/2</strong> തിരയുക.
            </>
          ) : (
            <>
              Search for survey number <strong>412/2</strong> to view the plain-language cadastral rights for the same parcel evaluated in MLA Siting.
            </>
          )}
        </div>
        <button
          onClick={() => handleSelectDemoParcel('412/2')}
          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] ml-2 flex-shrink-0"
        >
          {isMl ? '412/2 കാണുക' : 'Load 412/2'}
        </button>
      </div>

      {/* Survey Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                isMl
                  ? 'സർവേ നമ്പർ നൽകുക (ഉദാ: 412/2, 316/3, 324/4)...'
                  : 'Enter Survey Number (e.g., 412/2, 316/3, 324/4)...'
              }
              className="w-full pl-9 p-2.5 bg-slate-50 rounded-lg border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t('search')}</span>
          </button>
        </form>

        {/* Quick Demo Parcel Chips */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-slate-500 font-semibold">{isMl ? 'മാതൃകാ നമ്പറുകൾ:' : 'Demo Parcels:'}</span>
          {allParcels.slice(0, 6).map((p) => (
            <button
              key={p.survey_number}
              onClick={() => handleSelectDemoParcel(p.survey_number)}
              className={`px-2 py-0.5 rounded border transition-colors ${
                currentParcel?.survey_number === p.survey_number
                  ? 'bg-blue-600 text-white border-blue-700 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              {p.survey_number} ({p.classification})
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {currentParcel && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Interactive Map & Boundary */}
          <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>
                  {isMl ? 'കഡാസ്ട്രൽ അതിർത്തിയും കോർഡിനേറ്റുകളും' : 'Cadastral Polygon & Bounding Coordinates'}
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
              height="380px"
            />

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
              <span>
                {isMl
                  ? 'എന്റെ ഭൂമി കഡാസ്ട്രൽ അതിർത്തി രേഖ'
                  : 'GeoJSON Boundary Layer · Ente Bhoomi Cadastral Grid'}
              </span>
              <button
                onClick={() => router.push(`/citizen/build-check?survey=${currentParcel.survey_number}`)}
                className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>{t('check_building_permission')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right 1 Col: Plain Language Rights & Constraints */}
          <div className="space-y-4">
            {/* Classification & Attributes Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {t('cadastral_record')}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {isMl
                      ? `സർവേ ${currentParcel.survey_number}`
                      : `Survey ${currentParcel.survey_number}`}
                  </h3>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    currentParcel.classification === 'nilam'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : currentParcel.classification === 'wetland'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {t(`class_${currentParcel.classification}`)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-500 block">{t('total_area')}</span>
                  <strong className="text-slate-900">
                    {currentParcel.area_cents} {t('cents')}
                  </strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-500 block">{t('hazard_exposure')}</span>
                  <strong className="text-amber-700 uppercase">
                    {t(`hazard_${currentParcel.hazard_zone}`)}
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
                <XCircle className="w-4 h-4 text-red-600" />
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

export default function MyPlotPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">{t('loading')}</div>}>
      <MyPlotContent />
    </Suspense>
  );
}
