'use client';

import React from 'react';
import { SCREEN_SOURCE_MAP } from '@/lib/source-map';
import { Database, Layers, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface SourceChipProps {
  screenKey?: string;
  sourceName?: string;
  className?: string;
  showVerification?: boolean;
}

export const SourceChip: React.FC<SourceChipProps> = ({
  screenKey,
  sourceName,
  className = '',
  showVerification = true,
}) => {
  const { t } = useTranslation();
  const mapping = screenKey ? SCREEN_SOURCE_MAP[screenKey] : null;

  const displaySource = sourceName || mapping?.source_name || 'KSDI / Open Govt Data';
  const displayLayer = mapping ? `${mapping.twin_layer} (${mapping.layer_name})` : 'L1–L8 Twin Layer';
  const displayModule = mapping ? `${mapping.module} (${mapping.module_name})` : 'AICM Delivery Module';
  const displayFeature = mapping ? mapping.feature_id : null;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 text-xs py-1.5 px-2.5 bg-slate-100 border border-slate-200 rounded-md text-slate-700 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-1 font-medium text-slate-800">
        <Database className="w-3.5 h-3.5 text-blue-600" />
        <span>{t('public_source')}:</span>
        <span className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-semibold text-blue-900">
          {displaySource}
        </span>
      </div>

      {displayFeature && (
        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-mono text-[11px]">
          {displayFeature}
        </span>
      )}

      {mapping && (
        <div className="hidden sm:flex items-center gap-1 text-slate-600">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>
            {mapping.twin_layer} → {mapping.module}
          </span>
        </div>
      )}

      {showVerification && (
        <div className="flex items-center gap-1 ml-auto text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>{t('last_verified')}</span>
        </div>
      )}
    </div>
  );
};
