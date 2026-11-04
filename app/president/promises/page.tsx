'use client';

import React, { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  IndianRupee,
  Filter,
  CheckSquare,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { getWards, getProjects } from '@/lib/api';
import { Ward, GPDPProject, ProjectStatus } from '@/lib/types';

export default function PromiseTrackerPage() {
  const { t, getLocalizedName, getLocalizedCategory } = useTranslation();
  const [wards, setWards] = useState<Ward[]>([]);
  const [projects, setProjects] = useState<GPDPProject[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [wList, pList] = await Promise.all([getWards(), getProjects()]);
        setWards(wList);
        setProjects(pList);
      } catch (err) {
        console.error('Failed to load promises data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  // Filter projects by ward
  const filteredProjects = projects.filter((p) =>
    selectedWardId === 0 ? true : p.ward_id === selectedWardId
  );

  // Group by status
  const completed = filteredProjects.filter((p) => p.status === 'completed');
  const ongoing = filteredProjects.filter((p) => p.status === 'ongoing');
  const delayed = filteredProjects.filter((p) => p.status === 'delayed');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('promise_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {t('promises_subtitle')}
            </p>
          </div>
        </div>
        <SourceChip screenKey="promises" />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700">{t('filter_by_ward')}:</span>
          <select
            value={selectedWardId}
            onChange={(e) => setSelectedWardId(Number(e.target.value))}
            className="p-1.5 bg-slate-50 rounded-lg border border-slate-300 font-medium"
          >
            <option value={0}>{t('all_wards')}</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {t('ward_col_ward')} {w.number}: {getLocalizedName(w)}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          {t('showing_projects')} <strong>{filteredProjects.length}</strong> {t('gpdp_projects_count')}
        </div>
      </div>

      {/* 3-Column Traffic Light Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Completed (Green) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('promise_completed')}</h3>
            </div>
            <span className="text-xs font-black bg-emerald-200 px-2 py-0.5 rounded-full text-emerald-900">
              {completed.length}
            </span>
          </div>

          <div className="space-y-3">
            {completed.map((proj) => {
              const ward = wards.find((w) => w.id === proj.ward_id);
              return (
                <div
                  key={proj.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-slate-900">{getLocalizedName(proj)}</h4>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {t('done_status')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {t('ward_col_ward')} {ward?.number}: {ward ? getLocalizedName(ward) : ''} · {t('category')}: {getLocalizedCategory(proj.category)}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-600">
                    <span>{t('budget_label')}: <strong>₹{proj.budget_lakhs}L</strong></span>
                    <span className="text-emerald-700 font-bold">{t('spent_label')}: ₹{proj.spent_lakhs}L</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {t('delivered')} {proj.end_date}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Ongoing (Amber) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('promise_ongoing')}</h3>
            </div>
            <span className="text-xs font-black bg-amber-200 px-2 py-0.5 rounded-full text-amber-900">
              {ongoing.length}
            </span>
          </div>

          <div className="space-y-3">
            {ongoing.map((proj) => {
              const ward = wards.find((w) => w.id === proj.ward_id);
              return (
                <div
                  key={proj.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-slate-900">{getLocalizedName(proj)}</h4>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      {t('active_status')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {t('ward_col_ward')} {ward?.number}: {ward ? getLocalizedName(ward) : ''} · {t('category')}: {getLocalizedCategory(proj.category)}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-600">
                    <span>{t('budget_label')}: <strong>₹{proj.budget_lakhs}L</strong></span>
                    <span className="text-amber-800 font-bold">{t('spent_label')}: ₹{proj.spent_lakhs}L</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {t('target_end')} {proj.end_date}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Delayed (Red) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200 text-red-950">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">{t('promise_delayed')}</h3>
            </div>
            <span className="text-xs font-black bg-red-200 px-2 py-0.5 rounded-full text-red-900">
              {delayed.length}
            </span>
          </div>

          <div className="space-y-3">
            {delayed.map((proj) => {
              const ward = wards.find((w) => w.id === proj.ward_id);
              return (
                <div
                  key={proj.id}
                  className="bg-white p-4 rounded-xl border border-red-200 shadow-2xs space-y-2 hover:border-red-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-slate-900">{getLocalizedName(proj)}</h4>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                      {proj.days_overdue} {t('days_overdue')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {t('ward_col_ward')} {ward?.number}: {ward ? getLocalizedName(ward) : ''} · {t('category')}: {getLocalizedCategory(proj.category)}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-600">
                    <span>{t('budget_label')}: <strong>₹{proj.budget_lakhs}L</strong></span>
                    <span className="text-red-700 font-bold">{t('spent_label')}: ₹{proj.spent_lakhs}L</span>
                  </div>
                  <div className="text-[10px] text-red-700 font-medium">
                    {t('scheduled_completion_was')} {proj.end_date}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
