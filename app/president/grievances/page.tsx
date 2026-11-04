'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, RefreshCw, UserRound } from 'lucide-react';
import { Grievance, GrievanceStatus } from '@/lib/types';
import { SourceChip } from '@/components/common/SourceChip';
import { useTranslation } from '@/lib/i18n';

const statusStyles: Record<GrievanceStatus, string> = {
  submitted: 'bg-slate-100 text-slate-800',
  received: 'bg-slate-100 text-slate-800',
  under_review: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-emerald-100 text-emerald-800',
  delayed: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
  reopened: 'bg-amber-100 text-amber-800',
  open: 'bg-amber-100 text-amber-800',
};

export default function PresidentGrievancesPage() {
  const { t, language, getLocalizedDescription, getLocalizedStatus, getLocalizedCategory } = useTranslation();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const loadGrievances = useCallback(async () => {
    try {
      const response = await fetch(`/api/grievances?refresh=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        throw new Error(`Grievance API returned HTTP ${response.status}.`);
      }
      const data = (await response.json()) as Grievance[];
      if (!Array.isArray(data)) {
        throw new Error('Grievance API returned an invalid response.');
      }
      setGrievances(data);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load grievances.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refreshGrievances = () => {
    setRefreshing(true);
    void loadGrievances();
  };

  useEffect(() => {
    void loadGrievances();
    const interval = window.setInterval(() => {
      void loadGrievances();
    }, 2000);
    return () => window.clearInterval(interval);
  }, [loadGrievances]);

  const liveCount = useMemo(
    () => grievances.filter((grievance) => Boolean(grievance.reporter_name)).length,
    [grievances]
  );

  async function updateGrievance(grievance: Grievance, status: GrievanceStatus) {
    setSavingId(grievance.id);
    try {
      const response = await fetch('/api/grievances', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: grievance.id,
          status,
          resolution_note: notes[grievance.id] || '',
        }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || 'Unable to update grievance.');
      }
      const updated = (await response.json()) as Grievance;
      setGrievances((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update grievance.');
    } finally {
      setSavingId(null);
    }
  }

  const isMl = language === 'ml';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t('nav_grievances')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {isMl
                ? 'പൗരന്മാർ ഉന്നയിച്ച തത്സമയ പരാതികളും പരിഹാര വിവരങ്ങളും.'
                : 'Live complaints raised by citizens, with identity and resolution tracking.'}
            </p>
          </div>
          <button
            type="button"
            onClick={refreshGrievances}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />{' '}
            {refreshing ? t('loading') : isMl ? 'ഇപ്പോൾ പുതുക്കുക' : 'Refresh now'}
          </button>
        </div>
        {lastUpdated && (
          <p className="text-right text-[11px] text-slate-500">
            {isMl ? `അവസാനം പുതുക്കിയത്: ${lastUpdated}` : `Last loaded: ${lastUpdated}`}
          </p>
        )}
        <SourceChip screenKey="grievance" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-semibold text-slate-500">
            {isMl ? 'ആകെ പരാതികൾ' : 'Total complaints'}
          </span>
          <strong className="mt-1 block text-2xl text-slate-900">{grievances.length}</strong>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-semibold text-slate-500">
            {isMl ? 'പുതിയ പരാതികൾ' : 'New live submissions'}
          </span>
          <strong className="mt-1 block text-2xl text-blue-700">{liveCount}</strong>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-semibold text-slate-500">{t('status_open')}</span>
          <strong className="mt-1 block text-2xl text-amber-700">
            {grievances.filter((g) => g.status === 'open').length}
          </strong>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[11px] font-semibold text-slate-500">{t('status_resolved')}</span>
          <strong className="mt-1 block text-2xl text-emerald-700">
            {grievances.filter((g) => g.status === 'resolved').length}
          </strong>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <AlertCircle className="mr-2 inline h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {t('loading')}
        </div>
      ) : (
        <div className="space-y-4">
          {grievances.map((grievance) => (
            <article key={grievance.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-black text-slate-900">{grievance.id}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusStyles[grievance.status]}`}>
                      {getLocalizedStatus(grievance.status)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isMl ? `വാർഡ് ${grievance.ward_id}` : `Ward ${grievance.ward_id}`} · {getLocalizedCategory(grievance.category)}
                    </span>
                  </div>
                  <p className="max-w-3xl text-sm leading-6 text-slate-700">
                    {getLocalizedDescription(grievance)}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                    <span>
                      <UserRound className="mr-1 inline h-3.5 w-3.5 text-blue-600" />
                      {grievance.reporter_name || (isMl ? 'പൗരൻ' : 'Legacy record: reporter details unavailable')}
                    </span>
                    {grievance.reporter_phone && <span>{grievance.reporter_phone}</span>}
                    {grievance.reporter_block && <span>{grievance.reporter_block}</span>}
                    <span>
                      <Clock3 className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
                      {isMl ? `രേഖപ്പെടുത്തിയത്: ${grievance.filed_date}` : `Filed ${grievance.filed_date}`}
                    </span>
                  </div>
                </div>
                <div className="w-full space-y-2 lg:max-w-xs">
                  <label className="block text-[11px] font-bold text-slate-600">
                    {isMl ? 'നടപടി കുറിപ്പ്' : 'Resolution note'}
                  </label>
                  <textarea
                    rows={2}
                    value={notes[grievance.id] ?? grievance.resolution_note ?? ''}
                    onChange={(event) => setNotes((current) => ({ ...current, [grievance.id]: event.target.value }))}
                    placeholder={isMl ? 'സ്വീകരിച്ച നടപടി ചേർക്കുക' : 'Add action taken or next step'}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex flex-wrap gap-2">
                    {(['open', 'in_progress', 'resolved'] as GrievanceStatus[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={savingId === grievance.id}
                        onClick={() => void updateGrievance(grievance, status)}
                        className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors disabled:opacity-50 ${
                          grievance.status === status ? statusStyles[status] : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {status === 'resolved' && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
                        {getLocalizedStatus(status)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {grievance.resolution_note && (
                <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                  <strong>{isMl ? 'ഏറ്റവും പുതിയ നടപടി:' : 'Latest action:'}</strong> {grievance.resolution_note}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
