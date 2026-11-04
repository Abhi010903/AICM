'use client';

import React, { useState } from 'react';
import { SCREEN_SOURCE_MAP } from '@/lib/source-map';
import { Database, Layers, CheckCircle2, X } from 'lucide-react';
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
  const [open, setOpen] = useState(false);
  const mapping = screenKey ? SCREEN_SOURCE_MAP[screenKey] : null;

  const displaySource = sourceName || mapping?.source_name || 'KSDI / Open Govt Data';
  const displayFeature = mapping ? mapping.feature_id : null;

  return (
    <div
      className={`fixed bottom-20 right-4 z-[600] ${className}`}
    >
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-xl">
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-900">{t('public_source')}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label={t('source_chip_close')}>
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
          <div className="flex items-start gap-2">
            <Database className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">{displaySource}</p>
              {displayFeature && <p className="mt-1 font-mono text-[11px] text-blue-700">{displayFeature}</p>}
            </div>
          </div>
          {mapping && (
            <div className="mt-2 flex items-center gap-1 text-slate-600">
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span>{mapping.twin_layer} → {mapping.module}</span>
            </div>
          )}
          {showVerification && (
            <div className="mt-2 flex items-center gap-1 font-medium text-emerald-700">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>{t('last_verified')}</span>
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg transition-colors hover:border-blue-400 hover:text-blue-800"
      >
        <Database className="h-3.5 w-3.5 text-blue-600" />
        <span>{open ? t('source_chip_hide') : t('source_chip_verified')}</span>
      </button>
    </div>
  );
};
