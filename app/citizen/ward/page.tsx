'use client';

import React, { useEffect, useState } from 'react';
import {
  FolderGit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  IndianRupee,
  Calendar,
  Image as ImageIcon,
  Building,
  Filter,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { getProjects, getWards } from '@/lib/api';
import { GPDPProject, Ward } from '@/lib/types';

export default function CitizenWardWorksPage() {
  const { t, getLocalizedName, getLocalizedStatus, getLocalizedCategory } = useTranslation();
  const [projects, setProjects] = useState<GPDPProject[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [showAllWards, setShowAllWards] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pList, wList] = await Promise.all([getProjects(), getWards()]);
        setProjects(pList);
        setWards(wList);
      } catch (err) {
        console.error('Failed to load ward projects data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  // Filter: Ward 7 by default, or all wards if toggled
  const displayedProjects = showAllWards
    ? projects
    : projects.filter((p) => p.ward_id === 7);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('nav_ward_works')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {t('ward_works_subtitle')}
            </p>
          </div>
        </div>
        <SourceChip screenKey="ward_works" />
      </div>

      {/* Control Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-900 block">
            {showAllWards ? t('displaying_all_projects') : t('active_ward_7')}
          </span>
          <span className="text-[11px] text-slate-500">
            {displayedProjects.length} {t('works_listed')}
          </span>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setShowAllWards(!showAllWards)}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-2xs ${
            showAllWards
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          {showAllWards ? t('show_only_ward_7') : t('toggle_all_wards')}
        </button>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedProjects.map((proj) => {
          const ward = wards.find((w) => w.id === proj.ward_id);

          return (
            <div
              key={proj.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              {/* Card Photo Placeholder */}
              <div className="h-36 bg-gradient-to-r from-slate-200 to-slate-100 relative flex items-center justify-center border-b border-slate-200">
                <div className="text-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto opacity-40 mb-1" />
                  <span className="text-[10px] font-mono">{t('site_work_photo_verification')}</span>
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                      proj.status === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : proj.status === 'delayed'
                        ? 'bg-red-600 text-white'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {getLocalizedStatus(proj.status)}
                  </span>
                </div>

                {/* Ward Badge */}
                <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-xs">
                  {t('ward_col_ward')} {proj.ward_id}: {ward ? getLocalizedName(ward) : ''}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-blue-700 font-mono">
                    {t('category')} {getLocalizedCategory(proj.category)}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {getLocalizedName(proj)}
                  </h3>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span>{t('approved_budget')}</span>
                    <strong className="text-slate-900 font-bold">₹{proj.budget_lakhs} {t('lakhs')}</strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span>{t('spent_so_far')}</span>
                    <strong className="text-emerald-700 font-bold">
                      ₹{proj.spent_lakhs} {t('lakhs')}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{t('timeline')} {proj.start_date} – {proj.end_date}</span>
                    </span>
                    {proj.days_overdue > 0 && (
                      <span className="text-red-600 font-bold">
                        {proj.days_overdue} {t('days_overdue')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
