'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  CheckSquare,
  Hospital,
  AlertCircle,
  ArrowRight,
  FileText,
  User,
  ShieldCheck,
  Building,
  Clock,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { SourceChip } from '@/components/common/SourceChip';
import { getWardById, getProjects } from '@/lib/api';
import { Ward, GPDPProject } from '@/lib/types';
import { calculatePerCapitaSpend } from '@/lib/calculations';

export default function CitizenDashboardPage() {
  const { t, language, getLocalizedName } = useTranslation();
  const { session } = useAuth();
  const [ward7, setWard7] = useState<Ward | null>(null);
  const [wardProjects, setWardProjects] = useState<GPDPProject[]>([]);
  const [loading, setLoading] = useState(true);

  const wardId = session?.profileWardId || 7;

  useEffect(() => {
    async function load() {
      try {
        const [wData, pData] = await Promise.all([getWardById(wardId), getProjects(wardId)]);
        setWard7(wData);
        setWardProjects(pData);
      } catch (err) {
        console.error('Failed to load citizen dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [wardId]);

  const perCapita = ward7
    ? calculatePerCapitaSpend(ward7.spend_lakhs, ward7.population)
    : 0;

  const isMl = language === 'ml';

  const citizenName = session?.profileName || session?.citizenAlias || (isMl ? 'പൗരൻ' : 'Citizen');
  const citizenInitials = citizenName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CZ';

  const locality = session?.profileBlock || (isMl ? 'തെക്കുംപുരം ബ്ലോക്ക്' : 'Thekkumpuram Block');
  const maskedPhone = session?.maskedPhone || '+91 ••••• ••456';

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Top Section: Title & Upper-Right Citizen Profile Summary (Part 4.1) */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        {/* Left: Welcome & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('citizen_hero_welcome')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            {isMl
              ? 'കുന്നമംഗലം നിയോജകമണ്ഡലം · സുതാര്യമായ പൗര ഡിജിറ്റൽ സേവനങ്ങൾ'
              : 'Kunnamangalam Constituency · Transparent Citizen Digital Services'}
          </p>
          <SourceChip screenKey="citizen_dashboard" />
        </div>

        {/* Upper-Right: Citizen Profile Summary Card (Part 4.1) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 w-full lg:w-96 flex flex-col justify-between space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-coconut-100 text-coconut-800 font-black text-sm flex items-center justify-center flex-shrink-0 border border-coconut-300 shadow-inner">
              {citizenInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm text-slate-900 truncate">{citizenName}</span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {t('profile_status_verified')}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                <span>{locality}</span> · <span>{t('ward_col_ward')} {wardId}</span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                {maskedPhone}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 text-[11px]">
              {isMl ? 'പഞ്ചായത്ത്: കുന്നമംഗലം · കോഴിക്കോട്' : 'Panchayat: Kunnamangalam · Kozhikode'}
            </span>
            <Link
              href="/citizen/profile"
              className="font-bold text-coconut-700 hover:text-coconut-800 flex items-center gap-1 text-[11px] transition-colors"
            >
              <span>{t('profile_view_action')}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Citizen Ward Scorecard Chip (Part 4.2) */}
      {ward7 && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-800/80 px-2.5 py-0.5 rounded-full mb-1">
                {t('citizen_assigned_ward')}
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                {isMl ? `വാർഡ് ${ward7.number}: ${getLocalizedName(ward7)}` : `Ward ${ward7.number}: ${getLocalizedName(ward7)}`}
              </h2>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                {isMl
                  ? `ജനസംഖ്യ: ${ward7.population.toLocaleString()} · കുടുംബങ്ങൾ: ${ward7.households}`
                  : `Population: ${ward7.population.toLocaleString()} · Households: ${ward7.households}`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-emerald-950/70 p-3 rounded-xl border border-emerald-800/60">
                <span className="text-emerald-300 block text-[11px]">{isMl ? 'PDI സ്കോർ' : 'PDI Score'}</span>
                <strong className="text-lg font-black text-white">{ward7.pdi_score}</strong>
              </div>
              <div className="bg-emerald-950/70 p-3 rounded-xl border border-emerald-800/60">
                <span className="text-emerald-300 block text-[11px]">{isMl ? 'ആളോഹരി ചെലവ്' : 'Spend/Capita'}</span>
                <strong className="text-lg font-black text-white">₹{perCapita.toLocaleString()}</strong>
              </div>
              <div className="bg-emerald-950/70 p-3 rounded-xl border border-emerald-800/60">
                <span className="text-emerald-300 block text-[11px]">{isMl ? 'പദ്ധതികൾ' : 'GPDP Works'}</span>
                <strong className="text-lg font-black text-white">
                  {wardProjects.length} {isMl ? 'പദ്ധതികൾ' : 'Works'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Main Action Cards in Exact Order (Part 4.3): 1. Report a Problem, 2. Nearby Services, 3. My Land, 4. Build Check */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: Report a Problem */}
        <Link
          href="/citizen/grievance"
          className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-red-500 hover:shadow-lg transition-all group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                {t('card_report')}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t('card_report_desc')}
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-red-600 group-hover:translate-x-1 transition-transform">
            <span>{isMl ? 'പരാതി രേഖപ്പെടുത്തുക' : 'File Infrastructure Issue'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </Link>

        {/* Card 2: Nearby Services */}
        <Link
          href="/citizen/facilities"
          className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Hospital className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {t('card_services')}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t('card_services_desc')}
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
            <span>{isMl ? 'സേവന കേന്ദ്രങ്ങൾ കണ്ടെത്തുക' : 'Find Facilities & Road Route'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </Link>

        {/* Card 3: My Land */}
        <Link
          href="/citizen/plot"
          className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {t('card_my_land')}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t('card_my_land_desc')}
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
            <span>{isMl ? 'ഭൂമി വിവരങ്ങൾ പരിശോധിക്കുക' : 'Manage Land & Survey Records'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </Link>

        {/* Card 4: Build Check */}
        <Link
          href="/citizen/build-check"
          className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                {t('card_build_check')}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t('card_build_check_desc')}
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
            <span>{isMl ? 'നിർമ്മാണ അനുമതി പരിശോധിക്കുക' : 'Check Construction Suitability'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </Link>
      </div>

      {/* Additional Citizen Service Quick Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <Link
          href="/citizen/ward"
          className="p-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 text-xs flex items-center justify-between text-slate-800 transition-colors font-medium"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <span>{t('nav_ward_works')}</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
        </Link>

        <Link
          href="/citizen/hazard"
          className="p-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 text-xs flex items-center justify-between text-slate-800 transition-colors font-medium"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-600" />
            <span>{t('nav_citizen_hazard')}</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
        </Link>

        <Link
          href="/citizen/assets"
          className="p-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 text-xs flex items-center justify-between text-slate-800 transition-colors font-medium"
        >
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-600" />
            <span>{t('nav_shared_assets')}</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
        </Link>

        <Link
          href="/citizen/complaints"
          className="p-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 text-xs flex items-center justify-between text-slate-800 transition-colors font-medium"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <span>{t('nav_track_complaints')}</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
        </Link>
      </div>
    </div>
  );
}
