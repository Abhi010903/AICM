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
  Eye,
  Users,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { SourceChip } from '@/components/common/SourceChip';
import { getPanchayat, getWards, getProjects, getGrievances } from '@/lib/api';
import { Panchayat, Ward, GPDPProject, Grievance } from '@/lib/types';

export default function PresidentOverviewPage() {
  const { t, language, getLocalizedName, getLocalizedStatus } = useTranslation();
  const { enterPreviewMode } = useAuth();
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

  const isMl = language === 'ml';

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
              {isMl
                ? 'കുന്നമംഗലം നിയോജകമണ്ഡലം · ഭരണനിർവ്വഹണ തീരുമാന സഹായ സംവിധാനം'
                : 'Kunnamangalam Constituency · Executive Decision-Support System'}
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
                  formatter={(value: any) => [`₹${value} Lakhs`, isMl ? 'ചെലവ്' : 'Spend']}
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
                  formatter={(value: any) => [`${value} / 100`, isMl ? 'PDI സ്കോർ' : 'PDI Score']}
                  labelFormatter={(lbl) => {
                    const found = pdiChartData.find((x) => x.name === lbl);
                    return found ? `${lbl}: ${found.fullName}` : lbl;
                  }}
                />
                <ReferenceLine
                  x={72.5}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                  label={{
                    value: isMl ? 'ജില്ലാ ശരാശരി (72.5)' : 'Dist. Avg (72.5)',
                    fill: '#dc2626',
                    fontSize: 10,
                    position: 'top',
                  }}
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

      {/* Quick Navigation Cards to 7 MLA Modules */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">{t('quick_modules')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/president/wards"
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group flex items-start justify-between"
          >
            <div>
              <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                {t('nav_wards')}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {isMl ? 'പദ്ധതി → വിനിയോഗം → ആസ്തി → ഫലം' : 'Plan → Spend → Asset → Outcome chain'}
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
                {t('nav_equity')}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {isMl ? 'PDI vs ആളോഹരി ചെലവ് ക്വാഡ്രന്റുകൾ' : 'PDI vs Per-Capita spend scatter quadrants'}
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
                {t('nav_siting')}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {isMl ? 'നിലം, ദുരന്ത സാധ്യത നിയമ അനുമതി' : 'Statutory Nilam & hazard compliance'}
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
                {t('nav_assets')}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {isMl ? 'ആസ്തി രജിസ്റ്ററും പരിപാലന അവസ്ഥയും' : '124 assets register & maintenance status'}
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
                {t('nav_hazard')}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {isMl ? 'വെള്ളപ്പൊക്ക മേഖലകളും ദുരിതാശ്വാസ പാതകളും' : 'Flood zones, assets at risk & shelter paths'}
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
                {t('nav_promises')}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {isMl ? 'പൂർത്തിയായവ, പുരോഗമിക്കുന്നവ, വൈകുന്നവ' : 'Completed, ongoing & delayed GPDP works'}
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
                {t('nav_budget')}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {isMl ? 'ഫണ്ട് പുനർവിന്യാസ സിമുലേഷൻ' : 'Live simulation of inter-ward fund shift'}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Panchayat-Wide Citizen Activity Analytics */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-coconut-100 text-coconut-800 text-[11px] font-bold uppercase tracking-wider mb-1">
              <Activity className="w-3.5 h-3.5 text-coconut-700" />
              <span>{isMl ? 'പൗര പങ്കാളിത്ത വിവരങ്ങൾ' : 'Civic Engagement Intelligence'}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {isMl
                ? 'നിയോജകമണ്ഡല പൗര പ്രവർത്തനങ്ങളും സേവന ആവശ്യങ്ങളും'
                : 'Panchayat-Wide Citizen Activity & Service Demand'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {isMl
                ? 'വാർഡ് തല സേവന ആവശ്യങ്ങൾ നിരീക്ഷിക്കുകയും പൗര പരാതികളിൽ തുടർനടപടി സ്വീകരിക്കുകയും ചെയ്യുക.'
                : 'Monitor ward-level demand and follow up directly with citizens who raise grievances.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="p-1 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1 px-2 py-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isMl ? 'എംഎൽഎ ഔദ്യോഗിക കാഴ്ച' : 'Authorized MLA View'}</span>
            </span>
          </div>
        </div>

        {/* Aggregated Demand Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[11px]">
              {isMl ? 'പ്രതിമാസ സേവന ആവശ്യങ്ങൾ' : 'Monthly Service Requests'}
            </span>
            <strong className="text-lg font-black text-slate-900">
              142 {isMl ? 'ആവശ്യങ്ങൾ' : 'Requests'}
            </strong>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              {isMl ? '+14% കഴിഞ്ഞ മാസത്തേക്കാൾ' : '+14% vs last month'}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[11px]">
              {isMl ? 'പ്രധാന സേവന വിഭാഗം' : 'Top Service Category'}
            </span>
            <strong className="text-lg font-black text-blue-700">
              {isMl ? 'കുടിവെള്ളം (38%)' : 'Drinking Water (38%)'}
            </strong>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {isMl ? 'വാർഡ് 7 & വാർഡ് 12' : 'Ward 7 & Ward 12'}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[11px]">
              {isMl ? 'കെട്ടിട അനുമതി പരിശോധനകൾ' : 'Building Pre-Checks'}
            </span>
            <strong className="text-lg font-black text-coconut-800">
              54 {isMl ? 'അന്വേഷണങ്ങൾ' : 'Inquiries'}
            </strong>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {isMl ? 'റീലിസ് & തണ്ണീർത്തട സ്ക്രീനിംഗ്' : 'ReLIS & Wetland screening'}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[11px]">
              {isMl ? 'പരാതി പരിഹാര നിരക്ക്' : 'Grievance Resolution Rate'}
            </span>
            <strong className="text-lg font-black text-emerald-700">
              76.5% {isMl ? 'പരിഹരിച്ചു' : 'Closed'}
            </strong>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {isMl ? 'ശരാശരി 3.2 ദിവസത്തിൽ' : 'Avg turnaround 3.2 days'}
            </span>
          </div>
        </div>

        {/* Live Citizen Grievance Activity Table */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <h4 className="font-bold text-slate-800">
              {isMl ? 'സമീപകാല പൗര പരാതികൾ' : 'Recent Citizen Grievances'}
            </h4>
            <Link
              href="/president/grievances"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-500"
            >
              {isMl ? 'പരാതി ഇൻബോക്സ് തുറക്കുക' : 'Open live grievance inbox'}
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3.5">{isMl ? 'പരാതിക്കാരൻ' : 'Reporter'}</th>
                  <th className="py-2.5 px-3.5">{isMl ? 'മൊബൈൽ' : 'Mobile'}</th>
                  <th className="py-2.5 px-3.5">{isMl ? 'ബ്ലോക്ക്' : 'Block'}</th>
                  <th className="py-2.5 px-3.5">{isMl ? 'വാർഡ്' : 'Ward'}</th>
                  <th className="py-2.5 px-3.5">{isMl ? 'പരാതി' : 'Complaint'}</th>
                  <th className="py-2.5 px-3.5">{isMl ? 'തീയതി' : 'Filed'}</th>
                  <th className="py-2.5 px-3.5">{isMl ? 'അവസ്ഥ' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grievances.slice(0, 5).map((grievance) => (
                  <tr key={grievance.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">
                      {grievance.reporter_name || (isMl ? 'പൗരൻ' : 'Legacy record')}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700">{grievance.reporter_phone || '—'}</td>
                    <td className="py-2.5 px-3.5 text-slate-700">{grievance.reporter_block || '—'}</td>
                    <td className="py-2.5 px-3.5 text-slate-700">
                      {isMl ? `വാർഡ് ${grievance.ward_id}` : `Ward ${grievance.ward_id}`}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600 max-w-xs truncate">
                      {isMl ? grievance.description_ml || grievance.description_en : grievance.description_en}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500 font-mono text-[11px]">{grievance.filed_date}</td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          grievance.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : grievance.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {getLocalizedStatus(grievance.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>
              {isMl
                ? 'ഈ തത്സമയ പട്ടിക പോർട്ടൽ തുറക്കുമ്പോൾ പുതുക്കപ്പെടുന്നു. പരാതി ഇൻബോക്സ് ഉപയോഗിച്ച് ഉത്തരവാദിത്തമുള്ള വകുപ്പും പരിഹാര നിലയും അപ്ഡേറ്റ് ചെയ്യുക.'
                : 'This live table refreshes when the portal is reopened. Use the grievance inbox to update the assigned department, progress status, and resolution note.'}
            </span>
          </div>
        </div>
      </section>

      {/* Prominent VIEW AS CITIZEN Action Bar */}
      <section className="bg-gradient-to-r from-coconut-900 via-emerald-950 to-slate-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-coconut-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-coconut-500/20 text-coconut-300 text-xs font-bold border border-coconut-400/30">
            <Eye className="w-3.5 h-3.5 text-coconut-400" />
            <span>{isMl ? 'എംഎൽഎ ഓഡിറ്റ് ഉപകരണം' : 'MLA Delegation & Audit Tool'}</span>
          </div>
          <h3 className="text-xl font-black tracking-tight">
            {isMl
              ? 'പൗര സേവനങ്ങൾ തത്സമയം നിരീക്ഷിക്കുക'
              : 'Explore Citizen Services in Real-Time Preview'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isMl
              ? 'ലോഗ് ഔട്ട് ചെയ്യാതെ തന്നെ ഭൂമി പരിശോധന, നിർമ്മാണ അനുമതി, സേവന കേന്ദ്രങ്ങൾ, ദുരന്ത സുരക്ഷാ പാതകൾ എന്നിവ പൗരന്റെ കാഴ്ചയിൽ പരിശോധിക്കുക.'
              : 'Verify what citizens experience when accessing cadastral plot checks, building suitability, public healthcare directories, and hazard warning routes without logging out.'}
          </p>
        </div>

        <button
          onClick={enterPreviewMode}
          className="px-6 py-3.5 bg-gradient-to-r from-coconut-600 to-emerald-600 hover:from-coconut-500 hover:to-emerald-500 text-white font-black text-sm rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 flex-shrink-0"
        >
          <Eye className="w-5 h-5 text-coconut-200" />
          <span>{t('nav_view_as_citizen')}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </section>

      {/* Phase 2 Future Capabilities Preview (Out of Scope for v1) */}
      <section className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold">{t('phase_2_title')}</h3>
          </div>
          <span className="text-xs text-amber-300 font-mono bg-amber-950 px-2.5 py-0.5 rounded border border-amber-800">
            {isMl ? 'ഭാവി വികസനം മാത്രം' : 'Roadmap Preview Only'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-800/70 rounded-lg border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Bot className="w-4 h-4 text-blue-400" />
              <span>{t('phase_2_chat')}</span>
            </div>
            <p className="text-slate-400">
              {isMl
                ? 'തദ്ദേശ സ്വയംഭരണ ചട്ടങ്ങൾ അടിസ്ഥാനമാക്കിയുള്ള മലയാളം/ഇംഗ്ലീഷ് ഭാഷാ എ.ഐ സഹായി.'
                : 'Multilingual Malayalam/English LLM conversational copilot with local scheme rule knowledge.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/70 rounded-lg border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Waves className="w-4 h-4 text-blue-400" />
              <span>{t('phase_2_flood')}</span>
            </div>
            <p className="text-slate-400">
              {isMl
                ? 'കാലാവസ്ഥാ റഡാറും ചാലിയാർ നദീ ജലനിരപ്പും സംയോജിപ്പിച്ച തത്സമയ പ്രവചന സംവിധാനം.'
                : 'Real-time telemetry integration with IMD rainfall radar and Chaliyar river level IoT gauges.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/70 rounded-lg border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Factory className="w-4 h-4 text-blue-400" />
              <span>{t('phase_2_msme')}</span>
            </div>
            <p className="text-slate-400">
              {isMl
                ? 'മണ്ഡലത്തിലെ എം.എസ്.എം.ഇ തൊഴിൽ, വ്യവസായ മേഖലകൾ എന്നിവയുടെ നിരീക്ഷണ സംവിധാനം.'
                : 'Constituency MSME employment, industrial clusters, and patent innovation index tracking.'}
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
