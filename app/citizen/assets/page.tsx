'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  X,
  Camera,
  FileText,
  Building,
  Upload,
  Info,
  ExternalLink,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { SourceChip } from '@/components/common/SourceChip';
import { InteractiveMap, MapMarker } from '@/components/maps/InteractiveMap';
import { CitizenLocationBar } from '@/components/common/CitizenLocationBar';
import { Modal } from '@/components/common/Modal';
import { useCitizenLocation } from '@/lib/location-context';
import { calculateDistanceKm } from '@/lib/calculations';
import { getAssets, getWardById } from '@/lib/api';
import {
  getCommunityAssetReports,
  submitCommunityAssetReport,
} from '@/lib/citizen-store';
import {
  Asset,
  AssetCondition,
  AssetConditionReport,
  CommunityReportStatus,
} from '@/lib/types';

export default function SharedAssetsPage() {
  const { t, language, getLocalizedName, getLocalizedCondition, getLocalizedType } = useTranslation();
  const { session } = useAuth();
  const { location } = useCitizenLocation();

  const isMl = language === 'ml';

  // Assets data states
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [communityReports, setCommunityReports] = useState<AssetConditionReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Report Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportedCondition, setReportedCondition] = useState<AssetCondition>('damaged');
  const [reportDescription, setReportDescription] = useState('');
  const [reportPhotoName, setReportPhotoName] = useState<string | null>(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [successReportId, setSuccessReportId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [assetsList] = await Promise.all([getAssets()]);
      setAllAssets(assetsList);
      if (assetsList.length > 0) {
        setSelectedAsset(assetsList[0]);
      }
      setCommunityReports(getCommunityAssetReports());
    } catch (err) {
      console.error('Failed to load shared assets', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Unique Asset types for filter chips
  const assetTypes = useMemo(() => {
    const set = new Set(allAssets.map((a) => a.type));
    return ['all', ...Array.from(set)];
  }, [allAssets]);

  // Filtered assets list
  const filteredAssets = useMemo(() => {
    return allAssets.filter((a) => {
      const matchType = typeFilter === 'all' || a.type === typeFilter;
      const matchCond = conditionFilter === 'all' || a.condition === conditionFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        a.name_en.toLowerCase().includes(q) ||
        a.name_ml.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        `ward ${a.ward_id}`.includes(q);
      return matchType && matchCond && matchSearch;
    });
  }, [allAssets, typeFilter, conditionFilter, searchQuery]);

  // Reports specifically linked to the active selected asset
  const activeAssetReports = useMemo(() => {
    if (!selectedAsset) return [];
    return communityReports.filter((r) => r.asset_id === selectedAsset.id);
  }, [selectedAsset, communityReports]);

  // Submit community condition report (Enforces strict data integrity rule)
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || submittingReport) return;

    const trimmed = reportDescription.trim();
    if (!trimmed) return;

    setSubmittingReport(true);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const reportId = `CR-2026-${randomSuffix}`;

    const newReport: AssetConditionReport = {
      id: reportId,
      asset_id: selectedAsset.id,
      asset_name: getLocalizedName(selectedAsset),
      reporter_name: session?.profileName || 'Concerned Citizen',
      reporter_phone: session?.phone || '9847654321',
      reported_condition: reportedCondition,
      description: trimmed,
      photo_name: reportPhotoName || undefined,
      lat: selectedAsset.lat,
      lng: selectedAsset.lng,
      submitted_at: new Date().toISOString(),
      status: 'under_review',
      reviewer_public_notes: isMl
        ? 'പഞ്ചായത്ത് ജൂനിയർ എഞ്ചിനീയറുടെ പരിശോധനയ്ക്കായി രേഖപ്പെടുത്തി.'
        : 'Logged for Junior Engineer site inspection queue.',
    };

    // Save to citizen store (Note: Verified Asset condition remains unchanged!)
    submitCommunityAssetReport(newReport);
    setCommunityReports(getCommunityAssetReports());
    setSubmittingReport(false);
    setShowReportModal(false);
    setSuccessReportId(reportId);
    setReportDescription('');
    setReportPhotoName(null);
    setTimeout(() => setSuccessReportId(null), 5000);
  };

  const getConditionBadge = (cond: AssetCondition): { label: string; className: string } => {
    switch (cond) {
      case 'good':
        return {
          label: getLocalizedCondition('good'),
          className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 'fair':
        return {
          label: getLocalizedCondition('fair'),
          className: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case 'poor':
        return {
          label: getLocalizedCondition('poor'),
          className: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'damaged':
      default:
        return {
          label: getLocalizedCondition('damaged'),
          className: 'bg-red-100 text-red-800 border-red-300',
        };
    }
  };

  // Map markers
  const mapMarkers: MapMarker[] = useMemo(() => {
    return filteredAssets.slice(0, 45).map((a) => {
      let color = '#16a34a'; // good
      if (a.condition === 'fair') color = '#2563eb';
      if (a.condition === 'poor') color = '#ca8a04';
      if (a.condition === 'damaged') color = '#dc2626';

      return {
        id: `asset_${a.id}`,
        lat: a.lat,
        lng: a.lng,
        title: getLocalizedName(a),
        category: a.type.toUpperCase(),
        color,
        details: isMl
          ? `വാർഡ് ${a.ward_id} · സ്ഥിരീകരിച്ച അവസ്ഥ: ${getLocalizedCondition(a.condition)} · ഉറവിടം: ${a.source || 'Sanchaya'}`
          : `Ward ${a.ward_id} · Verified: ${a.condition.toUpperCase()} · Source: ${a.source || 'Sanchaya'}`,
        source: a.source,
      };
    });
  }, [filteredAssets, getLocalizedName, getLocalizedCondition, isMl]);

  // Center on selected asset or default
  const mapCenter: [number, number] = selectedAsset
    ? [selectedAsset.lat, selectedAsset.lng]
    : [location.lat, location.lng];

  const citizenOriginMarker: MapMarker = {
    id: 'citizen_gps_origin',
    lat: location.lat,
    lng: location.lng,
    title: isMl ? location.label_ml : location.label_en,
    category: isMl ? 'എന്റെ സ്ഥാനം' : 'My Location',
    color: '#0284c7',
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isMl ? 'പൊതു ആസ്തികളും നിരീക്ഷണവും' : 'Shared Public Assets & Monitoring'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              {isMl
                ? 'പഞ്ചായത്തിന്റെ പൊതു അടിസ്ഥാന സൗകര്യ വിവരങ്ങൾ · തത്സമയ അവസ്ഥ പരിശോധനയും റിപ്പോർട്ടിംഗും'
                : 'Panchayat Infrastructure Registry · Verified Conditions & Community Reporting'}
            </p>
          </div>

          {selectedAsset && (
            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{t('assets_community_update')}</span>
            </button>
          )}
        </div>
        <SourceChip screenKey="assets" />
      </div>

      {/* Universal Geolocation Origin Bar (Part 4) */}
      <CitizenLocationBar />

      {/* Success Notification */}
      {successReportId && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <strong>{t('assets_report_success')}</strong>
            <span className="block text-[11px] text-emerald-800">
              {isMl
                ? `റിപ്പോർട്ട് റഫറൻസ്: ${successReportId} (ഫീൽഡ് പരിശോധനയ്ക്കായി കാത്തിരിക്കുന്നു)`
                : `Report reference: ${successReportId} (Pending field verification before updating official status)`}
            </span>
          </div>
        </div>
      )}

      {/* Data Integrity Architecture Banner (Mandatory Part 12) */}
      <div className="p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-700 flex items-start gap-2.5 shadow-2xs">
        <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>{isMl ? 'ഡാറ്റാ സംരക്ഷണ തത്വം:' : 'Data Integrity Principle:'}</strong>{' '}
          {t('assets_report_integrity_note')}
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isMl
                  ? 'ആസ്തിയുടെ പേര് / തരം / വാർഡ് തിരയുക...'
                  : 'Search by asset name, type, or ward...'
              }
              className="w-full pl-8 p-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="p-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="all">{isMl ? 'എല്ലാ അവസ്ഥകളും' : 'All Conditions'}</option>
              <option value="good">{getLocalizedCondition('good')}</option>
              <option value="fair">{getLocalizedCondition('fair')}</option>
              <option value="poor">{getLocalizedCondition('poor')}</option>
              <option value="damaged">{getLocalizedCondition('damaged')}</option>
            </select>
          </div>
        </div>

        {/* Type filter chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1 border-t border-slate-100">
          <span className="font-bold text-slate-700 text-[11px] mr-1">
            {isMl ? 'ആസ്തി വിഭാഗം:' : 'Asset Type:'}
          </span>
          {assetTypes.slice(0, 8).map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                typeFilter === tp
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tp === 'all' ? (isMl ? 'എല്ലാം' : 'All') : getLocalizedType(tp)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Map + Asset Details & Community Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* Left: Spatial Interactive Map */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>{isMl ? 'ഭൂപടത്തിലെ ആസ്തികളുടെ സ്ഥാനം' : 'Geospatial Asset Map'}</span>
            </h3>
            <span className="text-slate-500 font-mono text-[11px]">
              {filteredAssets.length} {t('assets_displayed')}
            </span>
          </div>

          <InteractiveMap
            center={mapCenter}
            zoom={15}
            markers={[citizenOriginMarker, ...mapMarkers]}
            selectedMarkerId={selectedAsset ? `asset_${selectedAsset.id}` : null}
            onMarkerClick={(markerId) => {
              const aId = Number(String(markerId).replace('asset_', ''));
              const found = allAssets.find((a) => a.id === aId);
              if (found) setSelectedAsset(found);
            }}
            height="460px"
          />

          <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-1">
            <span>
              {isMl
                ? 'പച്ച: നല്ലത് · നീല: തൃപ്തികരം · മഞ്ഞ: കേടുപാടുകൾ · ചുവപ്പ്: ഗുരുതരം'
                : 'Green: Good · Blue: Fair · Yellow: Damaged · Red: Critical'}
            </span>
            <span className="font-semibold text-slate-700">
              {isMl ? 'പട്ടികയിൽ നിന്ന് ആസ്തി തിരഞ്ഞെടുക്കുക.' : 'Select an asset from the list to view details.'}
            </span>
          </div>
        </div>

        {/* Right: Selected Asset Detailed Dossier & Community Reports */}
        <div className="space-y-4 min-w-0">
          {selectedAsset && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              {/* Asset Header */}
              {(() => {
                const badge = getConditionBadge(selectedAsset.condition);
                return (
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          ID: #{selectedAsset.id}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}
                        >
                          {t('assets_history_verified')}: {badge.label}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mt-1">
                        {getLocalizedName(selectedAsset)}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {getLocalizedType(selectedAsset.type)} · {isMl ? `വാർഡ് ${selectedAsset.ward_id}` : `Ward ${selectedAsset.ward_id}`}
                      </p>
                    </div>

                    <button
                      onClick={() => setShowReportModal(true)}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1 flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('assets_community_update')}</span>
                    </button>
                  </div>
                );
              })()}

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">{isMl ? 'അവസാന അറ്റകുറ്റപ്പണി' : 'Last Maintained'}</span>
                  <strong className="text-slate-900 font-mono">{selectedAsset.last_maintained}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">{isMl ? 'ഉടമസ്ഥത' : 'Asset Custodian'}</span>
                  <strong className="text-slate-900">{selectedAsset.owner || 'Grama Panchayat'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">{isMl ? 'നികുതി / അസസ്സ്മെന്റ്' : 'Tax Status'}</span>
                  <strong className="text-slate-900 uppercase">{selectedAsset.tax_status || 'Assessed'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">{isMl ? 'ഔദ്യോഗിക സ്രോതസ്സ്' : 'Registry Source'}</span>
                  <strong className="text-emerald-800">{selectedAsset.source || 'Sanchaya'}</strong>
                </div>
              </div>

              {/* Community Reports History Section */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isMl ? 'പൗരന്മാരുടെ നിരീക്ഷണ റിപ്പോർട്ടുകൾ' : 'Community Observation Reports'}</span>
                  </h4>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {activeAssetReports.length} {t('assets_community_pending')}
                  </span>
                </div>

                {activeAssetReports.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    {isMl
                      ? 'ഈ ആസ്തിയെക്കുറിച്ച് പുതിയ പൗര റിപ്പോർട്ടുകൾ ഒന്നും സമർപ്പിച്ചിട്ടില്ല.'
                      : 'No open community condition updates filed for this asset.'}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeAssetReports.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-slate-900">
                            {rep.id}
                          </span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            {rep.status === 'under_review' ? (isMl ? 'പരിശോധനയിൽ' : 'Under Review') : rep.status}
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium">{rep.description}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                          <span>
                            {isMl ? 'റിപ്പോർട്ട് ചെയ്തത്:' : 'Reported by:'} {rep.reporter_name}
                          </span>
                          <span>{new Date(rep.submitted_at).toLocaleDateString()}</span>
                        </div>
                        {rep.reviewer_public_notes && (
                          <p className="text-[10px] text-blue-900 bg-blue-50 p-1.5 rounded mt-1">
                            <strong>{isMl ? 'എഞ്ചിനീയർ കുറിപ്പ്:' : 'Engineer Note:'}</strong> {rep.reviewer_public_notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Asset List Selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider">
                {isMl ? 'ആസ്തികളുടെ പട്ടിക' : 'Panchayat Assets Directory'}
              </h3>
              <span className="text-slate-500 font-mono text-[11px]">
                {filteredAssets.length} {isMl ? 'എണ്ണം' : 'items'}
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {filteredAssets.slice(0, 50).map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                const badge = getConditionBadge(asset.condition);
                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-400 shadow-2xs ring-1 ring-emerald-500'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900">{getLocalizedName(asset)}</h4>
                        <span className="text-[10px] text-slate-500">
                          {getLocalizedType(asset.type)} · {isMl ? `വാർഡ് ${asset.ward_id}` : `Ward ${asset.ward_id}`}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* REPORT SUBMISSION MODAL */}
      {showReportModal && selectedAsset && (
        <Modal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title={t('assets_report_modal_title')}
          subtitle={`${getLocalizedName(selectedAsset)} (Ward ${selectedAsset.ward_id})`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  {isMl ? 'നിങ്ങൾ നിരീക്ഷിച്ച അവസ്ഥ:' : 'Observed Asset Condition:'}
                </label>
                <select
                  value={reportedCondition}
                  onChange={(e) => setReportedCondition(e.target.value as AssetCondition)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="good">{getLocalizedCondition('good')}</option>
                  <option value="fair">{getLocalizedCondition('fair')}</option>
                  <option value="poor">{getLocalizedCondition('poor')}</option>
                  <option value="damaged">{getLocalizedCondition('damaged')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  {isMl ? 'പ്രശ്നത്തിന്റെ വിശദാംശങ്ങൾ:' : 'Condition Description / Issues Observed:'} *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder={
                    isMl
                      ? 'ഉദാ: ടാങ്കിന്റെ ഭിത്തിയിൽ വിള്ളൽ, പൈപ്പ് ചോർച്ച, ലൈറ്റ് കത്തുന്നില്ല...'
                      : 'e.g., Crack noticed on base wall, continuous water seepage...'
                  }
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              {/* Photo Simulation */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isMl ? 'ഫോട്ടോ ചേർക്കുക (ഓപ്ഷണൽ)' : 'Attach Photo (Optional)'}</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setReportPhotoName(e.target.files[0].name);
                    }
                  }}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {reportPhotoName && (
                  <span className="text-[11px] text-emerald-700 font-bold block">
                    ✓ {reportPhotoName}
                  </span>
                )}
              </div>

              {/* Integrity Warning */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                {t('assets_report_integrity_note')}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50"
                >
                  {isMl ? 'റദ്ദാക്കുക' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-sm"
                >
                  {submittingReport ? (isMl ? 'സമർപ്പിക്കുന്നു...' : 'Submitting...') : t('assets_community_update')}
                </button>
              </div>
            </form>
        </Modal>
      )}
    </div>
  );
}
