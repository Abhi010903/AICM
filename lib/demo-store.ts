import { Grievance } from './types';
import mlaKnowledgeBase from '../data/mla-knowledge-base.json';

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
  const canonical = mlaKnowledgeBase.grievances as Grievance[];
  const canonicalIds = new Set(canonical.map((grievance) => grievance.id));
  const custom = current.custom_grievances.filter((grievance) => !canonicalIds.has(grievance.id));
  return [...custom, ...canonical];
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

export async function resetDemoState(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(BANNER_KEY);
    // User language preference (LANG_KEY) is preserved so resetting demo does not
    // disrupt the user's selected language.

    // Purge runtime caches scoped to aicm- to ensure fresh application state loads on navigation
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('aicm-') && key.includes('runtime'))
          .map((key) => caches.delete(key))
      );
    }
  } catch (e) {
    console.error('Failed to reset demo state', e);
  } finally {
    if (window.location.pathname === '/') {
      window.location.reload();
    } else {
      window.location.replace('/');
    }
  }
}
