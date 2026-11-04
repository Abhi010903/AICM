import { CitizenProperty, AssetConditionReport, AssetCondition } from './types';
import { LandParcel } from './types';

const PROPERTIES_STORAGE_KEY = 'aicm-citizen-properties-v1';
const ASSET_REPORTS_STORAGE_KEY = 'aicm-asset-reports-v1';
const PROFILE_EXT_STORAGE_KEY = 'aicm-profile-extensions-v1';

// In-memory fallbacks for non-browser / SSR / test environments
let memoryCustomProperties: CitizenProperty[] = [];
let memoryCustomReports: AssetConditionReport[] = [];
let memoryProfileExtensions: Record<string, CitizenProfileExtension> = {};

// Seed demo properties mapped to demo users
const SEED_PROPERTIES: CitizenProperty[] = [
  // Anita Nair (Ward 7, mobile: 9847654321) - owns survey 412/2 in Cheruvannur
  {
    id: 'PROP-2026-001',
    owner_phone: '9847654321',
    owner_name: 'Anita Nair',
    survey_number: '412/2',
    subdivision_number: '2A',
    village_en: 'Cheruvannur',
    village_ml: 'ചെറുവണ്ണൂർ',
    taluk_en: 'Kozhikode',
    taluk_ml: 'കോഴിക്കോട്',
    district_en: 'Kozhikode',
    district_ml: 'കോഴിക്കോട്',
    ward_id: 7,
    area_cents: 14.5,
    property_type: 'residential',
    has_house: true,
    address_en: 'Nair Tharavadu, Cheruvannur North, Ward 7',
    address_ml: 'നായർ തറവാട്, ചെറുവണ്ണൂർ നോർത്ത്, വാർഡ് 7',
    classification: 'purayidom',
    hazard_zone: 'none',
    verification_status: 'document_supported',
    documents: [
      {
        id: 'DOC-01',
        name: 'Land_Tax_Receipt_2026.pdf',
        doc_type: 'tax_receipt',
        size_kb: 420,
        uploaded_at: '2026-04-12',
      },
      {
        id: 'DOC-02',
        name: 'Possession_Certificate.pdf',
        doc_type: 'possession_cert',
        size_kb: 780,
        uploaded_at: '2026-04-12',
      },
    ],
    photos: [
      {
        id: 'PH-01',
        name: 'front_boundary.jpg',
        caption: 'Front road frontage with motorable access',
        uploaded_at: '2026-05-01',
      },
    ],
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [75.885, 11.305],
          [75.8862, 11.305],
          [75.8862, 11.3061],
          [75.885, 11.3061],
          [75.885, 11.305],
        ],
      ],
    },
    created_at: '2026-04-12T10:00:00Z',
    updated_at: '2026-05-01T14:30:00Z',
    source: 'Ente Bhoomi & ReLIS Cadastral Records',
  },
  // Rajesh Kumar (Ward 3, mobile: 9876543210)
  {
    id: 'PROP-2026-002',
    owner_phone: '9876543210',
    owner_name: 'Rajesh Kumar',
    survey_number: '316/3',
    subdivision_number: '1',
    village_en: 'Peruvayal',
    village_ml: 'പെരുവയൽ',
    taluk_en: 'Kozhikode',
    taluk_ml: 'കോഴിക്കോട്',
    district_en: 'Kozhikode',
    district_ml: 'കോഴിക്കോട്',
    ward_id: 3,
    area_cents: 22.0,
    property_type: 'agricultural',
    has_house: false,
    address_en: 'Kallingal Nilam, Peruvayal, Ward 3',
    address_ml: 'കല്ലിങ്ങൽ നിലം, പെരുവയൽ, വാർഡ് 3',
    classification: 'nilam',
    hazard_zone: 'flood_med',
    verification_status: 'officially_verified',
    documents: [
      {
        id: 'DOC-03',
        name: 'ReLIS_Patta_Document.pdf',
        doc_type: 'land_deed',
        size_kb: 1250,
        uploaded_at: '2026-02-18',
      },
    ],
    photos: [],
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [75.892, 11.298],
          [75.8935, 11.298],
          [75.8935, 11.2995],
          [75.892, 11.2995],
          [75.892, 11.298],
        ],
      ],
    },
    created_at: '2026-02-18T09:00:00Z',
    updated_at: '2026-02-18T09:00:00Z',
    source: 'ReLIS Kerala Revenue e-Services',
  },
];

// Seed Community Asset Reports
const SEED_ASSET_REPORTS: AssetConditionReport[] = [
  {
    id: 'CR-2026-001',
    asset_id: 1,
    asset_name: 'Kizhakkumuri Water Tank #1',
    reporter_name: 'Anita Nair',
    reporter_phone: '9847654321',
    reported_condition: 'damaged',
    description: 'Noticeable crack on southern base wall with minor seepage during high supply hours.',
    photo_name: 'water_tank_crack.jpg',
    lat: 11.311,
    lng: 75.90675,
    submitted_at: '2026-10-25T11:20:00Z',
    status: 'under_review',
    reviewer_public_notes: 'Junior Engineer scheduled for site visit on Monday.',
  },
];

