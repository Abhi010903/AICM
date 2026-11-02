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
  const { t, getLocalizedName } = useTranslation();
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
        Ward #{wardId} not found in Panchayat records.
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
              S2 Ward {ward.number} Dashboard — {getLocalizedName(ward)}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Shared Ward Dashboard · Role-Sensitive Governance & Citizen Perspective
            </p>
          </div>

          {/* Ward Switcher */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Switch Ward:</span>
            <select
              value={ward.id}
              onChange={(e) => router.push(`/shared/ward/${e.target.value}`)}
              className="p-1.5 bg-white rounded-lg border border-slate-300 font-semibold"
            >
              {allWards.map((w) => (
                <option key={w.id} value={w.id}>
                  Ward {w.number}: {getLocalizedName(w)}
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
            Active Role: <strong className="capitalize">{role}</strong>. Administrative spend efficiency fields are{' '}
            <strong>{showAdminSpendFields ? 'visible' : 'hidden'}</strong> for this view.
          </span>
        </div>

        <button
          onClick={() => setOverrideShowSpend(!overrideShowSpend)}
          className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-200 border border-slate-300 rounded font-semibold text-[11px] self-start sm:self-auto transition-colors"
        >
          {showAdminSpendFields ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
          <span>{showAdminSpendFields ? 'Hide Spend Efficiency' : 'Show Spend Efficiency'}</span>
        </button>
      </div>

      {/* Combined Scorecard Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Population */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs block">Population</span>
          <strong className="text-xl font-black text-slate-900 mt-1 block">
            {ward.population.toLocaleString()}
          </strong>
          <span className="text-[11px] text-slate-400">{ward.households} households</span>
        </div>

        {/* PDI Score */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs block">PDI Score</span>
          <strong className="text-xl font-black text-blue-700 mt-1 block">
            {ward.pdi_score} / 100
          </strong>
          <span className="text-[11px] text-slate-400">Dist. Avg: 72.5</span>
        </div>

        {/* Public Works Count */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs block">GPDP Projects</span>
          <strong className="text-xl font-black text-slate-900 mt-1 block">
            {projects.length} Works
          </strong>
          <span className="text-[11px] text-slate-400">
            {projects.filter((p) => p.status === 'completed').length} completed
          </span>
        </div>

        {/* Assets Count */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-500 text-xs block">Public Assets</span>
          <strong className="text-xl font-black text-slate-900 mt-1 block">
            {assets.length} Assets
          </strong>
          <span className="text-[11px] text-slate-400">
            {assets.filter((a) => a.condition === 'poor').length} need repair
          </span>
        </div>
      </div>

      {/* Administrative Spend Efficiency Panel (Role-Sensitive) */}
      {showAdminSpendFields ? (
        <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-blue-200 pb-2">
            <h3 className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-blue-700" />
              <span>Administrative Capital & Spend Efficiency Metrics</span>
            </h3>
            <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              President Role Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <span className="text-slate-500 block">Total GPDP Spend</span>
              <strong className="text-lg font-black text-emerald-800">
                ₹{ward.spend_lakhs} Lakhs
              </strong>
            </div>

            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <span className="text-slate-500 block">Per-Capita Allocation</span>
              <strong className="text-lg font-black text-blue-800">
                ₹{perCapita.toLocaleString()} / citizen
              </strong>
            </div>

            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <span className="text-slate-500 block">Capital Efficiency Status</span>
              <strong className="text-lg font-black text-slate-900">
                {ward.pdi_score < 72.5 && perCapita > 3000
                  ? 'Audit Flagged (High Spend/Low PDI)'
                  : 'Equitable Progress'}
              </strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic flex items-center justify-between">
          <span>Administrative financial spend ratios are hidden in Citizen perspective.</span>
          <button
            onClick={() => setOverrideShowSpend(true)}
            className="text-blue-600 font-bold hover:underline"
          >
            Click to expand for audit demo
          </button>
        </div>
      )}

      {/* Ward Works & Assets Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projects List */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <FolderGit2 className="w-4 h-4 text-blue-600" />
            <span>Ward GPDP Projects ({projects.length})</span>
          </h3>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">{getLocalizedName(p)}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{p.category}</div>
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
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Public Assets List */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <span>Ward Assets ({assets.length})</span>
          </h3>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
            {assets.map((a) => (
              <div
                key={a.id}
                className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">{getLocalizedName(a)}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{a.type}</div>
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
                  {a.condition}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
