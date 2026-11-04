'use client';

import React, { useEffect, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Scale, Info, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { getWards } from '@/lib/api';
import { Ward } from '@/lib/types';
import { calculatePerCapitaSpend } from '@/lib/calculations';

export default function EquityAnalyserPage() {
  const { t, getLocalizedName, language } = useTranslation();
  const isMl = language === 'ml';

  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getWards();
        setWards(data);
        if (data.length > 0) {
          // Preselect Ward 7 (Cheruvannur)
          const w7 = data.find((w) => w.id === 7) || data[0];
          setSelectedWard(w7);
        }
      } catch (err) {
        console.error('Failed to load equity data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  const avgPdi = 72.5;
  const avgPerCapita =
    wards.reduce((sum, w) => sum + calculatePerCapitaSpend(w.spend_lakhs, w.population), 0) /
    wards.length;

  // Chart data
  const chartData = wards.map((w) => {
    const perCapita = calculatePerCapitaSpend(w.spend_lakhs, w.population);
    // Flag determination
    let flagType: 'under_over' | 'well_under' | 'high_high' | 'low_low';
    let color = '#2563eb';

    if (w.pdi_score < avgPdi && perCapita >= avgPerCapita) {
      flagType = 'under_over';
      color = '#dc2626'; // Red
    } else if (w.pdi_score >= avgPdi && perCapita < avgPerCapita) {
      flagType = 'well_under';
      color = '#16a34a'; // Green
    } else if (w.pdi_score >= avgPdi && perCapita >= avgPerCapita) {
      flagType = 'high_high';
      color = '#2563eb';
    } else {
      flagType = 'low_low';
      color = '#ea580c';
    }

    return {
      ward: w,
      id: w.id,
      name: `W${w.number}`,
      fullName: getLocalizedName(w),
      pdi: w.pdi_score,
      perCapita,
      flagType,
      color,
    };
  });

  const selectedData = selectedWard
    ? chartData.find((d) => d.id === selectedWard.id)
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('equity_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {t('equity_subtitle')}
            </p>
          </div>
        </div>
        <SourceChip screenKey="equity" />
      </div>

      {/* Overview Description */}
      <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
        {t('equity_desc')}
      </p>

      {/* Quadrants Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900">
          <div className="font-bold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span>{t('under_served_over_spent')}</span>
          </div>
          <div className="text-[11px] text-red-700 mt-1">
            {t('under_served_over_spent_desc')}
          </div>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
          <div className="font-bold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>{t('well_served_under_spent')}</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            {t('well_served_under_spent_desc')}
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
          <div className="font-bold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>{t('well_served_high_spend')}</span>
          </div>
          <div className="text-[11px] text-blue-700 mt-1">
            {t('well_served_high_spend_desc')}
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
          <div className="font-bold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <span>{t('under_served_low_spend')}</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-1">
            {t('under_served_low_spend_desc')}
          </div>
        </div>
      </div>

      {/* Main Scatter Chart & Selected Ward Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scatter Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {t('equity_chart_title')}
            </h3>
            <span className="text-xs text-slate-500 font-mono">{t('click_dot_hint')}</span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="pdi"
                  name="PDI Score"
                  domain={[55, 85]}
                  unit=" pts"
                  label={{ value: t('pdi_composite_score'), position: 'bottom', offset: 0, fontSize: 11 }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="perCapita"
                  name="Per Capita"
                  unit=" ₹"
                  label={{ value: t('per_capita_spend'), angle: -90, position: 'insideLeft', fontSize: 11 }}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded shadow text-xs">
                          <div className="font-bold">
                            {data.name}: {data.fullName}
                          </div>
                          <div className="text-slate-300 mt-1">{t('pdi_score_label')}: {data.pdi}</div>
                          <div className="text-slate-300">
                            {t('per_capita_spend')}: ₹{data.perCapita.toLocaleString()}
                          </div>
                          <div className="text-blue-300 font-semibold mt-1">
                            {t('click_dot_audit_hint')}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  x={avgPdi}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                  label={{ value: t('dist_avg_pdi_label'), fill: '#dc2626', fontSize: 10, position: 'top' }}
                />
                <ReferenceLine
                  y={Math.round(avgPerCapita)}
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  label={{ value: `${t('avg_spend_label')} (₹${Math.round(avgPerCapita)})`, fill: '#64748b', fontSize: 10, position: 'right' }}
                />
                <Scatter
                  data={chartData}
                  onClick={(entry) => setSelectedWard(entry.ward)}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={selectedWard?.id === entry.id ? '#0f172a' : '#ffffff'}
                      strokeWidth={selectedWard?.id === entry.id ? 3 : 1.5}
                      r={selectedWard?.id === entry.id ? 9 : 7}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Selected Ward Inspection Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              {t('selected_ward_analysis')}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              {t('ward_col_ward')} {selectedWard?.number}: {getLocalizedName(selectedWard)}
            </h3>
          </div>

          {selectedData && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-500 block">{t('pdi_score_label')}</span>
                  <strong className="text-base text-slate-900">{selectedData.pdi} / 100</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-500 block">{t('per_capita_spend')}</span>
                  <strong className="text-base text-emerald-800">
                    ₹{selectedData.perCapita.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Status flag explanation */}
              <div
                className={`p-3.5 rounded-lg border ${
                  selectedData.flagType === 'under_over'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : selectedData.flagType === 'well_under'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : selectedData.flagType === 'low_low'
                    ? 'bg-orange-50 border-orange-200 text-orange-950'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-xs mb-1">
                  {selectedData.flagType === 'under_over' ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : selectedData.flagType === 'well_under' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : selectedData.flagType === 'low_low' ? (
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  )}
                  <span>
                    {selectedData.flagType === 'under_over'
                      ? t('flagged_under_over')
                      : selectedData.flagType === 'well_under'
                      ? t('benchmark_high_eff')
                      : selectedData.flagType === 'low_low'
                      ? t('flagged_critical')
                      : t('equitable_growth')}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {selectedData.flagType === 'under_over'
                    ? (isMl
                        ? `ഈ വാർഡിൽ ഉയർന്ന ആളോഹരി ചെലവ് (₹${selectedData.perCapita.toLocaleString()}) കാണിക്കുന്നുണ്ടെങ്കിലും വികസന സൂചിക (PDI ${selectedData.pdi}) ജില്ലാ ശരാശരിയേക്കാൾ താഴെയാണ്. നിർവ്വഹണ കാര്യക്ഷമതാ പരിശോധന ആവശ്യമാണ്.`
                        : `This ward displays high public expenditure (₹${selectedData.perCapita.toLocaleString()}/capita) yet remains below the district average in composite development outcomes (${selectedData.pdi}). Leadership audit recommended on project completion efficiency.`)
                    : selectedData.flagType === 'well_under'
                    ? (isMl
                        ? `കുറഞ്ഞ മൂലധന ചെലവിലും ഉയർന്ന വികസന സൂചിക (PDI ${selectedData.pdi}) നേടി കാര്യക്ഷമത തെളിയിച്ച മാതൃകാ വാർഡ്.`
                        : `Achieving high development index metrics (${selectedData.pdi}) with disciplined, below-average capital allocation.`)
                    : selectedData.flagType === 'low_low'
                    ? (isMl
                        ? `കുറഞ്ഞ പി.ഡി.ഐ സ്കോറും (${selectedData.pdi}) കുറഞ്ഞ ആളോഹരി ചെലവും (₹${selectedData.perCapita.toLocaleString()}). ലക്ഷ്യാധിഷ്ഠിത ഫണ്ട് അനുവദിച്ച് അടിയന്തര ഇടപെടൽ നടത്തേണ്ട വാർഡ്.`
                        : `Low PDI score (${selectedData.pdi}) combined with low per-capita spend (₹${selectedData.perCapita.toLocaleString()}). This ward is an urgent priority for targeted GPDP capital grant infusions.`)
                    : (isMl
                        ? `സ്ഥിരമായ മൂലധന നിക്ഷേപത്തിലൂടെ (₹${selectedData.perCapita.toLocaleString()}/ആൾ) ശരാശരിക്ക് മുകളിലുള്ള വികസന നേട്ടം (${selectedData.pdi} PDI) കൈവരിച്ച സന്തുലിത വാർഡ്.`
                        : `Balanced, high-performing trajectory with sustained capital investment (₹${selectedData.perCapita.toLocaleString()}/capita) delivering above-average PDI (${selectedData.pdi}).`)}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1 text-slate-600">
                <div className="font-semibold text-slate-800">{t('governance_rec_title')}</div>
                <p className="text-[11px]">
                  {t('governance_rec_text')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
