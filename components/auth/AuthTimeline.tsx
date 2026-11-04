'use client';

import React from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Info,
  KeyRound,
  Lock,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { UserRole } from '@/lib/types';

interface AuthTimelineProps {
  targetRole: UserRole;
  t: (key: string, fallback?: string) => string;
  step: 'input' | 'otp';
  verified: boolean;
  loading: boolean;
  errorMessage: string | null;
  pinError: string | null;
  pinAreaNotice: string | null;
  aadhaarNumber: string;
  pinCode: string;
  state: string;
  district: string;
  otpCode: string;
  devOtpNotice: string | null;
  devOtpCode: string | null;
  setAadhaarNumber: (value: string) => void;
  setOtpCode: (value: string) => void;
  setState: (value: string) => void;
  setDistrict: (value: string) => void;
  setStep: (value: 'input' | 'otp') => void;
  handlePinChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRequestOtp: (event: React.FormEvent) => void;
  handleVerifyOtp: (event: React.FormEvent) => void;
}

export const AuthTimeline: React.FC<AuthTimelineProps> = ({
  targetRole,
  t,
  step,
  verified,
  loading,
  errorMessage,
  pinError,
  pinAreaNotice,
  aadhaarNumber,
  pinCode,
  state,
  district,
  otpCode,
  devOtpNotice,
  devOtpCode,
  setAadhaarNumber,
  setOtpCode,
  setState,
  setDistrict,
  setStep,
  handlePinChange,
  handleRequestOtp,
  handleVerifyOtp,
}) => {
  const { language, setLanguage } = useTranslation();
  const isPresident = targetRole === 'president';
  const activeStep = verified ? 3 : step === 'otp' ? 2 : 1;
  const stepClass = (number: number) =>
    number < activeStep
      ? 'bg-emerald-600 text-white'
      : number === activeStep
        ? 'bg-emerald-700 text-white ring-4 ring-emerald-100'
        : 'bg-slate-100 text-slate-500 border border-slate-200';
  const cardClass = (number: number) =>
    number === activeStep
      ? 'border-emerald-200 bg-emerald-50/30 shadow-sm'
      : 'border-slate-200 bg-white';

  return (
    <section className="flex min-h-screen w-full flex-col overflow-y-auto bg-[#f8fafc] px-5 py-6 sm:px-10 lg:h-screen lg:w-[55%] lg:flex-shrink-0 lg:px-[7%] lg:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#102542]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
            </span>
            {isPresident ? t('auth_president_login') : t('auth_citizen_portal')}
          </div>
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600 shadow-sm transition hover:border-emerald-300"
          >
            {language === 'en' ? 'EN' : 'മലയാളം'}
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-[#102542] sm:text-4xl">
            {isPresident
              ? t('auth_mla_login_title', 'MLA Login')
              : t('auth_citizen_login_title', 'Citizen Login')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isPresident
              ? t('auth_mla_login_sub', 'Verify your identity to access the constituency command dashboard.')
              : t('auth_citizen_login_sub', 'Verify your identity to access your Panchayat dashboard.')}
          </p>
        </div>

        <div className="relative flex-1">
          <div className="absolute left-[17px] top-5 h-[calc(100%-80px)] w-px bg-slate-200">
            <div
              className="w-full bg-emerald-500 transition-all duration-700 ease-out"
              style={{ height: `${Math.min((activeStep - 1) / 2, 1) * 100}%` }}
            />
          </div>

          <div className="relative space-y-5">
            <div className="flex gap-4">
              <div className={`z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 ${stepClass(1)}`}>
                {activeStep > 1 ? <Check className="h-5 w-5" /> : '1'}
              </div>
              <div className={`min-w-0 flex-1 rounded-2xl border p-5 transition-all duration-500 ${cardClass(1)}`}>
                <h2 className="text-base font-extrabold text-[#102542]">{t('auth_timeline_details', 'Aadhaar & location details')}</h2>
                <form onSubmit={handleRequestOtp} className={`mt-4 space-y-3 transition-all duration-500 ${activeStep === 1 ? 'opacity-100' : 'opacity-70'}`}>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">{t('auth_aadhaar_label')}</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={aadhaarNumber}
                        onChange={(event) => setAadhaarNumber(event.target.value.replace(/\D/g, '').slice(0, 12))}
                        placeholder={t('auth_aadhaar_placeholder')}
                        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold tracking-wider outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>{t('auth_pin_label')}</span>
                      {pinAreaNotice && <span className="font-semibold text-emerald-700">{pinAreaNotice}</span>}
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={pinCode}
                        onChange={handlePinChange}
                        placeholder={t('auth_pin_placeholder')}
                        maxLength={6}
                        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        required
                      />
                    </div>
                    {pinError && <p className="mt-1 text-[11px] font-medium text-red-600">{pinError}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-bold text-slate-700">
                      {t('auth_state_label')}
                      <input value={state} onChange={(event) => setState(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-medium outline-none focus:border-emerald-500" required />
                    </label>
                    <label className="text-xs font-bold text-slate-700">
                      {t('auth_district_label')}
                      <input value={district} onChange={(event) => setDistrict(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-medium outline-none focus:border-emerald-500" required />
                    </label>
                  </div>
                  {activeStep === 1 && (
                    <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-600 disabled:opacity-50">
                      {loading ? t('auth_btn_generating') : t('auth_btn_next')}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </button>
                  )}
                </form>
              </div>
            </div>

            <div className="flex gap-4">
              <div className={`z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 ${stepClass(2)}`}>
                {activeStep > 2 ? <Check className="h-5 w-5" /> : '2'}
              </div>
              <div className={`min-w-0 flex-1 rounded-2xl border p-5 transition-all duration-500 ${cardClass(2)}`}>
                <h2 className="text-base font-extrabold text-[#102542]">{t('auth_timeline_otp', 'Verify mobile OTP')}</h2>
                <p className="mt-1 text-xs text-slate-500">{t('auth_otp_instructions')}</p>
                <form onSubmit={handleVerifyOtp} className={`mt-4 transition-all duration-500 ${activeStep === 2 ? 'max-h-[500px] opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
                  <p className="mb-3 text-sm text-slate-600">{t('auth_otp_mobile_copy', 'A one-time password was sent to your Aadhaar-registered mobile number ending in')} <strong className="text-[#102542]">XXXXXX9897</strong>.</p>
                  {devOtpNotice && (
                    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                      <div className="flex items-center gap-2 font-bold"><Info className="h-4 w-4" />{t('auth_demo_mode_title')}</div>
                      <p className="mt-1">{devOtpNotice}</p>
                      {devOtpCode && <strong className="mt-1 block font-mono tracking-widest">{t('auth_demo_code_label')} {devOtpCode}</strong>}
                    </div>
                  )}
                  <label className="mb-1 block text-xs font-bold text-slate-700">{t('auth_enter_otp_label')}</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input type="text" value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" maxLength={6} className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 text-center font-mono text-lg font-bold tracking-widest outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" required />
                    </div>
                    <button type="submit" disabled={loading} className="rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50">
                      {loading ? t('auth_btn_verifying') : t('auth_btn_verify_enter')}
                    </button>
                  </div>
                  <button type="button" onClick={() => setStep('input')} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
                    <ArrowLeft className="h-3 w-3" /> {t('auth_change_details')}
                  </button>
                </form>
              </div>
            </div>

            <div className="flex gap-4">
              <div className={`z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 ${stepClass(3)}`}>
                {verified ? <Check className="h-5 w-5" /> : '3'}
              </div>
              <div className={`min-w-0 flex-1 rounded-2xl border p-5 transition-all duration-500 ${cardClass(3)}`}>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`h-7 w-7 transition-colors duration-500 ${verified ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <div>
                    <h2 className="text-base font-extrabold text-[#102542]">{t('auth_verified_title', 'Identity verified')}</h2>
                    <p className="text-xs text-slate-500">{t('auth_verified_sub')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}
        <div className="mt-6 flex items-center gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <Lock className="h-4 w-4" />
          {t('auth_privacy_notice')}
        </div>
      </div>
    </section>
  );
};
