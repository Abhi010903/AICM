'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TableProperties,
  Scale,
  Compass,
  Building,
  AlertTriangle,
  Clock,
  Sliders,
  MapPin,
  CheckSquare,
  Hospital,
  FolderGit2,
  FileQuestion,
  Layers,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useRole } from '@/lib/role-context';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { role } = useRole();

  const presidentLinks = [
    { href: '/president', label: t('nav_overview'), icon: LayoutDashboard },
    { href: '/president/wards', label: t('nav_wards'), icon: TableProperties },
    { href: '/president/equity', label: t('nav_equity'), icon: Scale },
    { href: '/president/siting', label: t('nav_siting'), icon: Compass },
    { href: '/president/assets', label: t('nav_assets'), icon: Building },
    { href: '/president/hazard', label: t('nav_hazard'), icon: AlertTriangle },
    { href: '/president/promises', label: t('nav_promises'), icon: Clock },
    { href: '/president/budget', label: t('nav_budget'), icon: Sliders },
  ];

  const citizenLinks = [
    { href: '/citizen', label: t('nav_citizen_home'), icon: LayoutDashboard },
    { href: '/citizen/plot', label: t('nav_my_plot'), icon: MapPin },
    { href: '/citizen/build-check', label: t('nav_can_i_build'), icon: CheckSquare },
    { href: '/citizen/facilities', label: t('nav_facilities'), icon: Hospital },
    { href: '/citizen/ward', label: t('nav_ward_works'), icon: FolderGit2 },
    { href: '/citizen/hazard', label: t('nav_citizen_hazard'), icon: AlertTriangle },
    { href: '/citizen/grievance', label: t('nav_report_problem'), icon: FileQuestion },
  ];

  const sharedLinks = [
    { href: '/shared/assets', label: t('nav_shared_assets'), icon: Layers },
    { href: '/shared/ward/7', label: 'S2 Ward 7 Dashboard', icon: TableProperties },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex-shrink-0 hidden md:flex flex-col justify-between p-4 min-h-[calc(100vh-3.5rem)]">
      <div className="space-y-6">
        {/* President Section */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center justify-between">
            <span>{t('role_president')}</span>
            {role === 'president' && (
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
          </div>
          <nav className="space-y-1">
            {presidentLinks.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'hover:bg-slate-800 hover:text-white text-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Citizen Section */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center justify-between">
            <span>{t('role_citizen')}</span>
            {role === 'citizen' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          <nav className="space-y-1">
            {citizenLinks.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : 'hover:bg-slate-800 hover:text-white text-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Shared Section */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            <span>Shared Portal Views</span>
          </div>
          <nav className="space-y-1">
            {sharedLinks.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'hover:bg-slate-800 hover:text-white text-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 px-2">
        <p className="font-semibold text-slate-400">AICM Digital Twin v1.0</p>
        <p>Last verified: 2026-10-30</p>
      </div>
    </aside>
  );
};
