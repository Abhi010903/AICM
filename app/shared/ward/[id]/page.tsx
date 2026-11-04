'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  TableProperties,
  TrendingUp,
  IndianRupee,
  Building,
  AlertCircle,
  FolderGit2,
  Users,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useRole } from '@/lib/role-context';
import { SourceChip } from '@/components/common/SourceChip';
import { getWardById, getProjects, getAssets, getGrievances, getWards } from '@/lib/api';
import { Ward, GPDPProject, Asset, Grievance } from '@/lib/types';
import { calculatePerCapitaSpend } from '@/lib/calculations';

export default function SharedWardDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const {
    t,
    getLocalizedName,
    getLocalizedStatus,
    getLocalizedCondition,
    getLocalizedType,
    getLocalizedCategory,
    language,
  } = useTranslation();
  const isMl = language === 'ml';
  const { role } = useRole();

  const wardId = Number(params?.id) || 7;
  const [ward, setWard] = useState<Ward | null>(null);
  const [allWards, setAllWards] = useState<Ward[]>([]);
  const [projects, setProjects] = useState<GPDPProject[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [overrideShowSpend, setOverrideShowSpend] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [w, wList, pList, aList, gList] = await Promise.all([
          getWardById(wardId),
          getWards(),
          getProjects(wardId),
          getAssets({ wardId }),
          getGrievances(wardId),
        ]);
        setWard(w);
        setAllWards(wList);
        setProjects(pList);
        setAssets(aList);
        setGrievances(gList);
      } catch (err) {
        console.error('Failed to load shared ward dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [wardId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  if (!ward) {
    return (
      <div className="p-8 text-center text-red-600">
        {t('ward_not_found')}
      </div>
    );
  }

  const perCapita = calculatePerCapitaSpend(ward.spend_lakhs, ward.population);
  const showAdminSpendFields = role === 'president' || overrideShowSpend;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              S2 {t('ward_col_ward')} {ward.number} {t('nav_overview')} — {getLocalizedName(ward)}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {t('shared_ward_subtitle')}
            </p>
          </div>

          {/* Ward Switcher */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">{t('switch_ward')}</span>
            <select
              value={ward.id}
              onChange={(e) => router.push(`/shared/ward/${e.target.value}`)}
              className="p-1.5 bg-white rounded-lg border border-slate-300 font-semibold"
            >
              {allWards.map((w) => (
                <option key={w.id} value={w.id}>
                  {t('ward_col_ward')} {w.number}: {getLocalizedName(w)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <SourceChip screenKey="shared_ward" />
      </div>

      {/* Role-Sensitive Visibility Banner */}
      <div className="bg-slate-100 border border-slate-300 p-3.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-700">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>
            {t('active_role')} <strong className="capitalize">{role === 'president' ? t('role_president') : t('role_citizen')}</strong>. {t('spend_efficiency_fields')}{' '}
            <strong>{showAdminSpendFields ? t('visible') : t('hidden')}</strong>.
          </span>
        </div>

        <button
          onClick={() => setOverrideShowSpend(!overrideShowSpend)}
          className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-200 border border-slate-300 rounded font-semibold text-[11px] self-start sm:self-auto transition-colors"
        >
          {showAdminSpendFields ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
          <span>{showAdminSpendFields ? t('hide_spend_eff') : t('show_spend_eff')}</span>
        </button>
      </div>

      {/* Combined Scorecard Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Population */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs block">{t('ward_col_pop')}</span>
          <strong className="text-xl font-black text-slate-900 mt-1 block">
            {ward.population.toLocaleString()}
          </strong>
          <span className="text-[11px] text-slate-400">{ward.households} {t('households')}</span>
        </div>

        {/* PDI Score */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs block">{t('ward_col_pdi')}</span>
          <strong className="text-xl font-black text-blue-700 mt-1 block">
            {ward.pdi_score} / 100
          </strong>
          <span className="text-[11px] text-slate-400">{isMl ? 'ജില്ലാ ശരാശരി: 72.5' : 'Dist. Avg: 72.5'}</span>
        </div>

        {/* Public Works Count */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs block">{t('public_works_count')}</span>
          <strong className="text-xl font-black text-slate-900 mt-1 block">
            {projects.length} {t('works_count_suffix')}
          </strong>
          <span className="text-[11px] text-slate-400">
            {projects.filter((p) => p.status === 'completed').length} {t('completed_count')}
          </span>
        </div>

        {/* Assets Count */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs block">{t('public_assets_label')}</span>
          <strong className="text-xl font-black text-slate-900 mt-1 block">
            {assets.length} {t('assets_count_suffix')}
          </strong>
          <span className="text-[11px] text-slate-400">
            {assets.filter((a) => a.condition === 'poor').length} {t('need_repair')}
          </span>
        </div>
      </div>

      {/* Administrative Spend Efficiency Panel (Role-Sensitive) */}
      {showAdminSpendFields ? (
        <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-blue-200 pb-2">
            <h3 className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-blue-700" />
              <span>{t('admin_spend_panel_title')}</span>
            </h3>
            <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              {t('mla_role_active')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <span className="text-slate-500 block">{t('total_gpdp_spend')}</span>
              <strong className="text-lg font-black text-emerald-800">
                ₹{ward.spend_lakhs} {t('lakhs')}
              </strong>
            </div>

            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <span className="text-slate-500 block">{t('per_capita_alloc')}</span>
              <strong className="text-lg font-black text-blue-800">
                ₹{perCapita.toLocaleString()} {isMl ? '/ പൗരൻ' : '/ citizen'}
              </strong>
            </div>

            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <span className="text-slate-500 block">{t('capital_eff_status')}</span>
              <strong className="text-lg font-black text-slate-900">
                {ward.pdi_score < 72.5 && perCapita > 3000
                  ? t('audit_flagged_status')
                  : t('equitable_progress_status')}
              </strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic flex items-center justify-between">
          <span>{t('spend_hidden_citizen')}</span>
          <button
            onClick={() => setOverrideShowSpend(true)}
            className="text-blue-600 font-bold hover:underline"
          >
            {t('click_expand_audit')}
          </button>
        </div>
      )}

      {/* Ward Works & Assets Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projects List */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <FolderGit2 className="w-4 h-4 text-blue-600" />
            <span>{t('ward_gpdp_projects')} ({projects.length})</span>
          </h3>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">{getLocalizedName(p)}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{getLocalizedCategory(p.category)}</div>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    p.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : p.status === 'delayed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {getLocalizedStatus(p.status)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Public Assets List */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <span>{t('ward_assets')} ({assets.length})</span>
          </h3>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
            {assets.map((a) => (
              <div
                key={a.id}
                className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">{getLocalizedName(a)}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{getLocalizedType(a.type)}</div>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    a.condition === 'good'
                      ? 'bg-emerald-100 text-emerald-800'
                      : a.condition === 'fair'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {getLocalizedCondition(a.condition)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
