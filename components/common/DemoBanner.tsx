'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { isBannerDismissed, setBannerDismissed } from '@/lib/demo-store';

export const DemoBanner: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [dismissed, setDismissedState] = useState<boolean>(true); // default true to avoid SSR flash

  useEffect(() => {
    setDismissedState(isBannerDismissed());
  }, []);

  // Do not render banner on landing hero page ('/')
  if (pathname === '/' || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissedState(true);
    setBannerDismissed(true);
  };

  return (
    <div
      role="alert"
      className="bg-amber-500 text-slate-950 px-3.5 py-1.5 text-xs font-semibold flex items-center justify-between border-b border-amber-600 shadow-sm transition-all"
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto flex-1">
        <AlertTriangle className="w-4 h-4 text-slate-950 flex-shrink-0" aria-hidden="true" />
        <span className="leading-tight">{t('demo_banner')}</span>
      </div>
      <button
        onClick={handleDismiss}
        aria-label={t('dismiss')}
        className="ml-3 p-1 hover:bg-amber-600 rounded transition-colors text-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-900"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
