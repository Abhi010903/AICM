'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  Users,
  MapPin,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Info,
} from 'lucide-react';
import { KLogo } from '@/components/common/KLogo';
import { lookupPinCode } from '@/lib/pincode-directory';
import {
  requestAadhaarOtp,
  verifyOtp,
  validateAadhaarNumber,
  isDemoMode,
  OtpRequestResult,
} from '@/lib/auth-service';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';

interface AuthCardProps {
  targetRole: UserRole;
}

export const AuthCard: React.FC<AuthCardProps> = ({ targetRole }) => {
  const router = useRouter();
  const { login } = useAuth();

  // Form State
  const [aadhaarNumber, setAadhaarNumber] = useState(isDemoMode ? '234567890123' : '');
  const [pinCode, setPinCode] = useState('673014');
  const [state, setState] = useState('Kerala');
  const [district, setDistrict] = useState('Kozhikode');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinAreaNotice, setPinAreaNotice] = useState<string | null>(
    'Cheruvannur / Feroke'
  );

  // OTP Step State
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [devOtpNotice, setDevOtpNotice] = useState<string | null>(null);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  // Handle PIN Code auto-lookup & validation
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPinCode(raw);
    setErrorMessage(null);

    if (raw.length === 6) {
      const res = lookupPinCode(raw);
      if (res.isValid) {
        setState(res.state);
        setDistrict(res.district);
        setPinAreaNotice(res.area || null);
        setPinError(null);
      } else {
        setPinError(res.error || 'Invalid PIN code.');
        setPinAreaNotice(null);
      }
    } else {
      setPinError(null);
      setPinAreaNotice(null);
    }
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const aadhaarVal = validateAadhaarNumber(aadhaarNumber);
    if (!aadhaarVal.isValid) {
      setErrorMessage(aadhaarVal.error || 'Please enter a valid Aadhaar number.');
      return;
    }

    // Validate PIN
    if (pinCode.length !== 6 || pinError) {
      setErrorMessage('Please enter a valid 6-digit postal PIN code.');
      return;
    }

    setLoading(true);
    try {
      const res: OtpRequestResult = await requestAadhaarOtp(
        aadhaarNumber,
        targetRole,
        state,
        district,
        pinCode
      );

      if (res.success && res.challengeId) {
        setChallengeId(res.challengeId);
        setDevOtpNotice(res.devOtpNotice || null);
        setDevOtpCode(res.devOtpCode || null);
        if (res.devOtpCode) {
          setOtpCode(res.devOtpCode); // Auto-fill in demo mode for frictionless inspection
        }
        setStep('otp');
      } else {
        setErrorMessage(res.error || 'Failed to initiate OTP verification.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred while requesting OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId) return;

    if (otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await verifyOtp(challengeId, otpCode);
      if (res.success && res.session) {
        setVerified(true);
        window.setTimeout(() => login(res.session!), 900);
      } else {
        setErrorMessage(res.error || 'Verification failed.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const isPresident = targetRole === 'president';

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
      {/* Card Header */}
      <div
        className={`p-6 text-white ${
          isPresident
            ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border-b border-slate-700'
            : 'bg-gradient-to-r from-coconut-800 via-coconut-900 to-emerald-950 border-b border-coconut-700'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <KLogo size="sm" showText textVariant="light" />
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
              isPresident
                ? 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
                : 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
            }`}
          >
            {isPresident ? <Building2 className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            <span>{isPresident ? 'MLA Auth' : 'Citizen Verification'}</span>
          </div>
        </div>

        <h2 className="text-xl font-black tracking-tight">
          {isPresident
            ? 'MLA Authentication'
            : 'Citizen Digital Service Access'}
        </h2>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          {isPresident
            ? 'Authenticated administrative access for Grama Panchayat executive leadership.'
            : 'Access land parcel checks, public facilities, hazard maps, and ward tracking.'}
        </p>
      </div>

      {/* Aadhaar privacy notice */}
      <div className="bg-emerald-50/90 border-b border-emerald-100 px-4 py-2 text-[11px] text-emerald-900 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>
          <strong>Privacy by Design:</strong> Your Aadhaar number is used only for verification and is not stored.
        </span>
      </div>

      <div className="p-6">
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {verified ? (
          <div className="py-10 text-center animate-fade-in" role="status" aria-live="polite">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 animate-pulse text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Identity verified</h3>
            <p className="mt-1 text-xs text-slate-600">Your verification was successful. Redirecting to your dashboard…</p>
          </div>
        ) : step === 'input' ? (
          /* Step 1: Input Fields */
          <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
            {/* Aadhaar Number */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>Aadhaar Number</span>
                <span className="text-[10px] text-slate-400 font-normal">12 Digits</span>
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="Enter 12-digit Aadhaar number"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-semibold tracking-wider focus:ring-2 focus:ring-coconut-500 focus:outline-none"
                  required
                />
              </div>
              {isPresident && isDemoMode && (
                <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                  <Info className="w-3 h-3 text-coconut-600 flex-shrink-0" />
                  <span>Use any valid 12-digit Aadhaar number in this environment.</span>
                </div>
              )}
            </div>

            {/* PIN Code with Auto-Lookup */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>PIN Code (Postal Index)</span>
                {pinAreaNotice && (
                  <span className="text-[10px] text-coconut-700 font-semibold">
                    {pinAreaNotice}
                  </span>
                )}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={pinCode}
                  onChange={handlePinChange}
                  placeholder="e.g. 673014"
                  maxLength={6}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-coconut-500 focus:outline-none"
                  required
                />
              </div>
              {pinError && <p className="text-[10px] text-red-600 font-medium">{pinError}</p>}
            </div>

            {/* State & District (Auto-filled / Editable) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-coconut-500 focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-coconut-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-coconut-700 hover:bg-coconut-600 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Generating Challenge...</span>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2 border-t border-slate-100">
              <Link
                href="/"
                className="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Public Landing Page</span>
              </Link>
            </div>
          </form>
        ) : (
          /* Step 2: OTP Verification */
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-slate-600">
                <span>Verification Code Sent To:</span>
                <strong className="text-slate-900">mobile number linked to your Aadhaar</strong>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                An OTP has been sent to the mobile number registered with your Aadhaar. Please enter the OTP to continue.
              </p>
              <div className="text-[11px] text-slate-500">
                Jurisdiction: {district}, {state} ({pinCode})
              </div>
            </div>

            {/* Development Mode Notice & Code Helper */}
            {devOtpNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Demonstration Mode Active</span>
                </div>
                <p className="leading-relaxed">{devOtpNotice}</p>
                {devOtpCode && (
                  <div className="pt-1 flex items-center justify-between">
                    <span>Generated Test Code:</span>
                    <span className="font-mono font-black text-sm text-amber-950 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 tracking-widest">
                      {devOtpCode}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 6-Digit OTP Input */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>Enter 6-Digit OTP</span>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-coconut-700 hover:underline text-[11px] font-semibold"
                >
                  Change details
                </button>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  maxLength={6}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-mono font-bold text-base tracking-widest focus:ring-2 focus:ring-coconut-500 focus:outline-none text-center"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-coconut-700 hover:bg-coconut-600 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Verifying Session...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Verify & Enter {isPresident ? 'Dashboard' : 'Portal'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="hover:text-slate-800 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Aadhaar / PIN</span>
              </button>
              <button
                type="button"
                onClick={handleRequestOtp}
                className="text-coconut-700 font-bold hover:underline"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
