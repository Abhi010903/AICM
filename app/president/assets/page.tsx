'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Building,
  Filter,
  X,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { InteractiveMap } from '@/components/maps/InteractiveMap';
import { getWards, getAssets, getGrievances } from '@/lib/api';
import { Ward, Asset, Grievance, AssetCondition } from '@/lib/types';

function AssetRegisterContent() {
  const { t, getLocalizedName } = useTranslation();
  const searchParams = useSearchParams();

  const [wards, setWards] = useState<Ward[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const initialWard = searchParams.get('ward') ? Number(searchParams.get('ward')) : 0;
  const [selectedWardId, setSelectedWardId] = useState<number>(initialWard);
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected asset for detail drawer
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [wList, aList, gList] = await Promise.all([
          getWards(),
          getAssets(),
          getGrievances(),
        ]);
        setWards(wList);
        setAssets(aList);
        setGrievances(gList);

        // If ward is preselected (e.g. Ward 7 in walkthrough), open a poor asset
        if (initialWard === 7) {
          const poorW7 = aList.find((a) => a.ward_id === 7 && a.condition === 'poor');
          if (poorW7) setSelectedAsset(poorW7);
        }
      } catch (err) {
        console.error('Failed to load asset data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [initialWard]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  // Filter assets
  const filteredAssets = assets.filter((a) => {
    if (selectedWardId !== 0 && a.ward_id !== selectedWardId) return false;
    if (selectedCondition !== 'all' && a.condition !== selectedCondition) return false;
    if (selectedType !== 'all' && a.type !== selectedType) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName =
        a.name_en.toLowerCase().includes(q) || a.name_ml.toLowerCase().includes(q);
      if (!matchName) return false;
    }
    return true;
  });

  // Group-by counts
  const countGood = assets.filter((a) => (selectedWardId ? a.ward_id === selectedWardId : true) && a.condition === 'good').length;
  const countFair = assets.filter((a) => (selectedWardId ? a.ward_id === selectedWardId : true) && a.condition === 'fair').length;
  const countPoor = assets.filter((a) => (selectedWardId ? a.ward_id === selectedWardId : true) && a.condition === 'poor').length;

  // Find linked grievances for selected asset (matching ward_id and relevant category)
  const linkedGrievances = selectedAsset
    ? grievances.filter((g) => {
        if (g.ward_id !== selectedAsset.ward_id) return false;
        // Category relevance: road -> road, drainage -> sanitation/road, streetlight -> lighting, water_tank -> water
        if (selectedAsset.type === 'road' && g.category === 'road') return true;
        if (selectedAsset.type === 'drainage' && (g.category === 'sanitation' || g.category === 'road')) return true;
        if (selectedAsset.type === 'streetlight' && g.category === 'lighting') return true;
        if (selectedAsset.type === 'water_tank' && g.category === 'water') return true;
        return true; // show ward grievances for context
      })
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('nav_assets')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              P4 Asset Health Register · Condition Monitoring & Grievance Correlation
            </p>
          </div>
        </div>
        <SourceChip screenKey="assets" />
      </div>

      {/* Walkthrough Tip */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-3.5 rounded-r-lg text-xs text-blue-900 flex items-center justify-between">
        <div>
          <span className="font-bold">Reviewer Script (Step 3):</span> Inspect{' '}
          <strong>Ward 7 Cheruvannur</strong> assets. Click a <strong className="text-red-700">Poor</strong> condition asset to view maintenance history and linked citizen grievances.
        </div>
        <button
          onClick={() => {
            setSelectedWardId(7);
            const poorW7 = assets.find((a) => a.ward_id === 7 && a.condition === 'poor');
            if (poorW7) setSelectedAsset(poorW7);
          }}
          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] ml-2 flex-shrink-0"
        >
          Inspect Ward 7 Poor Asset
        </button>
      </div>

      {/* Condition Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Total Assets Displayed</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{filteredAssets.length}</div>
        </div>

        <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Good Condition</span>
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{countGood}</div>
        </div>

        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 shadow-2xs">
          <div className="text-xs text-amber-800 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Fair / Moderate</span>
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">{countFair}</div>
        </div>

        <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 shadow-2xs">
          <div className="text-xs text-red-800 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Poor (Urgent Repair)</span>
          </div>
          <div className="text-2xl font-bold text-red-900 mt-1">{countPoor}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        {/* Ward Filter */}
        <div className="flex-1 min-w-[160px]">
          <label className="text-slate-600 block mb-1 font-medium">{t('filter_by_ward')}:</label>
          <select
            value={selectedWardId}
            onChange={(e) => setSelectedWardId(Number(e.target.value))}
            className="w-full p-2 bg-slate-50 rounded-lg border border-slate-300 font-medium"
          >
            <option value={0}>{t('all_wards')}</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                Ward {w.number}: {getLocalizedName(w)}
              </option>
            ))}
          </select>
        </div>

        {/* Condition Filter */}
        <div className="w-36">
          <label className="text-slate-600 block mb-1 font-medium">{t('filter_by_condition')}:</label>
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="w-full p-2 bg-slate-50 rounded-lg border border-slate-300 font-medium"
          >
            <option value="all">{t('all_conditions')}</option>
            <option value="good">{t('cond_good')}</option>
            <option value="fair">{t('cond_fair')}</option>
            <option value="poor">{t('cond_poor')}</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="w-40">
          <label className="text-slate-600 block mb-1 font-medium">{t('filter_by_type')}:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full p-2 bg-slate-50 rounded-lg border border-slate-300 font-medium"
          >
            <option value="all">{t('all_types')}</option>
            <option value="road">Road</option>
            <option value="building">Building</option>
            <option value="water_tank">Water Tank</option>
            <option value="streetlight">Streetlight</option>
            <option value="drainage">Drainage</option>
            <option value="anganwadi">Anganwadi</option>
            <option value="school">School</option>
            <option value="phc">PHC / Health</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[180px]">
          <label className="text-slate-600 block mb-1 font-medium">Search Asset:</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 p-2 bg-slate-50 rounded-lg border border-slate-300 text-xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Ward</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Last Maintained</th>
                <th className="py-3 px-4">Tax / Custody</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    {t('no_records')}
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const ward = wards.find((w) => w.id === asset.ward_id);
                  const isSelected = selectedAsset?.id === asset.id;

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 font-semibold'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-slate-500">#{asset.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{getLocalizedName(asset)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {asset.lat.toFixed(4)}, {asset.lng.toFixed(4)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        Ward {ward?.number}: {ward ? getLocalizedName(ward) : ''}
                      </td>
                      <td className="py-3 px-4 uppercase font-semibold text-slate-600">
                        {asset.type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            asset.condition === 'good'
                              ? 'bg-emerald-100 text-emerald-800'
                              : asset.condition === 'fair'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {asset.condition}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{asset.last_maintained}</td>
                      <td className="py-3 px-4 text-slate-500 capitalize">{asset.tax_status}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAsset(asset);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded text-slate-700 transition-colors"
                        >
                          {t('details')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Detail Drawer with Map Pin & Linked Grievances */}
      {selectedAsset && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex justify-end backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-200">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Sanchaya / IKM Asset Record #{selectedAsset.id}
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {getLocalizedName(selectedAsset)}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ward {selectedAsset.ward_id} · Custodian: {selectedAsset.owner}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label={t('close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status & Maintenance Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Condition Status</span>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                      selectedAsset.condition === 'good'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedAsset.condition === 'fair'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedAsset.condition} Condition
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Last Maintained</span>
                  <strong className="text-sm text-slate-800 mt-1 block">
                    {selectedAsset.last_maintained}
                  </strong>
                </div>
              </div>

              {/* Map Pin Location */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Geotagged Asset Location</span>
                </h4>
                <InteractiveMap
                  center={[selectedAsset.lat, selectedAsset.lng]}
                  zoom={16}
                  markers={[
                    {
                      id: selectedAsset.id,
                      lat: selectedAsset.lat,
                      lng: selectedAsset.lng,
                      title: getLocalizedName(selectedAsset),
                      category: selectedAsset.type,
                      color:
                        selectedAsset.condition === 'good'
                          ? '#16a34a'
                          : selectedAsset.condition === 'fair'
                          ? '#ca8a04'
                          : '#dc2626',
                    },
                  ]}
                  height="220px"
                />
              </div>

              {/* Linked Grievances (Walkthrough Step 3) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>{t('asset_linked_grievances')} ({linkedGrievances.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    CMO Grievance Portal
                  </span>
                </div>

                {linkedGrievances.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No active citizen grievances filed for this asset in this ward.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {linkedGrievances.map((g) => (
                      <div
                        key={g.id}
                        className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-amber-950">
                          <span>{g.id} ({g.category.toUpperCase()})</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 uppercase font-mono">
                            {g.status}
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium">
                          {g.description_en}
                        </p>
                        <p className="text-slate-600 text-[11px] font-malayalam">
                          {g.description_ml}
                        </p>
                        <div className="text-[10px] text-slate-500 pt-1">
                          Filed: {g.filed_date} · Assigned: {g.assigned_dept}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t border-slate-200 mt-6 flex justify-end">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssetHealthPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading assets...</div>}>
      <AssetRegisterContent />
    </Suspense>
  );
}
