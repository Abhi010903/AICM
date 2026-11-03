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
  Leaf,
  HeartHandshake,
  Factory,
  BarChart3,
  Waves,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';
import { KLogo } from '@/components/common/KLogo';

export default function LandingPage() {
  const { t, language } = useTranslation();
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-12">
      {/* Hero Section with Kerala Coconut Leaf Aesthetic & K Logo */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-coconut-950 text-white rounded-3xl p-6 sm:p-12 shadow-2xl border border-coconut-900/60">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-coconut-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl space-y-6">
          {/* Brand Mark & Philosophy Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <KLogo size="md" showText textVariant="light" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coconut-900/80 border border-coconut-500/40 text-coconut-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-coconut-400" />
              <span>ESG-Anchored Grama Panchayat Digital Twin</span>
            </div>
          </div>

          {/* Main Title & Core Philosophy */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Decentralized Governance for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-coconut-300 via-emerald-300 to-teal-200">
                Nature, People &amp; Industry
              </span>
            </h1>
            <p className="text-base sm:text-xl font-medium text-slate-300 leading-relaxed max-w-3xl">
              AICM delivers an intelligent digital replica of Thekkumpuram Grama Panchayat, bridging cadastral spatial zoning, infrastructure asset management, disaster resilience, and citizen transparency.
            </p>
          </div>

          {/* Demographic Fast Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-slate-300">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Jurisdiction</span>
              <strong className="text-sm font-bold text-white">14 Wards (Kozhikode)</strong>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Population</span>
              <strong className="text-sm font-bold text-white">28,450 Citizens</strong>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Households</span>
              <strong className="text-sm font-bold text-white">6,820 Dwellings</strong>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Spatial Extent</span>
              <strong className="text-sm font-bold text-white">32.4 sq km</strong>
            </div>
          </div>

          {/* Two Primary Entry Points */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Entry Point 1: Panchayat President */}
            <Link
              href="/auth/president"
              className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-xl transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-blue-900/80 rounded-xl group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6 text-blue-200" />
                </div>
                <div className="text-left">
                  <div className="text-base font-extrabold flex items-center gap-1.5">
                    <span>Enter as Panchayat President</span>
                  </div>
                  <div className="text-xs font-normal text-blue-200/90 mt-0.5">
                    Governance, Ward Equity, Siting, Fiscal Sandbox &amp; Hazard Command
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 ml-2 text-blue-300 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Entry Point 2: Citizen */}
            <Link
              href="/auth/citizen"
              className="flex items-center justify-between p-5 bg-gradient-to-r from-coconut-700 to-emerald-800 hover:from-coconut-600 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-xl transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-coconut-400 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-coconut-900/80 rounded-xl group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-coconut-200" />
                </div>
                <div className="text-left">
                  <div className="text-base font-extrabold flex items-center gap-1.5">
                    <span>Enter as Citizen</span>
                  </div>
                  <div className="text-xs font-normal text-emerald-200/90 mt-0.5">
                    Cadastral Plot Explorer, Building Pre-Check, Nearby Services &amp; Grievances
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 ml-2 text-coconut-300 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Core Philosophy: Nature, People, Industry (ESG Foundation) */}
      <section className="space-y-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coconut-100 text-coconut-800 text-xs font-bold uppercase tracking-wider">
            <span>Guiding Philosophy</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Nature, People, Industry: ESG in Action
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Local self-government cannot treat development and ecological stewardship as opposing goals. AICM integrates ESG metrics directly into Panchayat decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Pillar 1: Nature (Environmental) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-coconut-400 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-coconut-100 text-coconut-700 flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Environmental Resilience (E)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Statutory enforcement of the <em>Kerala Conservation of Paddy Land &amp; Wetland Act</em> to protect natural flood sinks. Real-time Chaliyar river basin inundation mapping, drought indicators, and slope hazard containment.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-coconut-800 flex items-center gap-1">
              <span>KSDMA Flood Zones · Water Balance Indicators</span>
            </div>
          </div>

          {/* Pillar 2: People (Social) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-400 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Social Equity &amp; Inclusion (S)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Equal access to primary healthcare (FHC/PHC) and schools across all 14 wards. Automated grievance routing with zero-Aadhaar privacy protections and plain-language citizen service accessibility.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-blue-800 flex items-center gap-1">
              <span>UDISE+ Education · e-Health Coverage · Civic Feedback</span>
            </div>
          </div>

          {/* Pillar 3: Industry (Governance) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-emerald-400 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Factory className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Responsible Industry &amp; Governance (G)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent spatial planning for commercial enterprises with setback and ecological clearance. 100% fiscal conservation in ward budget reallocation, verified through Panchayat Development Index (PDI) themes.
            </p>
            <div className="pt-2 text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
              <span>Fiscal Neutrality · GPDP Lifecycle · PDI 9 Themes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Reviewer Scripted Walkthrough Pathway */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-coconut-700" />
            <h2 className="text-lg font-bold text-slate-900">{t('walkthrough_title')}</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-coconut-50 text-coconut-800 border border-coconut-200">
            Scripted Verification Path
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {[
            t('walkthrough_step_1'),
            t('walkthrough_step_2'),
            t('walkthrough_step_3'),
            t('walkthrough_step_4'),
            t('walkthrough_step_5'),
            t('walkthrough_step_6'),
            t('walkthrough_step_7'),
            t('walkthrough_step_8'),
          ].map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-coconut-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Public Data Hierarchy */}
      <section className="bg-slate-900 text-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-coconut-400" />
            <h3 className="text-base font-bold text-white">Public Data &amp; Spatial Hierarchy</h3>
          </div>
          <span className="text-xs text-slate-400">Baseline Verified: 2026-10-30</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-coconut-400 font-bold mb-1">L1 Spatial Base</div>
            <p className="text-slate-400">KSDI administrative boundaries, river corridors, WFS vector layers.</p>
          </div>
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-coconut-400 font-bold mb-1">L2 Cadastral</div>
            <p className="text-slate-400">Ente Bhoomi &amp; ReLIS parcel classifications (Nilam vs Purayidom).</p>
          </div>
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-coconut-400 font-bold mb-1">L3 Built Assets</div>
            <p className="text-slate-400">Sanchaya IKM registers, water networks, PWD roads, streetlights.</p>
          </div>
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-coconut-400 font-bold mb-1">L6 Plan &amp; Finance</div>
            <p className="text-slate-400">eGramSwaraj GPDP projects, PDI 9 themes, fiscal transfer ledger.</p>
          </div>
        </div>
      </section>

      {/* Statutory Footer */}
      <footer className="border-t border-slate-200 pt-6 text-xs text-slate-500 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-semibold text-slate-700">{t('statutory_links')}:</span>
            <span className="hover:text-coconut-700 cursor-pointer">{t('statutory_kerala_pr')}</span>
            <span>·</span>
            <span className="hover:text-coconut-700 cursor-pointer">{t('statutory_ksdi')}</span>
            <span>·</span>
            <span className="hover:text-coconut-700 cursor-pointer">{t('statutory_pdi')}</span>
          </div>

          <div className="font-semibold text-slate-700">{t('last_verified')}</div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          AICM Grama Panchayat Digital Twin Demo · Nature, People, Industry · Privacy by Design
        </div>
      </footer>
    </div>
  );
}
