'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpDown,
  X,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  IndianRupee,
  Layers,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { getWards, getProjects, getAssets, getGrievances } from '@/lib/api';
import { Ward, GPDPProject, Asset, Grievance } from '@/lib/types';

type SortField = 'number' | 'population' | 'pdi_score' | 'spend_lakhs' | 'open_grievances';

export default function WardLedgerPage() {
  const { t, getLocalizedName, getLocalizedStatus } = useTranslation();
  const router = useRouter();
  const [wards, setWards] = useState<Ward[]>([]);
  const [projects, setProjects] = useState<GPDPProject[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('pdi_score');
  const [sortAsc, setSortAsc] = useState<boolean>(true); // default asc so lowest PDI is first for walkthrough

  // Selected ward for drawer
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [wList, pList, aList, gList] = await Promise.all([
          getWards(),
          getProjects(),
          getAssets(),
          getGrievances(),
        ]);
        setWards(wList);
        setProjects(pList);
        setAssets(aList);
        setGrievances(gList);
      } catch (err) {
        console.error('Failed to load wards data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedWards = [...wards].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    return sortAsc ? valA - valB : valB - valA;
  });

  // Helper stats for a ward
  const getWardProjectsStat = (wardId: number) => {
    const wProjs = projects.filter((p) => p.ward_id === wardId);
    const done = wProjs.filter((p) => p.status === 'completed').length;
    return { done, total: wProjs.length, list: wProjs };
  };

  const getWardAssetsStat = (wardId: number) => {
    const wAssets = assets.filter((a) => a.ward_id === wardId);
    const good = wAssets.filter((a) => a.condition === 'good').length;
    const fair = wAssets.filter((a) => a.condition === 'fair').length;
    const poor = wAssets.filter((a) => a.condition === 'poor').length;
    return { good, fair, poor, total: wAssets.length, list: wAssets };
  };

  const getWardGrievances = (wardId: number) => {
    return grievances.filter((g) => g.ward_id === wardId && g.status === 'open');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('nav_wards')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {t('wards_subtitle')}
            </p>
          </div>
        </div>
        <SourceChip screenKey="wards" />
      </div>

      {/* Sorting instructions pill */}
      <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
        <span className="font-semibold text-slate-800">{t('walkthrough_tip_title')}</span>
        <span>
          {t('wards_walkthrough_tip')}
        </span>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none">
              <tr>
                <th
                  onClick={() => handleSort('number')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>{t('ward_col_ward')}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('population')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>{t('ward_col_pop')}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('pdi_score')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1 text-blue-700">
                    <span>{t('ward_col_pdi')}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-blue-700" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('spend_lakhs')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>{t('ward_col_spend')}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">{t('ward_col_projects')}</th>
                <th className="py-3 px-4">{t('ward_col_assets')}</th>
                <th
                  onClick={() => handleSort('open_grievances')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>{t('ward_col_grievances')}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {sortedWards.map((w) => {
                const pStat = getWardProjectsStat(w.id);
                const aStat = getWardAssetsStat(w.id);
                const gCount = getWardGrievances(w.id).length;
                const isSelected = selectedWard?.id === w.id;

                return (
                  <tr
                    key={w.id}
                    onClick={() => setSelectedWard(w)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 font-semibold'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {t('ward_col_ward')} {w.number}: {getLocalizedName(w)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        {w.households} {t('households')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-800">{w.population.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                          w.pdi_score >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : w.pdi_score >= 70
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {w.pdi_score}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-emerald-800 font-bold">₹{w.spend_lakhs}L</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{pStat.done}</span>
                      <span className="text-slate-400">/{pStat.total} {t('done_status')}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <span className="text-emerald-700 bg-emerald-50 px-1 rounded" title={t('cond_good')}>
                          {aStat.good}G
                        </span>
                        <span className="text-amber-700 bg-amber-50 px-1 rounded" title={t('cond_fair')}>
                          {aStat.fair}F
                        </span>
                        <span className="text-red-700 bg-red-50 px-1 rounded font-bold" title={t('cond_poor')}>
                          {aStat.poor}P
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {gCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{gCount}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWard(w);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded text-slate-700 transition-colors"
                      >
                        {t('details')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ward Detail Drawer (4-Stage Chain) */}
      {selectedWard && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex justify-end backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-200">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    {t('ward_drawer_title')}
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {t('ward_col_ward')} {selectedWard.number}: {getLocalizedName(selectedWard)}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {t('ward_col_pop')}: {selectedWard.population.toLocaleString()} · {t('households')}: {selectedWard.households} · {t('ward_col_pdi')}: {selectedWard.pdi_score}/100
                  </p>
                </div>
                <button
                  onClick={() => setSelectedWard(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label={t('close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 4-Stage Horizontal Timeline (Promise → Spend → Asset → Outcome) */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {t('timeline_title')}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  {/* Stage 1: Promise */}
                  <div className="p-3 bg-white rounded-lg border border-blue-200 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{t('timeline_promise')}</span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {getWardProjectsStat(selectedWard.id).total} {t('works_count_suffix')}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {t('egramswaraj_plan_sub')}
                    </div>
                  </div>

                  {/* Stage 2: Spend */}
                  <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>{t('timeline_spend')}</span>
                    </div>
                    <div className="text-sm font-extrabold text-emerald-800">
                      ₹{selectedWard.spend_lakhs}L
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {t('treasury_disbursement_sub')}
                    </div>
                  </div>

                  {/* Stage 3: Asset */}
                  <div className="p-3 bg-white rounded-lg border border-indigo-200 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
                      <Building className="w-3.5 h-3.5" />
                      <span>{t('timeline_asset')}</span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {getWardAssetsStat(selectedWard.id).total} {t('assets_count_suffix')}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {t('sanchaya_registry_sub')}
                    </div>
                  </div>

                  {/* Stage 4: Outcome */}
                  <div className="p-3 bg-white rounded-lg border border-purple-200 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-purple-700 font-bold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{t('timeline_outcome')}</span>
                    </div>
                    <div className="text-sm font-extrabold text-purple-900">
                      {selectedWard.pdi_score} PDI
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {t('composite_score_sub')}
                    </div>
                  </div>
                </div>
              </div>

              {/* SDG 7-Themes Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700">{t('sdg_scorecard')}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {Object.entries(selectedWard.sdg_scores).map(([goal, score]) => (
                    <div key={goal} className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="text-[11px] text-slate-500 uppercase block">{goal}</span>
                      <strong className="text-sm text-slate-900">{score}/100</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ward Projects List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700">{t('gpdp_projects_in_ward')}</h4>
                  <span className="text-[11px] text-slate-500">
                    {t('source_egramswaraj')}
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {getWardProjectsStat(selectedWard.id).list.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{getLocalizedName(proj)}</div>
                        <div className="text-[11px] text-slate-500">
                          {t('budget_label')}: ₹{proj.budget_lakhs}L · {t('spent_label')}: ₹{proj.spent_lakhs}L
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          proj.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : proj.status === 'delayed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {getLocalizedStatus(proj.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Walkthrough Action Button: Jump to Asset Register filtered to Ward */}
            <div className="pt-4 border-t border-slate-200 mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedWard(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                {t('close')}
              </button>
              <button
                onClick={() => router.push(`/president/assets?ward=${selectedWard.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow transition-all"
              >
                <span>{t('filter_ward_assets_btn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
