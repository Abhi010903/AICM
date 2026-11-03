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
  Eye,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { session, isAuthenticated, role, isPreviewMode, enterPreviewMode, exitPreviewMode } = useAuth();

  // Hide internal dashboard navigation completely on public landing and auth pages
  const isPublicPage = pathname === '/' || pathname.startsWith('/auth');
  if (!isAuthenticated || isPublicPage) {
    return null;
  }

  const isPresident = session?.role === 'president';
  const viewingCitizenView = role === 'citizen';

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

  const activeLinks = viewingCitizenView ? citizenLinks : presidentLinks;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex-shrink-0 hidden md:flex flex-col justify-between p-4 min-h-[calc(100vh-3.5rem)] select-none">
      <div className="space-y-6">
        {/* Role Header Badge */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center justify-between">
            <span>{viewingCitizenView ? (isPreviewMode ? 'Citizen (Preview)' : t('role_citizen')) : t('role_president')}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                viewingCitizenView ? 'bg-coconut-500' : 'bg-blue-500'
              } animate-pulse`}
            />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {activeLinks.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? viewingCitizenView
                        ? 'bg-coconut-700 text-white font-semibold shadow-sm'
                        : 'bg-blue-600 text-white font-semibold shadow-sm'
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

        {/* Shared Quick Reference Link */}
        <div className="pt-2 border-t border-slate-800">
          <Link
            href="/shared/assets"
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              pathname === '/shared/assets'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Shared Asset Registry</span>
          </Link>
        </div>
      </div>

      {/* Sidebar Bottom Controls */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        {/* VIEW AS CITIZEN button (Panchayat President Only) */}
        {isPresident && !isPreviewMode && (
          <button
            onClick={enterPreviewMode}
            className="w-full p-2.5 rounded-xl bg-gradient-to-r from-coconut-700 to-emerald-800 hover:from-coconut-600 hover:to-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 group"
          >
            <Eye className="w-4 h-4 text-coconut-300 group-hover:scale-110 transition-transform" />
            <span>VIEW AS CITIZEN</span>
          </button>
        )}

        {/* RETURN TO PRESIDENT DASHBOARD button (When in Preview Mode) */}
        {isPreviewMode && (
          <button
            onClick={exitPreviewMode}
            className="w-full p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to President</span>
          </button>
        )}

        {/* Jurisdiction & Security Footer */}
        <div className="px-2 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between text-slate-400 font-semibold">
            <span>Thekkumpuram Twin</span>
            <span>v2.0</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-coconut-400/80">
            <ShieldCheck className="w-3 h-3" />
            <span>Zero-Aadhaar · ESG Compliant</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
