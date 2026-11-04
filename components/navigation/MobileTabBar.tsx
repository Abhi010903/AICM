'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, AlertCircle, Building, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

export const MobileTabBar: React.FC = () => {
  const pathname = usePathname();
  const { isAuthenticated, role } = useAuth();
  const { t } = useTranslation();

  const isPublicPage = pathname === '/' || pathname.startsWith('/auth');
  if (!isAuthenticated || isPublicPage) {
    return null;
  }

  const isPresident = role === 'president';

  const tabs = isPresident
    ? [
        { href: '/president', label: t('tab_overview'), icon: Home },
        { href: '/president/wards', label: t('tab_wards'), icon: BarChart3 },
        { href: '/president/siting', label: t('tab_siting'), icon: Compass },
        { href: '/president/assets', label: t('tab_assets'), icon: Building },
        { href: '/president/hazard', label: t('tab_hazard'), icon: AlertCircle },
      ]
    : [
        { href: '/citizen', label: t('tab_home'), icon: Home },
        { href: '/citizen/plot', label: t('tab_plot'), icon: Compass },
        { href: '/citizen/build-check', label: t('tab_build'), icon: BarChart3 },
        { href: '/citizen/facilities', label: t('tab_services'), icon: Building },
        { href: '/citizen/grievance', label: t('tab_report'), icon: AlertCircle },
      ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 text-slate-300 py-1.5 px-2 flex items-center justify-around shadow-lg"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded text-[11px] font-medium transition-colors ${
              active
                ? isPresident
                  ? 'text-blue-400 font-bold'
                  : 'text-coconut-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon
              className={`w-5 h-5 mb-0.5 ${
                active ? (isPresident ? 'text-blue-400' : 'text-coconut-400') : 'text-slate-400'
              }`}
            />
            <span className="truncate max-w-[64px]">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
