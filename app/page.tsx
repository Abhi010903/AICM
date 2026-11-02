'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  Globe2,
  FileText,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useRole } from '@/lib/role-context';

export default function LandingPage() {
  const { t, language, setLanguage } = useTranslation();
  const { switchRole } = useRole();
  const router = useRouter();

  const handleEnterPresident = () => {
    switchRole('president');
    router.push('/president');
  };

  const handleEnterCitizen = () => {
    switchRole('citizen');
    router.push('/citizen');
  };

  const walkthroughSteps = [
    t('walkthrough_step_1'),
    t('walkthrough_step_2'),
    t('walkthrough_step_3'),
    t('walkthrough_step_4'),
    t('walkthrough_step_5'),
    t('walkthrough_step_6'),
    t('walkthrough_step_7'),
    t('walkthrough_step_8'),
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 sm:p-10 shadow-xl border border-slate-700">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>{t('fictional_badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {t('hero_title')}
          </h1>

          <p className="text-lg sm:text-xl font-medium text-blue-200/90 leading-snug">
            {t('hero_subtitle')}
          </p>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            {t('hero_desc')}
          </p>

          {/* Demographic badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-slate-300">
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block">Wards</span>
              <strong className="text-sm text-white">14 Wards</strong>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block">Population</span>
              <strong className="text-sm text-white">28,450</strong>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block">Households</span>
              <strong className="text-sm text-white">6,820</strong>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 block">Area</span>
              <strong className="text-sm text-white">32.4 sq km</strong>
            </div>
          </div>

          {/* Role Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleEnterPresident}
              className="flex-1 flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-700 rounded-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-base font-bold">{t('enter_president')}</div>
                  <div className="text-xs font-normal text-blue-200">
                    Governance, Siting, Assets, Budget Sandbox
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>

            <button
              onClick={handleEnterCitizen}
              className="flex-1 flex items-center justify-between p-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-800 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-base font-bold">{t('enter_citizen')}</div>
                  <div className="text-xs font-normal text-emerald-200">
                    My Plot, Can I Build, Services, Grievances
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* Persistent Disclaimer Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-900">Demonstration Scope Disclaimer</h4>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            {t('demo_banner')}
          </p>
        </div>
      </div>

      {/* Reviewer's 8-Minute Demo Path */}
      <section className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">{t('walkthrough_title')}</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
            Scripted Demonstration Path
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {walkthroughSteps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data Traceability & Public Sources */}
      <section className="bg-slate-900 text-slate-200 rounded-xl p-6 shadow-sm border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Public Data & Digital Twin Hierarchy</h3>
          </div>
          <span className="text-xs text-slate-400">{t('last_verified')}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-800/80 rounded border border-slate-700">
            <div className="text-blue-400 font-bold mb-1">L1 Spatial Base</div>
            <p className="text-slate-400">KSDI boundaries, hydrography, WFS vector layers.</p>
          </div>
          <div className="p-3 bg-slate-800/80 rounded border border-slate-700">
            <div className="text-blue-400 font-bold mb-1">L2 Cadastral</div>
            <p className="text-slate-400">Ente Bhoomi & ReLIS parcel classification (Nilam / Purayidom).</p>
          </div>
          <div className="p-3 bg-slate-800/80 rounded border border-slate-700">
            <div className="text-blue-400 font-bold mb-1">L3 Built Environment</div>
            <p className="text-slate-400">Sanchaya IKM assets, building footprints, PWD road lines.</p>
          </div>
          <div className="p-3 bg-slate-800/80 rounded border border-slate-700">
            <div className="text-blue-400 font-bold mb-1">L6 Plan & Finance</div>
            <p className="text-slate-400">eGramSwaraj GPDP projects, PDI 9 themes, budget allocations.</p>
          </div>
        </div>
      </section>

      {/* Statutory Footer */}
      <footer className="border-t border-slate-200 pt-6 pb-4 text-xs text-slate-500 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-semibold text-slate-700">{t('statutory_links')}:</span>
            <span className="hover:text-blue-600 cursor-pointer">{t('statutory_kerala_pr')}</span>
            <span>·</span>
            <span className="hover:text-blue-600 cursor-pointer">{t('statutory_ksdi')}</span>
            <span>·</span>
            <span className="hover:text-blue-600 cursor-pointer">{t('statutory_pdi')}</span>
          </div>

          <div className="font-semibold text-slate-700">{t('last_verified')}</div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          AICM Grama Panchayat Digital Twin Demo · Fictional Prototype · No live government network calls
        </div>
      </footer>
    </div>
  );
}
