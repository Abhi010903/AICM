'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  Building2,
  Users,
  Menu,
  X,
  RotateCcw,
  ShieldAlert,
  LogOut,
  ShieldCheck,
  Search,
  Eye,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { resetDemoState } from '@/lib/demo-store';
import { KLogo } from '@/components/common/KLogo';
import { DashboardSearch } from '@/components/search/DashboardSearch';
import { PreviewModeBanner } from '@/components/navigation/PreviewModeBanner';

export const Header: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  const { session, isAuthenticated, role, isPreviewMode, logout, exitPreviewMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ml' : 'en');
  };

  const handleResetConfirm = () => {
    setResetModalOpen(false);
    resetDemoState();
  };

  const isPresident = role === 'president';

  if (pathname === '/') {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-3">
            {/* Logo / Brand Mnemonic */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => router.push(isAuthenticated ? (isPresident ? '/president' : '/citizen') : '/')}
                className="flex items-center gap-2.5 text-left group focus:outline-none focus:ring-2 focus:ring-coconut-500 rounded"
              >
                <KLogo size="sm" showText textVariant="light" />
              </button>
            </div>

            {/* Prominent Search Bar (Rendered when authenticated) */}
            {isAuthenticated ? (
              <div className="hidden md:flex flex-1 justify-center max-w-md mx-2">
                <DashboardSearch />
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 text-xs text-coconut-300/80 font-medium">
                <span className="w-2 h-2 rounded-full bg-coconut-500 animate-pulse" />
                <span>{t('app_brand')}</span>
              </div>
            )}

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2.5">
              {isAuthenticated ? (
                <>
                  {/* Role & Anonymized User Badge */}
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      isPresident
                        ? 'bg-blue-950/80 text-blue-200 border-blue-800'
                        : 'bg-emerald-950/80 text-emerald-200 border-emerald-800'
                    }`}
                  >
                    {isPresident ? (
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>
                      {isPresident ? t('role_president') : session?.citizenAlias || t('role_citizen')}
                    </span>
                    {session?.district && (
                      <span className="text-[10px] text-slate-400 ml-0.5">
                        ({session.district})
                      </span>
                    )}
                  </div>

                  {/* Return from Preview Mode if active */}
                  {isPreviewMode && (
                    <button
                      onClick={exitPreviewMode}
                      className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                      title={t('nav_return_president')}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{t('nav_exit_preview')}</span>
                    </button>
                  )}

                  {/* Sign Out */}
                  <button
                    onClick={logout}
                    aria-label={t('auth_signout')}
                    title={t('auth_signout')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                /* Unauthenticated Entry Links */
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/president"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{t('auth_president_login')}</span>
                  </Link>
                  <Link
                    href="/auth/citizen"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-coconut-700 hover:bg-coconut-600 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{t('auth_citizen_portal')}</span>
                  </Link>
                </div>
              )}

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                aria-label="Toggle language between English and Malayalam"
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-coconut-400" />
                <span>{language === 'en' ? 'മലയാളം' : 'English'}</span>
              </button>

              {/* Reset Demo Button */}
              <button
                onClick={() => setResetModalOpen(true)}
                title={t('reset_demo')}
                aria-label={t('reset_demo')}
                className="flex items-center gap-1 text-xs p-1.5 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={toggleLanguage}
                className="text-xs font-bold px-2 py-1 rounded bg-slate-800 text-coconut-300 border border-slate-700"
              >
                {language === 'en' ? 'മ' : 'EN'}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-slate-300 hover:text-white focus:outline-none"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Input (when authenticated) */}
          {isAuthenticated && (
            <div className="md:hidden pb-3 pt-1">
              <DashboardSearch />
            </div>
          )}
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-3">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">{t('signed_in_as')}</span>
                  <span className="font-bold text-white">
                    {isPresident ? t('role_president') : session?.citizenAlias || t('role_citizen')}
                  </span>
                </div>
                {isPreviewMode && (
                  <button
                    onClick={() => {
                      exitPreviewMode();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2 bg-amber-600 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('nav_return_president')}</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-red-950 text-red-200 border border-red-800 font-bold rounded text-xs flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('auth_signout')}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/auth/president"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded bg-blue-600 text-white text-xs font-bold text-center"
                >
                  {t('auth_president_login')}
                </Link>
                <Link
                  href="/auth/citizen"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded bg-coconut-700 text-white text-xs font-bold text-center"
                >
                  {t('auth_citizen_portal')}
                </Link>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">{t('reset_demo')}:</span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setResetModalOpen(true);
                }}
                className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-amber-400 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('reset_demo')}</span>
              </button>
            </div>
          </div>
        )}

        {/* MLA Preview Mode Banner (rendered inside sticky header container to prevent mobile overlap) */}
        <PreviewModeBanner />
      </header>

      {/* Reset Confirmation Dialog */}
      {resetModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 border border-slate-200 text-slate-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 text-amber-700">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base">{t('reset_demo')}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('reset_confirm')}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResetModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                {t('confirm_reset')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
