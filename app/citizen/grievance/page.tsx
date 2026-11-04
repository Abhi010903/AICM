'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileQuestion,
  MapPin,
  Camera,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { SourceChip } from '@/components/common/SourceChip';
import { InteractiveMap } from '@/components/maps/InteractiveMap';
import { getAllGrievances } from '@/lib/demo-store';
import { getGrievances } from '@/lib/api';
import { Grievance, GrievanceCategory } from '@/lib/types';
import { translateGrievanceDescription } from '@/lib/grievance-translation';

export default function GrievanceTaggingPage() {
  const { t, language, getLocalizedDescription, getLocalizedStatus, getLocalizedCategory } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();

  const isMl = language === 'ml';
  const [category, setCategory] = useState<GrievanceCategory>('road');
  const [description, setDescription] = useState<string>('');
  const [pinCoords, setPinCoords] = useState<[number, number]>([11.3055, 75.8852]); // Default in Ward 7
  const [wardId, setWardId] = useState<number>(7);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [submittedTicket, setSubmittedTicket] = useState<Grievance | null>(null);
  const [myGrievances, setMyGrievances] = useState<Grievance[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.profileWardId) {
      setWardId(session.profileWardId);
    }
  }, [session?.profileWardId]);

  const loadMyGrievances = useCallback(async () => {
    if (!session?.phone) {
      setHistoryLoading(false);
      return;
    }
    try {
      setHistoryLoading(true);
      setMyGrievances(await getGrievances(undefined, session.phone));
      setHistoryError(null);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'Unable to load your grievances.');
    } finally {
      setHistoryLoading(false);
    }
  }, [session?.phone]);

  useEffect(() => {
    void loadMyGrievances();
  }, [loadMyGrievances]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleMapClick = (lat: number, lng: number) => {
    setPinCoords([lat, lng]);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const clearAttachment = () => {
        setPhotoName(null);
        if (photoPreview) {
          URL.revokeObjectURL(photoPreview);
        }
        setPhotoPreview(null);
        e.target.value = '';
      };

      if (!file.type.startsWith('image/')) {
        setFormError(
          isMl
            ? 'സാധുവായ ചിത്രങ്ങൾ (JPEG, PNG, WebP) മാത്രമേ സ്വീകരിക്കൂ.'
            : 'Only valid image files (JPEG, PNG, WebP) are accepted.'
        );
        clearAttachment();
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError(
          isMl
            ? 'ഫയൽ വലുപ്പം 5 MB യിൽ കുറവായിരിക്കണം.'
            : 'Image size must be 5 MB or less.'
        );
        clearAttachment();
        return;
      }

      setFormError(null);
      setPhotoName(file.name);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) {
      setFormError(isMl ? 'ദയവായി പരാതിയുടെ വിശദാംശങ്ങൾ നൽകുക.' : 'Please enter a description for the grievance.');
      return;
    }
    if (!session?.profileName || !session.phone || !session.profileBlock) {
      setFormError(
        isMl
          ? 'പൗര പ്രൊഫൈൽ വിവരങ്ങൾ അപൂർണ്ണമാണ്. ദയവായി വീണ്ടും ലോഗിൻ ചെയ്യുക.'
          : 'Your verified citizen profile is missing. Please sign in again before filing a grievance.'
      );
      return;
    }
    if (trimmed.length > 500) {
      setFormError(
        isMl
          ? 'വിശദാംശങ്ങൾ 500 അക്ഷരങ്ങളിൽ കൂടാൻ പാടില്ല.'
          : 'Description cannot exceed 500 characters.'
      );
      return;
    }

    const existingIds = new Set(getAllGrievances().map((g) => g.id));
    let randomSuffix = Math.floor(1000 + Math.random() * 9000);
    while (existingIds.has(`TK-2026-${randomSuffix}`)) {
      randomSuffix = Math.floor(1000 + Math.random() * 9000);
    }

    const newTicket: Grievance = {
      id: `TK-2026-${randomSuffix}`,
      ward_id: wardId,
      category,
      description_en: isMl ? translateGrievanceDescription(trimmed, 'en') : trimmed,
      description_ml: isMl ? trimmed : translateGrievanceDescription(trimmed, 'ml'),
      lat: Number(pinCoords[0].toFixed(5)),
      lng: Number(pinCoords[1].toFixed(5)),
      status: 'open',
      filed_date: '2026-10-30',
      assigned_dept:
        category === 'road'
          ? 'Public Works Engineering'
          : category === 'water'
          ? 'Kerala Water Authority'
          : category === 'lighting'
          ? 'KSEB Electrical Section'
          : 'LSGD Sanitation',
      reporter_name: session.profileName,
      reporter_phone: session.phone,
      reporter_block: session.profileBlock,
      local_photo_name: photoName || undefined,
    };

    try {
      const response = await fetch('/api/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || 'Unable to submit grievance.');
      }
      const created = (await response.json()) as Grievance;
      setSubmittedTicket(created);
      setMyGrievances((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setFormError(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to submit grievance.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('nav_report_problem')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {isMl
                ? 'C11 പരാതി ജിയോ-ടാഗിംഗ് · സി.എം.ഒ പരാതി പരിഹാര സംവിധാനം'
                : 'C11 Spatial Grievance Geo-Tagging · CMO Grievance & Citizen Interface'}
            </p>
          </div>
        </div>
        <SourceChip screenKey="grievance" />
      </div>

      {/* Walkthrough Tip */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-3.5 rounded-r-lg text-xs text-blue-900 flex items-center justify-between">
        <div>
          <span className="font-bold">{isMl ? 'ഡെമോ പാത (ഘട്ടം 7):' : 'Reviewer Script (Step 7):'}</span>{' '}
          {isMl ? (
            <>
              മാപ്പിൽ തൊട്ട് ലൊക്കേഷൻ പിൻ രേഖപ്പെടുത്തി പരാതി സമർപ്പിക്കുക. ഇത് ഉടനടി <strong>എംഎൽഎ ഹസാർഡ് വ്യൂവിൽ</strong> പ്രതിഫലിക്കും.
            </>
          ) : (
            <>
              Tap on the map to drop a pin, describe the issue, and submit. The generated ticket will immediately appear in the <strong>MLA Hazard Hotspot view</strong> (continuity verified).
            </>
          )}
        </div>
      </div>

      {submittedTicket ? (
        /* Success Confirmation Card */
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-md">
          <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-emerald-950">
              {t('grievance_ticket_success')}
            </h2>
            <div className="inline-block bg-white border border-emerald-300 px-4 py-1.5 rounded-full text-base font-mono font-bold text-emerald-900 shadow-2xs">
              {t('grievance_ticket_no')}: {submittedTicket.id}
            </div>
            <p className="text-xs text-emerald-800 max-w-md mx-auto">
              {isMl
                ? `നിങ്ങളുടെ പരാതി (${submittedTicket.lat}, ${submittedTicket.lng}) സ്ഥാനത്ത് രേഖപ്പെടുത്തുകയും ${submittedTicket.assigned_dept} ലേക്ക് അയക്കുകയും ചെയ്തു.`
                : `Your grievance has been geotagged at coordinate (${submittedTicket.lat}, ${submittedTicket.lng}) and assigned to the ${submittedTicket.assigned_dept}.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => router.push('/president/hazard')}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
            >
              <span>{t('grievance_view_on_map')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setSubmittedTicket(null);
                setDescription('');
                setPhotoName(null);
                setPhotoPreview(null);
              }}
              className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-colors"
            >
              {isMl ? 'മറ്റൊരു പരാതി നൽകുക' : 'File Another Grievance'}
            </button>
          </div>
        </div>
      ) : (
        /* Submission Form */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category & Ward */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">{t('grievance_category')}:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GrievanceCategory)}
                  className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="road">{isMl ? 'റോഡിലെ കുഴികൾ / തകരാർ' : 'Road Damage / Potholes'}</option>
                  <option value="water">{isMl ? 'കുടിവെള്ള വിതരണം / പൈപ്പ് ചോർച്ച' : 'Drinking Water Supply / Pipeline Leak'}</option>
                  <option value="lighting">{isMl ? 'തെരുവ് വിളക്ക് തകരാർ' : 'Streetlight Non-functional'}</option>
                  <option value="sanitation">{isMl ? 'ഓവുചാൽ തടസ്സം / മാലിന്യക്കൂമ്പാരം' : 'Drainage Blockage / Waste Accumulation'}</option>
                  <option value="other">{isMl ? 'പൊതു അടിസ്ഥാന സൗകര്യം / മറ്റുള്ളവ' : 'Public Infrastructure / Other'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  {isMl ? 'വാർഡ് നമ്പർ:' : 'Ward Number:'}
                </label>
                <select
                  value={wardId}
                  onChange={(e) => setWardId(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {[...Array(14)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {isMl ? `വാർഡ് ${i + 1}` : `Ward ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-900">
              <strong>{isMl ? 'സ്ഥിരീകരിച്ച പ്രൊഫൈൽ:' : 'Verified profile:'}</strong> {session?.profileName || (isMl ? 'പൗരൻ' : 'Citizen')} · {session?.phone || '—'} · {session?.profileBlock || '—'}
            </div>

            {/* Description */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700">{t('grievance_description')}:</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  isMl
                    ? 'പ്രശ്നത്തിന്റെ വിവരങ്ങളും സ്ഥലവും വ്യക്തമായി എഴുതുക...'
                    : 'Explain the issue, exact landmark, and how long it has been unresolved...'
                }
                className="w-full p-3 bg-slate-50 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Photo Attachment (Local Preview Only) */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-slate-500" />
                <span>{t('grievance_photo')}</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {photoPreview && (
                <div className="mt-2 w-32 h-24 rounded-lg overflow-hidden border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Tap Map to Drop Pin */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>{t('grievance_location_hint')}</span>
                </label>
                <span className="font-mono text-slate-500 text-[11px]">
                  {isMl ? 'സ്ഥാനം:' : 'Pinned:'} {pinCoords[0].toFixed(5)}, {pinCoords[1].toFixed(5)}
                </span>
              </div>

              <InteractiveMap
                center={pinCoords}
                zoom={16}
                selectedPoint={pinCoords}
                onMapClick={handleMapClick}
                height="280px"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('grievance_submit')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {isMl ? 'ഞാൻ നൽകിയ പരാതികൾ' : 'My filed grievances'}
            </h2>
            <p className="text-xs text-slate-600">
              {isMl
                ? 'നിങ്ങളുടെ പ്രൊഫൈലിൽ നിന്നുള്ള പരാതികളുടെ തത്സമയ വിവരങ്ങൾ.'
                : 'Status updates for complaints filed from your verified Aadhaar profile.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadMyGrievances()}
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500"
          >
            {isMl ? 'വിവരങ്ങൾ പുതുക്കുക' : 'Refresh status'}
          </button>
        </div>
        {historyError && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-800">{historyError}</p>}
        {historyLoading ? (
          <p className="mt-4 text-xs text-slate-500">{t('loading')}</p>
        ) : myGrievances.length === 0 ? (
          <p className="mt-4 text-xs text-slate-500">
            {isMl ? 'ഈ പ്രൊഫൈലിൽ നിന്ന് ഇതുവരെ പരാതികൾ സമർപ്പിച്ചിട്ടില്ല.' : 'No grievances have been filed from this profile yet.'}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {myGrievances.map((grievance) => (
              <div key={grievance.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">{grievance.id}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                      grievance.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : grievance.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {getLocalizedStatus(grievance.status)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-700">
                  {getLocalizedDescription(grievance)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  {isMl ? `വാർഡ് ${grievance.ward_id}` : `Ward ${grievance.ward_id}`} · {getLocalizedCategory(grievance.category)} · {grievance.filed_date}
                </p>
                {grievance.resolution_note && (
                  <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-900">
                    <strong>{isMl ? 'ഏറ്റവും പുതിയ വിവരങ്ങൾ:' : 'Latest update:'}</strong> {grievance.resolution_note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