export interface CitizenProfileExtension {
  email?: string;
  address?: string;
  emergency_contact?: string;
}

export function resetCitizenMemoryStore(): void {
  memoryCustomProperties = [];
  memoryCustomReports = [];
  memoryProfileExtensions = {};
}

/**
 * Retrieves all properties owned by the authenticated citizen (strictly isolated by phone number)
 */
export function getCitizenProperties(ownerPhone?: string): CitizenProperty[] {
  if (!ownerPhone) return [];

  let custom: CitizenProperty[] = memoryCustomProperties;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(PROPERTIES_STORAGE_KEY);
      if (raw) custom = JSON.parse(raw);
    } catch (err) {
      console.warn('Failed to load citizen properties from localStorage', err);
    }
  }

  const all = [...custom, ...SEED_PROPERTIES];

  // Deduplicate by ID
  const seen = new Set<string>();
  const isolated: CitizenProperty[] = [];
  for (const p of all) {
    if (p.owner_phone === ownerPhone && !seen.has(p.id)) {
      seen.add(p.id);
      isolated.push(p);
    }
  }
  return isolated;
}

/**
 * Saves a new property for an authenticated citizen
 */
export function addCitizenProperty(prop: CitizenProperty): void {
  memoryCustomProperties = [prop, ...memoryCustomProperties.filter((p) => p.id !== prop.id)];

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(PROPERTIES_STORAGE_KEY);
      const custom: CitizenProperty[] = raw ? JSON.parse(raw) : [];
      const updated = [prop, ...custom.filter((p) => p.id !== prop.id)];
      localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save citizen property', err);
    }
  }
}

/**
 * Updates an existing property owned by the citizen
 */
export function updateCitizenProperty(prop: CitizenProperty): void {
  memoryCustomProperties = [prop, ...memoryCustomProperties.filter((p) => p.id !== prop.id)];

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(PROPERTIES_STORAGE_KEY);
      const custom: CitizenProperty[] = raw ? JSON.parse(raw) : [];
      const updated = [prop, ...custom.filter((p) => p.id !== prop.id)];
      localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update citizen property', err);
    }
  }
}

/**
 * Retrieves community reports for public assets
 */
export function getCommunityAssetReports(assetId?: number): AssetConditionReport[] {
  let custom: AssetConditionReport[] = memoryCustomReports;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(ASSET_REPORTS_STORAGE_KEY);
      if (raw) custom = JSON.parse(raw);
    } catch (err) {
      console.warn('Failed to load community asset reports from localStorage', err);
    }
  }

  const all = [...custom, ...SEED_ASSET_REPORTS];
  const seen = new Set<string>();
  const deduplicated: AssetConditionReport[] = [];
  for (const r of all) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      if (assetId === undefined || r.asset_id === assetId) {
        deduplicated.push(r);
      }
    }
  }
  return deduplicated;
}

/**
 * Submits a new community condition report.
 * NOTE: As required by Part 12.5, this NEVER overwrites the verified asset condition.
 */
export function submitCommunityAssetReport(report: AssetConditionReport): void {
  memoryCustomReports = [report, ...memoryCustomReports.filter((r) => r.id !== report.id)];

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(ASSET_REPORTS_STORAGE_KEY);
      const custom: AssetConditionReport[] = raw ? JSON.parse(raw) : [];
      const updated = [report, ...custom.filter((r) => r.id !== report.id)];
      localStorage.setItem(ASSET_REPORTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save community asset report', err);
    }
  }
}

/**
 * Profile extensions for editable contact preferences
 */
export function getProfileExtension(phone: string): CitizenProfileExtension {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(PROFILE_EXT_STORAGE_KEY);
      if (raw) {
        const map: Record<string, CitizenProfileExtension> = JSON.parse(raw);
        return map[phone] || {};
      }
    } catch {
      // fallback to memory
    }
  }
  return memoryProfileExtensions[phone] || {};
}

export function saveProfileExtension(phone: string, updates: CitizenProfileExtension): void {
  memoryProfileExtensions[phone] = { ...memoryProfileExtensions[phone], ...updates };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(PROFILE_EXT_STORAGE_KEY);
      const map: Record<string, CitizenProfileExtension> = raw ? JSON.parse(raw) : {};
      map[phone] = { ...map[phone], ...updates };
      localStorage.setItem(PROFILE_EXT_STORAGE_KEY, JSON.stringify(map));
    } catch (err) {
      console.error('Failed to save profile extension', err);
    }
  }
}
