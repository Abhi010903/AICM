'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Globe,
  UserCheck,
  Building2,
  Menu,
  X,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useRole } from '@/lib/role-context';
import { resetDemoState } from '@/lib/demo-store';

export const Header: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  const { role, switchRole } = useRole();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ml' : 'en');
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switchRole(e.target.value as 'president' | 'citizen');
  };

  const handleResetConfirm = () => {
    setResetModalOpen(false);
    resetDemoState();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo / Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2.5 text-left group focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow group-hover:bg-blue-500 transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm tracking-tight text-slate-100 flex items-center gap-1.5">
                    <span>{t('app_title')}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-none">
                    {t('app_subtitle')}
                  </div>
                </div>
              </button>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Role Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <label htmlFor="role-select" className="text-xs text-slate-300 font-medium sr-only">
                  {t('role_switch')}
                </label>
                <select
                  id="role-select"
                  value={role}
                  onChange={handleRoleChange}
                  className="bg-transparent text-xs text-slate-100 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="president" className="bg-slate-800 text-white">
                    {t('role_president')}
                  </option>
                  <option value="citizen" className="bg-slate-800 text-white">
                    {t('role_citizen')}
                  </option>
                </select>
              </div>

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                aria-label="Toggle language between English and Malayalam"
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'en' ? 'മലയാളം' : 'English'}</span>
              </button>

              {/* Reset Demo Button */}
              <button
                onClick={() => setResetModalOpen(true)}
                title={t('reset_demo')}
                aria-label={t('reset_demo')}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{t('reset_demo')}</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={toggleLanguage}
                className="text-xs font-bold px-2 py-1 rounded bg-slate-800 text-emerald-300 border border-slate-700"
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
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{t('role_switch')}:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    switchRole('president');
                    setMobileMenuOpen(false);
                  }}
                  className={`text-xs px-2.5 py-1 rounded font-medium ${
                    role === 'president'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {t('role_president')}
                </button>
                <button
                  onClick={() => {
                    switchRole('citizen');
                    setMobileMenuOpen(false);
                  }}
                  className={`text-xs px-2.5 py-1 rounded font-medium ${
                    role === 'citizen'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {t('role_citizen')}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">{t('reset_demo')}:</span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setResetModalOpen(true);
                }}
                className="text-xs px-2.5 py-1 rounded bg-red-950 text-red-200 border border-red-800 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('reset_demo')}</span>
              </button>
            </div>
          </div>
        )}
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
