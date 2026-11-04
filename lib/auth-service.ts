/**
 * AICM Authentication & Session Architecture
 *
 * Implements role-based authentication with OTP verification, PIN code validation,
 * secure session tokens, rate limiting, and explicit separation between
 * development demonstration mode and production SMS gateway integration.
 *
 * Privacy Note: Aadhaar numbers are validated only for the request and are never stored.
 */

import { UserRole } from './types';
import demoUsers from '../data/demo-users.json';

interface DemoUserProfile {
  aadhaar: string;
  name: string;
  mobile: string;
  block: string;
  ward_id: number;
}

export interface AuthSession {
  token: string;
  role: UserRole;
  phone: string; // Phone number stored in client session storage for demo portal; masked in UI
  maskedPhone: string;
  state: string;
  district: string;
  pinCode: string;
  citizenAlias: string; // e.g. "Citizen 007" for privacy-preserving reporting
  profileName?: string;
  profileBlock?: string;
  profileWardId?: number;
  aadhaarLast4?: string;
  createdAt: number;
  expiresAt: number;
  isPreviewMode?: boolean; // Set when Panchayat President views as Citizen
}

export interface OtpRequestResult {
  success: boolean;
  challengeId?: string;
  cooldownSeconds?: number;
  devOtpNotice?: string;
  devOtpCode?: string; // Provided ONLY in development demonstration mode with explicit disclaimer
  error?: string;
}

export function validateAadhaarNumber(aadhaar: string): { isValid: boolean; error?: string } {
  const cleaned = aadhaar.replace(/\D/g, '');
  if (cleaned.length !== 12) {
    return { isValid: false, error: 'Aadhaar number must be exactly 12 digits.' };
  }
  if (/^(\d)\1{11}$/.test(cleaned)) {
    return { isValid: false, error: 'Please enter a valid Aadhaar number.' };
  }
  return { isValid: true };
}

export interface OtpVerificationResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

// In-memory challenge store for active OTP attempts with TTL & rate-limiting
interface OtpChallenge {
  challengeId: string;
  phone: string;
  role: UserRole;
  state: string;
  district: string;
  pinCode: string;
  code: string;
  expiresAt: number;
  failedAttempts: number;
  profile?: DemoUserProfile;
}

const activeChallenges: Map<string, OtpChallenge> = new Map();
const rateLimitMap: Map<string, { lastRequestTime: number; requestCount: number }> = new Map();

const SESSION_STORAGE_KEY = 'aicm_auth_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FAILED_ATTEMPTS = 3;
const RATE_LIMIT_COOLDOWN_MS = 30 * 1000; // 30 seconds

/**
 * Authorized phone numbers for Panchayat President administrative access.
 * In a production architecture, this allowlist is maintained and checked strictly on the server.
 */
export const AUTHORIZED_PRESIDENT_NUMBERS: readonly string[] = [
  '9447100001', // Official President Mobile (Kunnamangalam Constituency)
  '9847012345', // Alternate President Demonstration Mobile
];

/**
 * Generates a cryptographically random 6-digit OTP string
 */
function generateSecureOtp(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return (100000 + (buffer[0] % 900000)).toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generates a cryptographically random token with prefix
 */
function generateSecureToken(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}_${Date.now()}_${hex}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * In demo mode, provides verification codes for testing without live telecom SMS infrastructure.
 * Enabled in non-production environments, or in production only when NEXT_PUBLIC_DEMO_MODE is explicitly 'true'.
 */
export const isDemoMode =
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/**
 * Masks phone number to protect citizen privacy (e.g., +91 ••••• ••456)
 */
export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '••••';
  const lastFour = cleaned.slice(-4);
  return `+91 ••••• ••${lastFour}`;
}

/**
 * Validates a 10-digit Indian mobile number
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) {
    return { isValid: false, error: 'Mobile number must be exactly 10 digits.' };
  }
  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return { isValid: false, error: 'Mobile number must start with 6, 7, 8, or 9 per Indian telecom standards.' };
  }
  return { isValid: true };
}

/**
 * Initiates an OTP authentication challenge
 */
