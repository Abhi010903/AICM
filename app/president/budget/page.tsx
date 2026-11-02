'use client';

import React, { useEffect, useState } from 'react';
import {
  Sliders,
  TrendingUp,
  ArrowRight,
  IndianRupee,
  Scale,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { getWards } from '@/lib/api';
import { Ward } from '@/lib/types';
import { simulateBudgetShift, calculatePerCapitaSpend } from '@/lib/calculations';

export default function BudgetSimulationPage() {
  const { t, getLocalizedName } = useTranslation();
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulation Parameters (Walkthrough Step 5: Shift ₹50L from Ward 7 to Ward 2)
  const [fromWardId, setFromWardId] = useState<number>(7); // Donor: Ward 7 Cheruvannur
  const [toWardId, setToWardId] = useState<number>(2);     // Recipient: Ward 2 Padinjarekkara
  const [amountLakhs, setAmountLakhs] = useState<number>(50); // ₹50 Lakhs

  useEffect(() => {
    async function load() {
      try {
        const data = await getWards();
        setWards(data);
      } catch (err) {
        console.error('Failed to load wards for budget simulation', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  // Run pure simulation calculation
  const simulationResult = simulateBudgetShift(wards, {
    from_ward_id: fromWardId,
    to_ward_id: toWardId,
    amount_lakhs: amountLakhs,
  });

  const fromSim = simulationResult.simulated_wards.find((sw) => sw.ward.id === fromWardId);
  const toSim = simulationResult.simulated_wards.find((sw) => sw.ward.id === toWardId);

  const originalWardMean =
    wards.length > 0
      ? Math.round((wards.reduce((sum, w) => sum + w.pdi_score, 0) / wards.length) * 10) / 10
      : 72.4;
  const newWardMean = simulationResult.district_avg_pdi;
  const meanDelta = Math.round((newWardMean - originalWardMean) * 10) / 10;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('budget_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              P17 Budget Simulation Sandbox · Real-time GPDP Fund Reallocation & PDI Impact
            </p>
          </div>
        </div>
        <SourceChip screenKey="budget" />
      </div>

      {/* Walkthrough Script Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-3.5 rounded-r-lg text-xs text-blue-900 flex items-center justify-between">
        <div>
          <span className="font-bold">Reviewer Script (Step 5):</span> Adjust the slider to shift{' '}
          <strong>₹50 Lakhs</strong> from <strong>Ward 7 (Cheruvannur)</strong> to{' '}
          <strong>Ward 2 (Padinjarekkara)</strong>. Observe the projected PDI increase in Ward 2 and the district average response.
        </div>
        <button
          onClick={() => {
            setFromWardId(7);
            setToWardId(2);
            setAmountLakhs(50);
          }}
          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] ml-2 flex-shrink-0"
        >
          Preset ₹50L Shift
        </button>
      </div>

      {/* Simulator Control Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Capital Transfer Simulator</h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            {t('budget_conserved_badge')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Transfer From (Donor) */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700">{t('shift_from')}:</label>
            <select
              value={fromWardId}
              onChange={(e) => setFromWardId(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold"
            >
              {wards.map((w) => (
                <option key={w.id} value={w.id} disabled={w.id === toWardId}>
                  Ward {w.number}: {getLocalizedName(w)} (Current: ₹{w.spend_lakhs}L)
                </option>
              ))}
            </select>
            <div className="text-[11px] text-slate-500">
              Allocated spend will be reduced by simulated amount.
            </div>
          </div>

          {/* Transfer To (Recipient) */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700">{t('shift_to')}:</label>
            <select
              value={toWardId}
              onChange={(e) => setToWardId(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-300 font-semibold"
            >
              {wards.map((w) => (
                <option key={w.id} value={w.id} disabled={w.id === fromWardId}>
                  Ward {w.number}: {getLocalizedName(w)} (Current: ₹{w.spend_lakhs}L)
                </option>
              ))}
            </select>
            <div className="text-[11px] text-slate-500">
              Receives additional fund allocation to boost PDI themes.
            </div>
          </div>

          {/* Amount Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">{t('shift_amount')}:</label>
              <strong className="text-sm font-extrabold text-blue-700">
                ₹{amountLakhs} Lakhs
              </strong>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              step={5}
              value={amountLakhs}
              onChange={(e) => setAmountLakhs(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>₹0L</span>
              <span>₹25L</span>
              <span>₹50L</span>
              <span>₹80L</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Formula Card */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-xs font-mono">
          Formula: new_pdi = old_pdi + 0.3 * (delta_spend / population * 1000) [Capped at 100]
        </div>
      </div>

      {/* Dynamic Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Donor Ward Result */}
        {fromSim && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                Funding Ward (Donor)
              </span>
              <h4 className="text-base font-bold text-slate-900">
                Ward {fromSim.ward.number}: {getLocalizedName(fromSim.ward)}
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Allocated Spend:</span>
                <span className="font-bold">
                  ₹{fromSim.old_spend_lakhs}L → <span className="text-red-700">₹{fromSim.new_spend_lakhs}L</span>
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Per-Capita Spend:</span>
                <span className="font-bold">
                  ₹{fromSim.old_per_capita} → ₹{fromSim.new_per_capita}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Projected PDI Score:</span>
                <span className="font-bold">
                  {fromSim.old_pdi} → <span className="text-slate-800">{fromSim.new_pdi}</span> ({fromSim.delta_pdi} pts)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recipient Ward Result */}
        {toSim && (
          <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-md space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Receiving Ward (Recipient)
              </span>
              <h4 className="text-base font-bold text-slate-900">
                Ward {toSim.ward.number}: {getLocalizedName(toSim.ward)}
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Allocated Spend:</span>
                <span className="font-bold">
                  ₹{toSim.old_spend_lakhs}L → <span className="text-emerald-700 font-extrabold">₹{toSim.new_spend_lakhs}L</span>
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Per-Capita Spend:</span>
                <span className="font-bold">
                  ₹{toSim.old_per_capita} → ₹{toSim.new_per_capita}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Projected PDI Score:</span>
                <span className="font-bold">
                  {toSim.old_pdi} → <span className="text-emerald-700 font-extrabold">{toSim.new_pdi}</span> (+{toSim.delta_pdi} pts)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* District Average Impact Readout */}
        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Panchayat-Wide Impact
            </span>
            <h4 className="text-base font-bold">Panchayat Mean PDI Projection</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">Projected Ward Mean PDI:</span>
              <div className="text-3xl font-black text-white mt-1">
                {newWardMean}
                <span className="text-xs font-semibold text-slate-400 ml-1">/ 100</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Baseline Ward Mean: {originalWardMean} ({meanDelta >= 0 ? `+${meanDelta}` : meanDelta} pts shift)
              </div>
            </div>

            <div className="p-3 bg-slate-800 rounded border border-slate-700 text-[11px] text-slate-300">
              {simulationResult.is_conserved ? (
                <>
                  Total Budget Conserved: <strong>₹{simulationResult.total_panchayat_spend} Lakhs</strong> (Exact fiscal neutrality maintained).
                  {fromSim && fromSim.old_spend_lakhs - fromSim.new_spend_lakhs < amountLakhs && (
                    <div className="mt-1 text-amber-300">
                      Applied transfer capped at ₹{Math.round((fromSim.old_spend_lakhs - fromSim.new_spend_lakhs) * 10) / 10} Lakhs (donor ward spend ceiling).
                    </div>
                  )}
                </>
              ) : (
                <span className="text-amber-400">
                  Warning: Total spend is ₹{simulationResult.total_panchayat_spend} Lakhs. Fiscal neutrality is not maintained.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
