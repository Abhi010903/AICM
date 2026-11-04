'use client';

import React, { useState } from 'react';
import { AuthTimeline } from '@/components/auth/AuthTimeline';
import { lookupPinCode } from '@/lib/pincode-directory';
import {
  requestAadhaarOtp,
  verifyOtp,
  validateAadhaarNumber,
  isDemoMode,
  OtpRequestResult,
} from '@/lib/auth-service';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { UserRole } from '@/lib/types';

interface AuthCardProps {
  targetRole: UserRole;
}

export const AuthCard: React.FC<AuthCardProps> = ({ targetRole }) => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [aadhaarNumber, setAadhaarNumber] = useState(isDemoMode ? '234567890123' : '');
  const [pinCode, setPinCode] = useState('673014');
  const [state, setState] = useState('Kerala');
  const [district, setDistrict] = useState('Kozhikode');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinAreaNotice, setPinAreaNotice] = useState<string | null>('Cheruvannur / Feroke');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [devOtpNotice, setDevOtpNotice] = useState<string | null>(null);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const handlePinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/\D/g, '').slice(0, 6);
    setPinCode(raw);
    setErrorMessage(null);

    if (raw.length === 6) {
      const result = lookupPinCode(raw);
      if (result.isValid) {
        setState(result.state);
        setDistrict(result.district);
        setPinAreaNotice(result.area || null);
        setPinError(null);
      } else {
        setPinError(result.error || 'Invalid PIN code.');
        setPinAreaNotice(null);
      }
    } else {
      setPinError(null);
      setPinAreaNotice(null);
    }
  };

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const aadhaarValidation = validateAadhaarNumber(aadhaarNumber);
    if (!aadhaarValidation.isValid) {
      setErrorMessage(aadhaarValidation.error || 'Please enter a valid Aadhaar number.');
      return;
    }
    if (pinCode.length !== 6 || pinError) {
      setErrorMessage('Please enter a valid 6-digit postal PIN code.');
      return;
    }

    setLoading(true);
    try {
      const result: OtpRequestResult = await requestAadhaarOtp(
        aadhaarNumber,
        targetRole,
        state,
        district,
        pinCode
      );
      if (result.success && result.challengeId) {
        setChallengeId(result.challengeId);
        setDevOtpNotice(result.devOtpNotice || null);
        setDevOtpCode(result.devOtpCode || null);
        if (result.devOtpCode) {
          setOtpCode(result.devOtpCode);
        }
        setStep('otp');
      } else {
        setErrorMessage(result.error || 'Failed to initiate OTP verification.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred while requesting OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!challengeId) return;
    if (otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await verifyOtp(challengeId, otpCode);
      if (result.success && result.session) {
        setVerified(true);
        window.setTimeout(() => login(result.session!), 900);
      } else {
        setErrorMessage(result.error || 'Verification failed.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthTimeline
      targetRole={targetRole}
      t={t}
      step={step}
      verified={verified}
      loading={loading}
      errorMessage={errorMessage}
      pinError={pinError}
      pinAreaNotice={pinAreaNotice}
      aadhaarNumber={aadhaarNumber}
      pinCode={pinCode}
      state={state}
      district={district}
      otpCode={otpCode}
      devOtpNotice={devOtpNotice}
      devOtpCode={devOtpCode}
      setAadhaarNumber={setAadhaarNumber}
      setOtpCode={setOtpCode}
      setState={setState}
      setDistrict={setDistrict}
      setStep={setStep}
      handlePinChange={handlePinChange}
      handleRequestOtp={handleRequestOtp}
      handleVerifyOtp={handleVerifyOtp}
    />
  );
};
