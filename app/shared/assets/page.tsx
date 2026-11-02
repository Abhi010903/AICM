'use client';

import React, { useEffect, useState } from 'react';
import {
  Layers,
  Building,
  Filter,
  Search,
  MapPin,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SourceChip } from '@/components/common/SourceChip';
import { InteractiveMap } from '@/components/maps/InteractiveMap';
import { getWards, getAssets } from '@/lib/api';
import { Ward, Asset } from '@/lib/types';

export default function SharedAssetRegisterPage() {
  const { t, getLocalizedName } = useTranslation();
  const [wards, setWards] = useState<Ward[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<number>(0);
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [wList, aList] = await Promise.all([getWards(), getAssets()]);
        setWards(wList);
        setAssets(aList);
      } catch (err) {
        console.error('Failed to load shared assets', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  const filteredAssets = assets.filter((a) => {
    if (selectedWardId !== 0 && a.ward_id !== selectedWardId) return false;
    if (selectedCondition !== 'all' && a.condition !== selectedCondition) return false;
    if (selectedType !== 'all' && a.type !== selectedType) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match = a.name_en.toLowerCase().includes(q) || a.name_ml.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Source Chip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t('nav_shared_assets')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              S1 Shared Public Asset Transparency Register · Sanchaya & IKM Custody Records
            </p>
          </div>
        </div>
        <SourceChip screenKey="shared_assets" />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
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

      {/* Read-Only Asset Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Asset Name</th>
                <th className="py-3 px-4">Ward</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Last Maintained</th>
                <th className="py-3 px-4">Custodian</th>
                <th className="py-3 px-4 text-right">View</th>
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

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
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
                      <td className="py-3 px-4 text-slate-500">{asset.owner}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAsset(asset);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors font-semibold"
                        >
                          View
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

      {/* Read-Only Asset Detail Drawer */}
      {selectedAsset && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex justify-end backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white w-full max-w-lg h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-200">
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Public Asset Register #{selectedAsset.id}
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

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Condition</span>
                  <strong className="text-sm uppercase block mt-1">{selectedAsset.condition}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block">Last Maintenance</span>
                  <strong className="text-sm block mt-1">{selectedAsset.last_maintained}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Geographic Pin</span>
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
                      color: '#2563eb',
                    },
                  ]}
                  height="260px"
                />
              </div>
            </div>

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