export async function requestOtp(
  phone: string,
  role: UserRole,
  state: string,
  district: string,
  pinCode: string,
  profile?: DemoUserProfile
): Promise<OtpRequestResult> {
  const phoneValidation = validatePhoneNumber(phone);
  if (!phoneValidation.isValid) {
    return { success: false, error: phoneValidation.error };
  }

  const cleanedPhone = phone.replace(/\D/g, '');

  // Role authorization check: only allowlisted numbers may request President OTP
  if (role === 'president' && !AUTHORIZED_PRESIDENT_NUMBERS.includes(cleanedPhone)) {
    return {
      success: false,
      error: isDemoMode
        ? `Mobile number +91 ${cleanedPhone} is not authorized for MLA administrative access. Use a registered MLA number (9447100001 or 9847012345), or authenticate as Citizen.`
        : 'This mobile number is not registered for MLA administrative access.',
    };
  }

  // Rate-limiting check: enforce 30s cooldown between OTP requests for the same number
  const now = Date.now();
  const rateLimitEntry = rateLimitMap.get(cleanedPhone);
  if (rateLimitEntry) {
    const elapsed = now - rateLimitEntry.lastRequestTime;
    if (elapsed < RATE_LIMIT_COOLDOWN_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_COOLDOWN_MS - elapsed) / 1000);
      return {
        success: false,
        cooldownSeconds: waitSec,
        error: `Please wait ${waitSec} seconds before requesting a new OTP.`,
      };
    }
  }

  // Update rate limit record
  rateLimitMap.set(cleanedPhone, {
    lastRequestTime: now,
    requestCount: (rateLimitEntry?.requestCount || 0) + 1,
  });

  // Generate cryptographic 6-digit OTP code and unique challenge ID
  const code = generateSecureOtp();
  const challengeId = generateSecureToken('ch');

  // Store in ephemeral memory
  activeChallenges.set(challengeId, {
    challengeId,
    phone: cleanedPhone,
    role,
    state,
    district,
    pinCode,
    code,
    expiresAt: now + OTP_TTL_MS,
    failedAttempts: 0,
    profile,
  });

  // Client-Side Demonstration Sandbox Notice
  // (In full production deployment, SMS dispatch and session tokens must be issued strictly via server-side route handlers)
  return {
    success: true,
    challengeId,
    cooldownSeconds: 30,
    ...(isDemoMode && {
      devOtpNotice:
        'DEMO SANDBOX: Live SMS gateway is not connected in this prototype. Use the generated verification code below for demonstration access.',
      devOtpCode: code,
    }),
  };
}

/**
 * Initiates Aadhaar-based OTP authentication without retaining the Aadhaar number.
 * The linked mobile is represented by the existing demo identity for this prototype.
 */
export async function requestAadhaarOtp(
  aadhaar: string,
  role: UserRole,
  state: string,
  district: string,
  pinCode: string
): Promise<OtpRequestResult> {
  const aadhaarValidation = validateAadhaarNumber(aadhaar);
  if (!aadhaarValidation.isValid) {
    return { success: false, error: aadhaarValidation.error };
  }

  const cleanedAadhaar = aadhaar.replace(/\D/g, '');
  const profile = (demoUsers as DemoUserProfile[]).find((user) => user.aadhaar === cleanedAadhaar);
  if (role === 'citizen' && !profile) {
    return {
      success: false,
      error: 'This Aadhaar number is not present in the demonstration citizen directory.',
    };
  }

  const linkedMobile = role === 'president' ? AUTHORIZED_PRESIDENT_NUMBERS[0] : profile!.mobile;
  return requestOtp(linkedMobile, role, state, district, pinCode, profile);
}

/**
 * Verifies the submitted OTP against the active challenge
 */
export async function verifyOtp(challengeId: string, inputCode: string): Promise<OtpVerificationResult> {
  const challenge = activeChallenges.get(challengeId);

  if (!challenge) {
    return {
      success: false,
      error: 'OTP session expired or invalid. Please request a new verification code.',
    };
  }

  const now = Date.now();
  if (now > challenge.expiresAt) {
    activeChallenges.delete(challengeId);
    return {
      success: false,
      error: 'OTP has expired (validity 5 minutes). Please request a new code.',
    };
  }

  if (challenge.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    activeChallenges.delete(challengeId);
    return {
      success: false,
      error: 'Too many incorrect attempts. For security, this verification challenge has been locked.',
    };
  }

  if (challenge.code !== inputCode.trim()) {
    challenge.failedAttempts += 1;
    const remaining = MAX_FAILED_ATTEMPTS - challenge.failedAttempts;
    return {
      success: false,
      error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  // OTP verified successfully! Generate session
  activeChallenges.delete(challengeId);

  // Generate synthetic citizen alias for privacy-preserving reporting (e.g. Citizen 042)
  let aliasNumber = '001';
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    aliasNumber = String(1 + (buffer[0] % 999)).padStart(3, '0');
  } else {
    aliasNumber = String(Math.floor(1 + Math.random() * 999)).padStart(3, '0');
  }
  const citizenAlias = `Citizen ${aliasNumber}`;

  const session: AuthSession = {
    token: generateSecureToken('aicm_token'),
    role: challenge.role,
    phone: challenge.phone,
    maskedPhone: maskPhoneNumber(challenge.phone),
    state: challenge.state,
    district: challenge.district,
    pinCode: challenge.pinCode,
    citizenAlias,
    profileName: challenge.profile?.name,
    profileBlock: challenge.profile?.block,
    profileWardId: challenge.profile?.ward_id,
    aadhaarLast4: challenge.profile?.aadhaar.slice(-4),
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    isPreviewMode: false,
  };

  saveAuthSession(session);

  return {
    success: true,
    session,
  };
}

/**
 * Saves authenticated session to browser storage
 */
export function saveAuthSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session storage', e);
  }
}

/**
 * Retrieves the currently active authenticated session
 */
export function getAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (
      !session ||
      !Number.isFinite(session.expiresAt) ||
      (session.role !== 'president' && session.role !== 'citizen') ||
      Date.now() > session.expiresAt
    ) {
      clearAuthSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Clears the active authentication session (Sign Out)
 */
export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear session storage', e);
  }
}

/**
 * Toggles "View as Citizen" preview mode for Panchayat President
 */
export function setPreviewMode(enabled: boolean): AuthSession | null {
  const current = getAuthSession();
  if (!current || current.role !== 'president') return null;
  const updated: AuthSession = {
    ...current,
    isPreviewMode: enabled,
  };
  saveAuthSession(updated);
  return updated;
}
