import {
  Panchayat,
  Ward,
  GPDPProject,
  Asset,
  LandParcel,
  Facility,
  Grievance,
  HazardZoneCollection,
  EvacuationRouteCollection,
  PDIThemeScore,
} from './types';

import panchayatData from '../data/panchayat.json';
import wardsData from '../data/wards.json';
import gpdpProjectsData from '../data/gpdp_projects.json';
import assetsData from '../data/assets.json';
import landParcelsData from '../data/land_parcels.json';
import facilitiesData from '../data/facilities.json';
import hazardZonesData from '../data/hazard_zones.geojson';
import evacuationRoutesData from '../data/evacuation_routes.geojson';
import pdiThemesData from '../data/pdi_themes.json';
import { getAllGrievances } from './demo-store';

/**
 * Artificial delay helper (200-300ms) to simulate real-world service behavior
 */
const delay = (ms: number = 220) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getPanchayat(): Promise<Panchayat> {
  await delay(150);
  return panchayatData as Panchayat;
}

export async function getWards(): Promise<Ward[]> {
  await delay(200);
  return wardsData as Ward[];
}

export async function getWardById(id: number): Promise<Ward | null> {
  await delay(150);
  const found = (wardsData as Ward[]).find((w) => w.id === id);
  return found || null;
}

export async function getProjects(wardId?: number): Promise<GPDPProject[]> {
  await delay(220);
  const projects = gpdpProjectsData as GPDPProject[];
  if (wardId) {
    return projects.filter((p) => p.ward_id === wardId);
  }
  return projects;
}

export async function getAssets(filters?: {
  wardId?: number;
  condition?: string;
  type?: string;
}): Promise<Asset[]> {
  await delay(240);
  let assets = assetsData as Asset[];
  if (filters?.wardId) {
    assets = assets.filter((a) => a.ward_id === filters.wardId);
  }
  if (filters?.condition && filters.condition !== 'all') {
    assets = assets.filter((a) => a.condition === filters.condition);
  }
  if (filters?.type && filters.type !== 'all') {
    assets = assets.filter((a) => a.type === filters.type);
  }
  return assets;
}

export async function getParcels(): Promise<LandParcel[]> {
  await delay(200);
  return landParcelsData as LandParcel[];
}

export async function getParcelBySurveyNumber(
  surveyNumber: string
): Promise<LandParcel | null> {
  await delay(250);
  if (!surveyNumber || typeof surveyNumber !== 'string') return null;
  const normalized = surveyNumber.trim().toLowerCase();
  const found = (landParcelsData as LandParcel[]).find(
    (p) => p.survey_number.toLowerCase() === normalized
  );
  return found || null;
}

export async function getFacilities(filters?: {
  wardId?: number;
  type?: string;
}): Promise<Facility[]> {
  await delay(200);
  let facs = facilitiesData as Facility[];
  if (filters?.wardId) {
    facs = facs.filter((f) => f.ward_id === filters.wardId);
  }
  if (filters?.type && filters.type !== 'all') {
    facs = facs.filter((f) => f.type === filters.type);
  }
  return facs;
}

export async function getGrievances(wardId?: number, reporterPhone?: string): Promise<Grievance[]> {
  await delay(200);
  let list: Grievance[];
  if (typeof window === 'undefined') {
    list = getAllGrievances();
  } else {
    const params = new URLSearchParams({ refresh: Date.now().toString() });
    if (reporterPhone) params.set('reporter_phone', reporterPhone);
    const response = await fetch(`/api/grievances?${params.toString()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Unable to load live grievances.');
    list = (await response.json()) as Grievance[];
  }
  if (wardId) {
    return list.filter((g) => g.ward_id === wardId);
  }
  return list;
}

export async function getHazardZones(): Promise<HazardZoneCollection> {
  await delay(200);
  return (hazardZonesData as unknown) as HazardZoneCollection;
}

export async function getEvacuationRoutes(): Promise<EvacuationRouteCollection> {
  await delay(200);
  return (evacuationRoutesData as unknown) as EvacuationRouteCollection;
}

export async function getPdiThemes(wardId?: number): Promise<PDIThemeScore[]> {
  await delay(200);
  const themes = pdiThemesData as PDIThemeScore[];
  if (wardId) {
    return themes.filter((t) => t.ward_id === wardId);
  }
  return themes;
}
