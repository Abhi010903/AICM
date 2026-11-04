'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Home,
  FileText,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building,
  Clock,
  Layers,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { SourceChip } from '@/components/common/SourceChip';
import { getCitizenProperties, getProfileExtension, saveProfileExtension } from '@/lib/citizen-store';
import { getGrievances } from '@/lib/api';
import { CitizenProperty, Grievance } from '@/lib/types';

export default function CitizenProfilePage() {
  const { t, language } = useTranslation();
  const { session } = useAuth();
  const isMl = language === 'ml';

  const citizenName = session?.profileName || session?.citizenAlias || (isMl ? 'പൗരൻ' : 'Citizen');
  const citizenInitials = citizenName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CZ';

  const village = session?.profileBlock || (isMl ? 'ചെറുവണ്ണൂർ / തെക്കുംപുരം' : 'Cheruvannur / Thekkumpuram');
  const wardId = session?.profileWardId || 7;
  const maskedPhone = session?.maskedPhone || '+91 ••••• ••456';
  const aadhaarLast4 = session?.aadhaarLast4 || '0123';

  const [properties, setProperties] = useState<CitizenProperty[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);

  // Editable fields (non-sensitive preferences only)
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.phone) {
      setLoading(false);
      return;
    }
    const props = getCitizenProperties(session.phone);
    setProperties(props);

    const ext = getProfileExtension(session.phone);
    if (ext.email) setEmail(ext.email);
    if (ext.address) setAddress(ext.address);

    getGrievances(undefined, session.phone)
      .then((gList) => setGrievances(gList))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.phone]);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.phone) return;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSaveError(isMl ? 'സാധുവായ ഇമെയിൽ വിലാസം നൽകുക.' : 'Please enter a valid email address.');
      setSaveSuccess(false);
      return;
    }

    saveProfileExtension(session.phone, {
      email: email.trim(),
      address: address.trim(),
    });
    setSaveError(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Page Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <User className="w-7 h-7 text-coconut-700" />
              <span>{t('profile_title')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {t('profile_subtitle')}
            </p>
          </div>
        </div>
        <SourceChip screenKey="citizen_profile" />
      </div>

      {/* Demo Sandbox Security Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl text-xs text-amber-900 space-y-1">
        <div className="font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          <span>{isMl ? 'ഡെമോ പൗര പരിശോധനാ അറിയിപ്പ്' : 'Demonstration Citizen Verification Notice'}</span>
        </div>
        <p className="text-amber-800 leading-relaxed">
          {isMl
            ? 'ആധാർ നമ്പറുകൾ എഐസിഎം ഡാറ്റാബേസിൽ ഒരിക്കലും സൂക്ഷിക്കുന്നില്ല. സുരക്ഷിതമായ പ്രോട്ടോടൈപ്പ് പരിശോധനയ്ക്കായി ഈ സെഷൻ സ്ഥിരീകരിച്ച ഡെമോ പൗര റെക്കോർഡുമായി ബന്ധിപ്പിച്ചിരിക്കുന്നു.'
            : 'Aadhaar numbers are never stored in AICM per privacy mandates. In this demonstration portal, user identities are securely represented by pre-configured demo citizens linked to Ward 7 (Kunnamangalam).'}
        </p>
      </div>

      {/* Identity Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-coconut-700 text-white font-black text-xl flex items-center justify-center shadow-md">
              {citizenInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{citizenName}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('profile_status_verified')}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {t('profile_alias')}: <span className="font-mono font-semibold text-slate-700">{session?.citizenAlias || 'Citizen-007'}</span>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1">
            <div className="text-slate-500">{t('profile_session_info')}</div>
            <div className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
              ACTIVE · TTL 8h
            </div>
          </div>
        </div>

        {/* Read-Only Verified Citizen Data (Protected Boundaries) */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>{isMl ? 'സ്ഥിരീകരിച്ച ഐഡന്റിറ്റി വിവരങ്ങൾ (മാറ്റാൻ കഴിയില്ല)' : 'Verified Identity Records (Locked)'}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">{t('profile_mobile')}</span>
              <strong className="text-slate-900 font-mono text-sm">{maskedPhone}</strong>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">{t('profile_aadhaar_status')}</span>
              <strong className="text-emerald-800 font-semibold text-sm">•••• •••• {aadhaarLast4} (e-KYC)</strong>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">{t('profile_village')}</span>
              <strong className="text-slate-900 text-sm">{village}</strong>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">{t('profile_ward')}</span>
              <strong className="text-slate-900 text-sm">{t('ward_col_ward')} {wardId}</strong>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">{t('profile_panchayat')}</span>
              <strong className="text-slate-900 text-sm">Kunnamangalam</strong>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">{t('profile_district')}</span>
              <strong className="text-slate-900 text-sm">Kozhikode, Kerala</strong>
            </div>
          </div>
        </div>

        {/* Associated Records Summary */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            {isMl ? 'ബന്ധിപ്പിച്ച രേഖകൾ' : 'Associated Account Holdings'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/citizen/plot"
              className="p-4 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs group-hover:text-blue-700">
                    {t('profile_registered_properties')}
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    {properties.length} {isMl ? 'വസ്തുവകകൾ രജിസ്റ്റർ ചെയ്തു' : 'properties on record'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/citizen/complaints"
              className="p-4 bg-amber-50/60 hover:bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-600 text-white rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs group-hover:text-amber-700">
                    {t('profile_active_grievances')}
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    {grievances.length} {isMl ? 'പരാതികൾ സമർപ്പിച്ചു' : 'complaints submitted'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Editable Contact Preferences (Authorized Citizen Profile Scope) */}
        <div className="pt-4 border-t border-slate-100">
          <div className="mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {isMl ? 'ആശയവിനിമയ വിവരങ്ങൾ പുതുക്കുക' : 'Update Communication Preferences'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isMl
                ? 'സർക്കാർ അറിയിപ്പുകൾ ലഭിക്കുന്നതിനുള്ള ഇമെയിലും വിലാസവും ഇവിടെ മാറ്റാം.'
                : 'Manage correspondence details for official service notifications and grievance receipts.'}
            </p>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('profile_email')}</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-coconut-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('profile_comm_address')}</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isMl ? 'വീട്ടുപേര്, റോഡ്, പിൻകോഡ്...' : 'House name, Street, PIN code...'}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-coconut-500 focus:outline-none"
                />
              </div>
            </div>

            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{t('profile_edit_success')}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 bg-coconut-700 hover:bg-coconut-800 text-white text-xs font-bold rounded-xl shadow transition-colors"
              >
                {t('profile_save_changes')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
