import { Grievance } from './types';
import grievancesSeed from '../data/grievances.json';

const STORAGE_KEY = 'aicm-demo-state-v1';
const LANG_KEY = 'aicm-language';
const ROLE_KEY = 'aicm-role';
const BANNER_KEY = 'aicm-banner-dismissed';

export interface PersistedDemoState {
  version: 1;
  custom_grievances: Grievance[];
  banner_dismissed: boolean;
}

const DEFAULT_STATE: PersistedDemoState = {
  version: 1,
  custom_grievances: [],
  banner_dismissed: false,
};

export function getPersistedState(): PersistedDemoState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1) {
      return {
        version: 1,
        custom_grievances: Array.isArray(parsed.custom_grievances)
          ? parsed.custom_grievances
          : [],
        banner_dismissed: Boolean(parsed.banner_dismissed),
      };
    }
    return DEFAULT_STATE;
  } catch (e) {
    console.warn('Failed to read localStorage demo state, falling back to default', e);
    return DEFAULT_STATE;
  }
}

export function savePersistedState(state: PersistedDemoState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save demo state to localStorage', e);
  }
}

export function addDemoGrievance(grievance: Grievance): void {
  const current = getPersistedState();
  current.custom_grievances.unshift(grievance);
  savePersistedState(current);
}

export function getAllGrievances(): Grievance[] {
  const current = getPersistedState();
  const seed = (grievancesSeed as unknown) as Grievance[];
  // Merge custom grievances in front of seed grievances
  return [...current.custom_grievances, ...seed];
}

export function getLanguagePreference(): 'en' | 'ml' {
  if (typeof window === 'undefined') return 'en';
  try {
    const lang = localStorage.getItem(LANG_KEY);
    return lang === 'ml' ? 'ml' : 'en';
  } catch {
    return 'en';
  }
}

export function setLanguagePreference(lang: 'en' | 'ml'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {}
}

export function getRolePreference(): 'president' | 'citizen' {
  if (typeof window === 'undefined') return 'president';
  try {
    const role = localStorage.getItem(ROLE_KEY);
    return role === 'citizen' ? 'citizen' : 'president';
  } catch {
    return 'president';
  }
}

export function setRolePreference(role: 'president' | 'citizen'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch {}
}

export function isBannerDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(BANNER_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setBannerDismissed(dismissed: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(BANNER_KEY, dismissed ? 'true' : 'false');
  } catch {}
}

export function resetDemoState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LANG_KEY);
    localStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(BANNER_KEY);
    window.location.href = '/';
  } catch (e) {
    console.error('Failed to reset demo state', e);
  }
}
