'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  IndianRupee,
  Building,
  AlertCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  Bot,
  Waves,
  Factory,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { getPanchayat, getWards, getProjects, getGrievances } from '@/lib/api';
import { Panchayat, Ward, GPDPProject, Grievance } from '@/lib/types';

export default function PresidentOverviewPage() {
  const { t, getLocalizedName } = useTranslation();
  const [panchayat, setPanchayat] = useState<Panchayat | null>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [projects, setProjects] = useState<GPDPProject[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pData, wData, projData, gData] = await Promise.all([
          getPanchayat(),
          getWards(),
          getProjects(),
          getGrievances(),
        ]);
        setPanchayat(pData);
        setWards(wData);
        setProjects(projData);
        setGrievances(gData);
      } catch (err) {
        console.error('Failed to load president overview data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-lg" />
          <div className="h-80 bg-slate-200 rounded-lg" />
        </div>
      </div>
    );
  }

  // Dynamic KPI calculations
  const openGrievancesCount = grievances.filter((g) => g.status === 'open').length;
  const delayedProjectsCount = projects.filter((p) => p.status === 'delayed').length;
  const wardsBelowAvg = wards.filter((w) => w.pdi_score < 72.5).length;
  const totalSpend = wards.reduce((sum, w) => sum + w.spend_lakhs, 0);

  // Chart datasets
  const spendChartData = wards.map((w) => ({
    name: `W${w.number}`,
    fullName: getLocalizedName(w),
    spend: w.spend_lakhs,
  }));

  const pdiChartData = wards.map((w) => ({
    name: `W${w.number}`,
    fullName: getLocalizedName(w),
    pdi: w.pdi_score,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('role_president')} — {t('nav_overview')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Thekkumpuram Grama Panchayat · Executive Decision-Support System
            </p>
          </div>
        </div>
        <SourceChip screenKey="overview" />
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* KPI 1: PDI Score */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{t('kpi_pdi')}</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{panchayat?.pdi_score}</div>
          <div className="text-[11px] text-slate-500">{t('kpi_pdi_sub')}</div>
        </div>

        {/* KPI 2: Total Spend */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{t('kpi_spend')}</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">
            ₹{Math.round(totalSpend * 10) / 10}L
          </div>
          <div className="text-[11px] text-slate-500">{t('kpi_spend_sub')}</div>
        </div>

        {/* KPI 3: Assets */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{t('kpi_assets')}</span>
            <Building className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{panchayat?.total_assets}</div>
          <div className="text-[11px] text-slate-500">{t('kpi_assets_sub')}</div>
        </div>

        {/* KPI 4: Open Grievances */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{t('kpi_grievances')}</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{openGrievancesCount}</div>
          <div className="text-[11px] text-slate-500">{t('kpi_grievances_sub')}</div>
        </div>

        {/* KPI 5: Wards Below Average */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{t('kpi_wards_below_avg')}</span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-700">{wardsBelowAvg}</div>
          <div className="text-[11px] text-slate-500">{t('kpi_wards_below_avg_sub')}</div>
        </div>

        {/* KPI 6: Delayed Projects */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">{t('kpi_delayed')}</span>
            <Clock className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700">{delayedProjectsCount}</div>
          <div className="text-[11px] text-slate-500">{t('kpi_delayed_sub')}</div>
        </div>
      </div>

      {/* 2 Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Spend by Ward */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{t('chart_spend_title')}</h3>
            <span className="text-xs text-slate-500 font-mono">eGramSwaraj</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="L" />
                <Tooltip
                  formatter={(value: any) => [`₹${value} Lakhs`, 'Spend']}
                  labelFormatter={(lbl) => {
                    const found = spendChartData.find((x) => x.name === lbl);
                    return found ? `${lbl}: ${found.fullName}` : lbl;
                  }}
                />
                <Bar dataKey="spend" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: PDI by Ward with District Average */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{t('chart_pdi_title')}</h3>
            <span className="text-xs text-slate-500 font-mono">PDI Portal</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pdiChartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[50, 95]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} / 100`, 'PDI Score']}
                  labelFormatter={(lbl) => {
                    const found = pdiChartData.find((x) => x.name === lbl);
                    return found ? `${lbl}: ${found.fullName}` : lbl;
                  }}
                />
                <ReferenceLine
                  x={72.5}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                  label={{ value: 'Dist. Avg (72.5)', fill: '#dc2626', fontSize: 10, position: 'top' }}
                />
                <Bar
                  dataKey="pdi"
                  fill="#0d9488"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards to 7 President Modules */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">{t('quick_modules')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/president/wards"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex items-start justify-between"
          >
            <div>
              <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                P1 Ward Ledger
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Plan → Spend → Asset → Outcome chain
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </Link>

          <Link
            href="/president/equity"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex items-start justify-between"
          >
            <div>
              <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                P2 Equity Analyser
              </div>
              <div className="text-xs text-slate-500 mt-1">
                PDI vs Per-Capita spend scatter quadrants
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </Link>

          <Link
            href="/president/siting"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex items-start justify-between"
          >
            <div>
              <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                P3 Siting Checker
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Statutory Nilam & hazard compliance
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </Link>

          <Link
            href="/president/assets"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex items-start justify-between"
          >
            <div>
              <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                P4 Asset Health
              </div>
              <div className="text-xs text-slate-500 mt-1">
                124 assets register & maintenance status
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </Link>

          <Link
            href="/president/hazard"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex items-start justify-between"
          >
            <div>
              <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                P5 Hazard Twin
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Flood zones, assets at risk & shelter paths
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </Link>

          <Link
            href="/president/promises"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex items-start justify-between"
          >
            <div>
              <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                P6 Promise Tracker
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Completed, ongoing & delayed GPDP works
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </Link>

          <Link
            href="/president/budget"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex items-start justify-between"
          >
            <div>
              <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                P17 Budget Sandbox
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Live simulation of inter-ward fund shift
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Phase 2 Future Capabilities Preview (Out of Scope for v1) */}
      <section className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold">{t('phase_2_title')}</h3>
          </div>
          <span className="text-xs text-amber-300 font-mono bg-amber-950 px-2.5 py-0.5 rounded border border-amber-800">
            Roadmap Preview Only
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-800/70 rounded-lg border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Bot className="w-4 h-4 text-blue-400" />
              <span>{t('phase_2_chat')}</span>
            </div>
            <p className="text-slate-400">
              Multilingual Malayalam/English LLM conversational copilot with local scheme rule knowledge.
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/70 rounded-lg border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Waves className="w-4 h-4 text-blue-400" />
              <span>{t('phase_2_flood')}</span>
            </div>
            <p className="text-slate-400">
              Real-time telemetry integration with IMD rainfall radar and Chaliyar river level IoT gauges.
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/70 rounded-lg border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Factory className="w-4 h-4 text-blue-400" />
              <span>{t('phase_2_msme')}</span>
            </div>
            <p className="text-slate-400">
              Constituency MSME employment, industrial clusters, and patent innovation index tracking.
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 italic">
          {t('phase_2_note')}
        </div>
      </section>
    </div>
  );
}
