export type Language = 'en' | 'ml';
export type UserRole = 'president' | 'citizen';

export interface Panchayat {
  id: string;
  name_en: string;
  name_ml: string;
  district_en: string;
  district_ml: string;
  constituency_en: string;
  constituency_ml: string;
  wards_count: number;
  population: number;
  households: number;
  area_sq_km: number;
  pdi_score: number;
  district_avg_pdi: number;
  total_spend_lakhs: number;
  total_projects: number;
  total_assets: number;
  open_grievances: number;
  delayed_projects: number;
  wards_below_district_avg: number;
  centroid: {
    lat: number;
    lng: number;
  };
  last_verified: string;
  source: string;
}

export interface SDGScores {
  education: number;
  health: number;
  water: number;
  employment: number;
  safety: number;
  environment: number;
  welfare: number;
}

export interface Ward {
  id: number;
  number: number;
  name_en: string;
  name_ml: string;
  population: number;
  households: number;
  pdi_score: number;
  sdg_scores: SDGScores;
  spend_lakhs: number;
  gpdp_projects_count: number;
  assets_count: number;
  open_grievances: number;
  centroid_lat: number;
  centroid_lng: number;
  source: string;
}

export interface PDIThemeScore {
  theme_id: string;
  theme_name_en: string;
  theme_name_ml: string;
  ward_id: number;
  score: number;
  source: string;
}

export type ProjectCategory = 'road' | 'water' | 'health' | 'education' | 'agri' | 'welfare';
export type ProjectStatus = 'planned' | 'ongoing' | 'completed' | 'delayed';

export interface GPDPProject {
  id: number;
  ward_id: number;
  title_en: string;
  title_ml: string;
  category: ProjectCategory;
  budget_lakhs: number;
  spent_lakhs: number;
  status: ProjectStatus;
  start_date: string;
  end_date: string;
  days_overdue: number;
  photo_url?: string;
  source: string;
}

export type AssetType =
  | 'road'
  | 'building'
  | 'water_tank'
  | 'streetlight'
  | 'drainage'
  | 'anganwadi'
  | 'school'
  | 'phc';

export type AssetCondition = 'good' | 'fair' | 'poor';
export type AssetTaxStatus = 'assessed' | 'unassessed' | 'exempt';

export interface Asset {
  id: number;
  ward_id: number;
  type: AssetType;
  name_en: string;
  name_ml: string;
  lat: number;
  lng: number;
  condition: AssetCondition;
  last_maintained: string;
  tax_status: AssetTaxStatus;
  owner: string;
  source: string;
}

export type LandClassification = 'nilam' | 'purayidom' | 'wetland';
export type HazardZoneType = 'flood_high' | 'flood_med' | 'landslide' | 'none';

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface LandParcel {
  survey_number: string;
  village_en: string;
  village_ml: string;
  ward_id: number;
  classification: LandClassification;
  area_cents: number;
  hazard_zone: HazardZoneType;
  road_setback_ok: boolean;
  permitted_activities_en: string[];
  permitted_activities_ml: string[];
  restricted_activities_en: string[];
  restricted_activities_ml: string[];
  geometry: GeoJSONPolygon;
  source: string;
}

export type FacilityType =
  | 'school'
  | 'phc'
  | 'fhc'
  | 'anganwadi'
  | 'akshaya'
  | 'krishi'
  | 'vet';

export interface Facility {
  id: number;
  type: FacilityType;
  name_en: string;
  name_ml: string;
  lat: number;
  lng: number;
  ward_id: number;
  staff_filled: number;
  staff_sanctioned: number;
  contact_phone: string;
  source: string;
}

export type GrievanceCategory = 'road' | 'water' | 'lighting' | 'sanitation' | 'other';
export type GrievanceStatus = 'open' | 'in_progress' | 'resolved';

export interface Grievance {
  id: string;
  ward_id: number;
  category: GrievanceCategory;
  description_en: string;
  description_ml: string;
  lat: number;
  lng: number;
  status: GrievanceStatus;
  filed_date: string;
  assigned_dept: string;
  reporter_name?: string;
  reporter_phone?: string;
  reporter_block?: string;
  resolution_note?: string;
  updated_at?: string;
  source?: string;
  local_photo_name?: string;
}

export interface HazardZoneFeature {
  type: 'Feature';
  properties: {
    id: string;
    hazard_type: 'flood_high' | 'flood_med' | 'landslide';
    severity: string;
    name_en: string;
    name_ml: string;
    color: string;
    source: string;
  };
  geometry: GeoJSONPolygon;
}

export interface HazardZoneCollection {
  type: 'FeatureCollection';
  features: HazardZoneFeature[];
}

export interface EvacuationRouteFeature {
  type: 'Feature';
  properties: {
    id: string;
    name_en: string;
    name_ml: string;
    distance_km: number;
    travel_time_min: number;
    shelter_id: string;
    shelter_name_en: string;
    shelter_name_ml: string;
    shelter_capacity: number;
    shelter_contact: string;
    shelter_lat: number;
    shelter_lng: number;
    source: string;
  };
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
}

export interface EvacuationRouteCollection {
  type: 'FeatureCollection';
  features: EvacuationRouteFeature[];
}

export type SitingVerdict = 'PASS' | 'CONDITIONAL' | 'FAIL';
export type CitizenBuildVerdict = 'PASS' | 'NEEDS APPROVAL' | 'NOT PERMITTED';

export interface SitingReason {
  rule_id: string;
  level: 'FAIL' | 'CONDITIONAL' | 'PASS';
  message_en: string;
  message_ml: string;
}

export interface SitingEvaluation {
  verdict: SitingVerdict;
  citizen_verdict: CitizenBuildVerdict;
  reasons: SitingReason[];
  parcel: LandParcel;
}

export interface BudgetShiftParams {
  from_ward_id: number;
  to_ward_id: number;
  amount_lakhs: number;
}

export interface WardBudgetSimulation {
  ward: Ward;
  old_spend_lakhs: number;
  new_spend_lakhs: number;
  old_per_capita: number;
  new_per_capita: number;
  old_pdi: number;
  new_pdi: number;
  delta_pdi: number;
  quadrant: 'under_over' | 'well_under' | 'high_high' | 'low_low';
}

export interface BudgetSimulationResult {
  simulated_wards: WardBudgetSimulation[];
  district_avg_pdi: number;
  total_panchayat_spend: number;
  is_conserved: boolean;
}
