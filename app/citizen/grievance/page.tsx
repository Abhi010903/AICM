'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileQuestion,
  MapPin,
  Camera,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Crosshair,
  Upload,
  X,
  ShieldCheck,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { SourceChip } from '@/components/common/SourceChip';
import { InteractiveMap } from '@/components/maps/InteractiveMap';
import { useCitizenLocation } from '@/lib/location-context';
import { getAllGrievances } from '@/lib/demo-store';
import { Grievance, GrievanceCategory, GrievanceSeverity } from '@/lib/types';
import { translateGrievanceDescription } from '@/lib/grievance-translation';

export default function GrievanceTaggingPage() {
  const { t, language } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();
  const { location, requestGpsLocation, error: locationError } = useCitizenLocation();

  const isMl = language === 'ml';

  // Form states
  const [category, setCategory] = useState<GrievanceCategory>('pothole');
  const [otherCategoryTitle, setOtherCategoryTitle] = useState<string>('');
  const [severity, setSeverity] = useState<GrievanceSeverity>('medium');
  const [description, setDescription] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [wardId, setWardId] = useState<number>(session?.profileWardId || 7);

  // Location method: 'gps' | 'map'
  const [locMethod, setLocMethod] = useState<'gps' | 'map'>('map');
  const [pinCoords, setPinCoords] = useState<[number, number]>([11.3055, 75.8852]); // Ward 7 Cheruvannur
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // File Attachment
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Submission & Validation States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<Grievance | null>(null);

  useEffect(() => {
    if (session?.profileWardId) {
      setWardId(session.profileWardId);
    }
  }, [session?.profileWardId]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  // Request browser GPS via universal shared location service
  const handleRequestGps = async () => {
    setGpsLoading(true);
    setGpsError(null);

    const ok = await requestGpsLocation();
    if (ok) {
      setPinCoords([location.lat, location.lng]);
      setLocMethod('gps');
    } else {
      setGpsError(
        locationError ||
          (isMl
            ? 'ലൊക്കേഷൻ അനുമതി നിരസിച്ചു. മാപ്പിൽ തൊട്ട് സ്ഥാനം തിരഞ്ഞെടുക്കുക.'
            : 'Location permission denied. Please tap on the map to pin the location.')
      );
    }
    setGpsLoading(false);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPinCoords([Number(lat.toFixed(5)), Number(lng.toFixed(5))]);
    setLocMethod('map');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const clearPhoto = () => {
        setPhotoFile(null);
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
        e.target.value = '';
      };

      if (!file.type.startsWith('image/')) {
        setFormError(
          isMl
            ? 'സാധുവായ ചിത്രങ്ങൾ (JPEG, PNG, WebP) മാത്രമേ സ്വീകരിക്കൂ.'
            : 'Only valid image files (JPEG, PNG, WebP) are accepted.'
        );
        clearPhoto();
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setFormError(
          isMl
            ? 'ഫയൽ വലുപ്പം 5 MB യിൽ കുറവായിരിക്കണം.'
            : 'Image size must be 5 MB or less.'
        );
        clearPhoto();
        return;
      }

      setFormError(null);
      setPhotoFile(file);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  // Determine assigned department based on category
  const getDepartment = (cat: GrievanceCategory): string => {
    switch (cat) {
      case 'road':
      case 'pothole':
        return 'Public Works Engineering (LSGD)';
      case 'water':
        return 'Kerala Water Authority (KWA)';
      case 'lighting':
        return 'KSEB Electrical Section';
      case 'drainage':
      case 'sanitation':
      case 'waterlogging':
      case 'waste':
        return 'LSGD Health & Sanitation';
      case 'public_facility':
      case 'infrastructure':
        return 'Panchayat Engineering Division';
      case 'other':
      default:
        return 'Grama Panchayat General Administration';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate clicks

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setFormError(
        isMl
          ? 'ദയവായി പ്രശ്നത്തിന്റെ വിവരങ്ങൾ നൽകുക.'
          : 'Please enter a description for the problem.'
      );
      return;
    }

    if (!session?.phone) {
      setFormError(
        isMl
          ? 'പൗര പ്രൊഫൈൽ വിവരങ്ങൾ ലഭ്യമല്ല. ദയവായി ലോഗിൻ ചെയ്യുക.'
          : 'Authenticated citizen session is missing. Please sign in.'
      );
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    // Generate unique reference ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const uniqueId = `TK-2026-${randomSuffix}`;

    const effectiveDesc = category === 'other' && otherCategoryTitle.trim()
      ? `[${otherCategoryTitle.trim()}] ${trimmedDesc}`
      : trimmedDesc;

    const newTicket: Grievance = {
      id: uniqueId,
      ward_id: wardId,
      category,
      severity,
      description_en: isMl ? translateGrievanceDescription(effectiveDesc, 'en') : effectiveDesc,
      description_ml: isMl ? effectiveDesc : translateGrievanceDescription(effectiveDesc, 'ml'),
      lat: pinCoords[0],
      lng: pinCoords[1],
      status: 'submitted',
      filed_date: new Date().toISOString().split('T')[0],
      assigned_dept: getDepartment(category),
      reporter_name: session.profileName || 'Citizen',
      reporter_phone: session.phone,
      reporter_block: session.profileBlock || 'Kunnamangalam',
      local_photo_name: photoFile ? photoFile.name : undefined,
    };

    try {
      const response = await fetch('/api/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || 'Failed to submit grievance.');
      }

      const created = (await response.json()) as Grievance;
      setSubmittedTicket(created);
      setIsSubmitting(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to submit grievance.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Page Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('nav_report_problem')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {isMl
                ? 'പഞ്ചായത്ത് പരാതി പരിഹാര സംവിധാനം · തത്സമയ ട്രാക്കിംഗും ജിയോ-ടാഗിംഗും'
                : 'Panchayat Grievance Redressal · Geotagged Issue Reporting & Tracking'}
            </p>
          </div>

          <Link
            href="/citizen/complaints"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>{t('grievance_track_btn')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <SourceChip screenKey="grievance" />
      </div>

      {/* Success Confirmation Card */}
      {submittedTicket ? (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-md animate-fade-in">
          <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-950">
              {t('grievance_success_title')}
            </h2>
            <div className="inline-block bg-white border border-emerald-300 px-5 py-2 rounded-full text-base font-mono font-black text-emerald-900 shadow-2xs">
              {t('grievance_ref_code')}: {submittedTicket.id}
            </div>
            <p className="text-xs text-emerald-900 max-w-lg mx-auto leading-relaxed">
              {isMl
                ? `നിങ്ങളുടെ പരാതി (${submittedTicket.lat}, ${submittedTicket.lng}) സ്ഥാനത്ത് വിജയകരമായി രേഖപ്പെടുത്തി. ഇത് ${submittedTicket.assigned_dept} ലേക്ക് അയച്ചിരിക്കുന്നു.`
                : `Your grievance has been registered at coordinates (${submittedTicket.lat}, ${submittedTicket.lng}) and assigned to the ${submittedTicket.assigned_dept}.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => router.push('/citizen/complaints')}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>{t('grievance_track_btn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setSubmittedTicket(null);
                setDescription('');
                setLandmark('');
                setOtherCategoryTitle('');
                handleRemovePhoto();
              }}
              className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-colors"
            >
              {isMl ? 'മറ്റൊരു പരാതി നൽകുക' : 'File Another Grievance'}
            </button>
          </div>
        </div>
      ) : (
        /* Submission Form Card */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {/* Verified Citizen Profile Summary Bar */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-700 flex-shrink-0" />
              <div>
                <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">
                  {isMl ? 'സ്ഥിരീകരിച്ച പൗര പ്രൊഫൈൽ' : 'Verified Citizen Profile'}
                </span>
                <strong className="text-blue-950 text-sm">
                  {session?.profileName || 'Citizen'}
                </strong>
                <span className="text-blue-800 text-xs ml-2 font-mono">
                  ({session?.phone || '—'})
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] text-blue-900 font-medium">
              <span>{isMl ? 'ബ്ലോക്ക്:' : 'Block:'} {session?.profileBlock || 'Kunnamangalam'}</span>
              <span className="mx-2">·</span>
              <span>{isMl ? `വാർഡ് ${wardId}` : `Ward ${wardId}`}</span>
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Category & Ward Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">{t('grievance_category')} *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GrievanceCategory)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="pothole">{t('grievance_cat_potholes')}</option>
                  <option value="drainage">{t('grievance_cat_drainage')}</option>
                  <option value="water">{isMl ? 'കുടിവെള്ള വിതരണം / പൈപ്പ് ചോർച്ച' : 'Drinking Water Supply / Pipeline Leak'}</option>
                  <option value="lighting">{isMl ? 'തെരുവ് വിളക്ക് തകരാർ' : 'Streetlight Non-functional'}</option>
                  <option value="waste">{t('grievance_cat_waste')}</option>
                  <option value="waterlogging">{t('grievance_cat_waterlogging')}</option>
                  <option value="public_facility">{t('grievance_cat_facility')}</option>
                  <option value="infrastructure">{t('grievance_cat_infrastructure')}</option>
                  <option value="other">{t('grievance_other_label')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  {isMl ? 'ബാധിച്ച വാർഡ്:' : 'Affected Ward:'}
                </label>
                <select
                  value={wardId}
                  onChange={(e) => setWardId(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  {[...Array(14)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {isMl ? `വാർഡ് ${i + 1}` : `Ward ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Category Input if 'other' */}
            {category === 'other' && (
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  {isMl ? 'പ്രശ്നത്തിന്റെ തരം / വിഷയം നൽകുക:' : 'Specify Custom Issue Title:'}
                </label>
                <input
                  type="text"
                  required
                  value={otherCategoryTitle}
                  onChange={(e) => setOtherCategoryTitle(e.target.value)}
                  placeholder={isMl ? 'ഉദാ: പൊതു കിണർ ശുചീകരണം...' : 'e.g., Public Well Cleaning...'}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            )}

            {/* Severity Level Selection */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">{t('grievance_severity_label')}:</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSeverity('low')}
                  className={`p-2 rounded-xl border font-bold text-xs transition-all ${
                    severity === 'low'
                      ? 'bg-slate-200 border-slate-400 text-slate-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t('grievance_severity_low')}
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity('medium')}
                  className={`p-2 rounded-xl border font-bold text-xs transition-all ${
                    severity === 'medium'
                      ? 'bg-blue-100 border-blue-400 text-blue-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t('grievance_severity_med')}
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity('high')}
                  className={`p-2 rounded-xl border font-bold text-xs transition-all ${
                    severity === 'high'
                      ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t('grievance_severity_high')}
                </button>
                <button
                  type="button"
                  onClick={() => setSeverity('critical')}
                  className={`p-2 rounded-xl border font-bold text-xs transition-all ${
                    severity === 'critical'
                      ? 'bg-red-100 border-red-400 text-red-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t('grievance_severity_crit')}
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{t('grievance_description')} *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('grievance_desc_placeholder')}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 text-right block">
                {description.length} / 500 {isMl ? 'അക്ഷരങ്ങൾ' : 'characters'}
              </span>
            </div>

            {/* Landmark input */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{t('grievance_landmark_label')}:</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder={isMl ? 'ഉദാ: ചെറുവണ്ണൂർ നോർത്ത് ജംഗ്ഷന് സമീപം' : 'e.g., Near Cheruvannur North Jct'}
                className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Location Selection: Dual Method (GPS vs Interactive Map Pin) */}
            <div className="space-y-2 pt-1 border-t border-slate-100 min-w-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>{t('grievance_location_hint')}</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRequestGps}
                    disabled={gpsLoading}
                    className="px-3 py-1 bg-coconut-700 hover:bg-coconut-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>
                      {gpsLoading
                        ? isMl ? 'ജി.പി.എസ് പരിശോധിക്കുന്നു...' : 'Acquiring GPS...'
                        : t('grievance_loc_gps')}
                    </span>
                  </button>

                  <span className="font-mono text-slate-500 text-[11px] bg-slate-100 px-2 py-1 rounded">
                    {pinCoords[0].toFixed(5)}, {pinCoords[1].toFixed(5)}
                  </span>
                </div>
              </div>

              {gpsError && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg">
                  {gpsError}
                </p>
              )}

              <InteractiveMap
                center={pinCoords}
                zoom={16}
                selectedPoint={pinCoords}
                onMapClick={handleMapClick}
                height="280px"
              />
              <span className="text-[10px] text-slate-500 block">
                {isMl
                  ? 'മാപ്പിൽ എവിടെയും തൊട്ട് പ്രശ്നമുള്ള സ്ഥാനം കൃത്യമായി അടയാളപ്പെടുത്താം.'
                  : 'Tap anywhere on the map to pin the exact location of the issue.'}
              </span>
            </div>

            {/* Photo Attachment with Preview & Remove */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-slate-500" />
                <span>{t('grievance_photo')} (JPEG / PNG &lt;= 5MB)</span>
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />

                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-1 text-xs font-bold"
                  >
                    <X className="w-4 h-4" />
                    <span>{isMl ? 'ഒഴിവാക്കുക' : 'Remove'}</span>
                  </button>
                )}
              </div>

              {photoPreview && (
                <div className="mt-2 w-36 h-28 rounded-xl overflow-hidden border border-slate-300 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${
                  isSubmitting
                    ? 'bg-emerald-400 cursor-not-allowed'
                    : 'bg-emerald-700 hover:bg-emerald-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? t('grievance_submitting_btn')
                    : t('grievance_submit_btn')}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
