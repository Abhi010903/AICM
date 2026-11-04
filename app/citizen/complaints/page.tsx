'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Building,
  Plus,
  AlertOctagon,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { SourceChip } from '@/components/common/SourceChip';
import { getGrievances } from '@/lib/api';
import { Grievance, GrievanceStatus, GrievanceTimelineEntry } from '@/lib/types';

export default function TrackComplaintsPage() {
  const { t, language, getLocalizedStatus, getLocalizedCategory } = useTranslation();
  const { session } = useAuth();

  const isMl = language === 'ml';

  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  const loadComplaints = useCallback(async () => {
    if (!session?.phone) {
      setLoading(false);
      return;
    }

    try {
      setErrorMsg(null);
      // Strictly fetch complaints filtered to the authenticated citizen's phone
      const list = await getGrievances(undefined, session.phone);
      setGrievances(list);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load complaints', err);
      setErrorMsg(
        isMl
          ? 'പരാതികളുടെ തത്സമയ വിവരങ്ങൾ ലഭ്യമാക്കാൻ സാധിച്ചില്ല.'
          : 'Unable to retrieve live grievance records.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.phone, isMl]);

  useEffect(() => {
    void loadComplaints();
  }, [loadComplaints]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    void loadComplaints();
  };

  const toggleExpand = (id: string) => {
    setExpandedTicketId((curr) => (curr === id ? null : id));
  };

  // Filter complaints based on tab and search
  const filteredGrievances = useMemo(() => {
    let result = grievances;

    if (statusFilter === 'active') {
      result = result.filter((g) =>
        ['submitted', 'received', 'under_review', 'in_progress', 'delayed', 'reopened', 'open'].includes(
          g.status
        )
      );
    } else if (statusFilter === 'resolved') {
      result = result.filter((g) => ['resolved', 'closed'].includes(g.status));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (g) =>
          g.id.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q) ||
          g.description_en.toLowerCase().includes(q) ||
          (g.description_ml && g.description_ml.toLowerCase().includes(q))
      );
    }

    return result;
  }, [grievances, statusFilter, searchQuery]);

  // Stepper helper
  const getLifecycleSteps = (currentStatus: GrievanceStatus) => {
    const isRejected = currentStatus === 'rejected';
    const isDelayed = currentStatus === 'delayed';

    // Standard 5 progress steps
    const steps = [
      { id: 'submitted', label: isMl ? 'സമർപ്പിച്ചു' : 'Submitted' },
      { id: 'received', label: isMl ? 'സ്വീകരിച്ചു' : 'Acknowledged' },
      { id: 'under_review', label: isMl ? 'പരിശോധനയിൽ' : 'Under Review' },
      { id: 'in_progress', label: isMl ? 'നടപടി പുരോഗമിക്കുന്നു' : 'In Progress' },
      { id: 'resolved', label: isMl ? 'പരിഹരിച്ചു' : 'Resolved' },
    ];

    let activeIndex = 0;
    if (['received'].includes(currentStatus)) activeIndex = 1;
    if (['under_review'].includes(currentStatus)) activeIndex = 2;
    if (['in_progress', 'delayed', 'open', 'reopened'].includes(currentStatus)) activeIndex = 3;
    if (['resolved', 'closed'].includes(currentStatus)) activeIndex = 4;

    return { steps, activeIndex, isRejected, isDelayed };
  };

  const getStatusBadge = (status: GrievanceStatus) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return {
          label: getLocalizedStatus(status),
          className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 'in_progress':
        return {
          label: getLocalizedStatus(status),
          className: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case 'under_review':
      case 'received':
        return {
          label: getLocalizedStatus(status),
          className: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'delayed':
        return {
          label: isMl ? 'വൈകുന്നു' : 'Delayed',
          className: 'bg-orange-100 text-orange-900 border-orange-300',
        };
      case 'rejected':
        return {
          label: isMl ? 'നിരസിച്ചു' : 'Rejected',
          className: 'bg-red-100 text-red-900 border-red-300',
        };
      case 'submitted':
      default:
        return {
          label: getLocalizedStatus(status),
          className: 'bg-slate-100 text-slate-800 border-slate-300',
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Page Title & Refresh Header */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('track_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {t('track_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-700' : ''}`} />
              <span>{t('track_refresh_btn')}</span>
            </button>

            <Link
              href="/citizen/grievance"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isMl ? 'പുതിയ പരാതി നൽകുക' : 'Report Issue'}</span>
            </Link>
          </div>
        </div>
        <SourceChip screenKey="grievance" />
      </div>

      {lastRefreshed && (
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {isMl ? 'സ്ഥിരീകരിച്ച മൊബൈൽ നമ്പർ:' : 'Filtered to phone:'}{' '}
            <strong className="text-slate-800 font-mono">{session?.phone || '—'}</strong>
          </span>
          <span>
            {isMl ? 'അവസാനം പുതുക്കിയത്:' : 'Last updated:'} {lastRefreshed}
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex rounded-xl bg-slate-100 p-1 font-bold w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isMl ? 'എല്ലാം' : 'All'} ({grievances.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all ${
              statusFilter === 'active'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isMl ? 'നടപടിയിലുള്ളവ' : 'Active'} (
            {
              grievances.filter((g) =>
                ['submitted', 'received', 'under_review', 'in_progress', 'delayed', 'reopened', 'open'].includes(
                  g.status
                )
              ).length
            }
            )
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all ${
              statusFilter === 'resolved'
                ? 'bg-white text-emerald-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isMl ? 'പരിഹരിച്ചവ' : 'Resolved'} (
            {grievances.filter((g) => ['resolved', 'closed'].includes(g.status)).length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isMl ? 'ടിക്കറ്റ് നമ്പർ / വാക്ക് തിരയുക...' : 'Search ticket ID or keyword...'}
            className="w-full pl-8 p-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">{t('loading')}</div>
      ) : filteredGrievances.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm">{t('track_no_records')}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isMl
                ? 'നിങ്ങളുടെ മൊബൈൽ നമ്പറിൽ രജിസ്റ്റർ ചെയ്ത പരാതികൾ ഒന്നും കാണാനില്ല.'
                : 'No grievances have been filed from this mobile number yet.'}
            </p>
          </div>
          <Link
            href="/citizen/grievance"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isMl ? 'പുതിയ പരാതി നൽകുക' : 'File a New Grievance'}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGrievances.map((item) => {
            const isExpanded = expandedTicketId === item.id;
            const badge = getStatusBadge(item.status);
            const { steps, activeIndex, isRejected, isDelayed } = getLifecycleSteps(item.status);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-slate-900">
                        {item.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                      <span>{getLocalizedCategory(item.category)}</span>
                      <span>•</span>
                      <span>{isMl ? `വാർഡ് ${item.ward_id}` : `Ward ${item.ward_id}`}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{item.filed_date}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      {isMl ? 'ചുമതലയുള്ള വകുപ്പ്' : 'Assigned Department'}
                    </span>
                    <strong className="text-slate-800 text-[11px]">{item.assigned_dept}</strong>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {isMl ? item.description_ml || item.description_en : item.description_en}
                </p>

                {/* Delay Notice Banner if delayed */}
                {isDelayed && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-950 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-orange-900">
                        {t('track_delay_title')}
                      </strong>
                      <p className="leading-relaxed">
                        {item.delay_reason || (isMl ? 'സാങ്കേതിക കാരണങ്ങളാൽ നടപടി വൈകുന്നു.' : 'Resolution delayed due to administrative review.')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Rejection Notice Banner if rejected */}
                {isRejected && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-950 flex items-start gap-2">
                    <AlertOctagon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-red-900">
                        {t('track_rejection_title')}
                      </strong>
                      <p className="leading-relaxed">
                        {item.rejection_reason || (isMl ? 'നിയമപരമായ പരിധിയിൽ വരാത്തതിനാൽ നിരസിച്ചു.' : 'Issue closed as outside statutory jurisdiction.')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Visual Status Stepper */}
                {!isRejected && (
                  <div className="py-2">
                    <div className="grid grid-cols-5 gap-1 relative">
                      {steps.map((st, i) => {
                        const isDone = i <= activeIndex;
                        const isCurrent = i === activeIndex;
                        return (
                          <div key={st.id} className="text-center space-y-1">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                isDone
                                  ? isCurrent && isDelayed
                                    ? 'bg-orange-500'
                                    : 'bg-emerald-600'
                                  : 'bg-slate-200'
                              }`}
                            />
                            <span
                              className={`block text-[10px] font-bold truncate px-0.5 ${
                                isCurrent
                                  ? isDelayed
                                    ? 'text-orange-900'
                                    : 'text-emerald-950'
                                  : isDone
                                  ? 'text-slate-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Resolution Note if resolved */}
                {item.resolution_note && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                    <strong className="block text-emerald-900 font-bold mb-0.5">
                      {isMl ? 'തീരുമാന അറിയിപ്പ്:' : 'Resolution Update:'}
                    </strong>
                    <p>{item.resolution_note}</p>
                  </div>
                )}

                {/* Expand Timeline Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <span>{isExpanded ? (isMl ? 'വിശദാംശങ്ങൾ മറയ്ക്കുക' : 'Hide Timeline') : t('track_timeline')}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Detailed Audit Timeline */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-fade-in text-xs">
                    <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                      {t('track_timeline')}
                    </h4>

                    {item.timeline && item.timeline.length > 0 ? (
                      <div className="space-y-3 pl-2 border-l-2 border-emerald-600">
                        {item.timeline.map((entry: GrievanceTimelineEntry, idx: number) => (
                          <div key={idx} className="relative pl-3 space-y-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 absolute -left-[17px] top-1.5" />
                            <div className="flex items-center justify-between text-[11px]">
                              <strong className="text-slate-800">
                                {getLocalizedStatus(entry.status)}
                              </strong>
                              <span className="text-slate-500 font-mono">
                                {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 text-xs">
                              {isMl ? entry.public_message_ml : entry.public_message_en}
                            </p>
                            <span className="text-[10px] text-slate-400 block">
                              {isMl ? 'നടപടി സ്വീകരിച്ചത്:' : 'Action taken by:'} {entry.actor}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic">
                        {isMl
                          ? 'പരാതി സമർപ്പിച്ചു. അധികൃതരുടെ പരിശോധനാ വിവരങ്ങൾ ഉടൻ ലഭ്യമാകും.'
                          : 'Grievance submitted. Departmental inspection updates will appear here.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
