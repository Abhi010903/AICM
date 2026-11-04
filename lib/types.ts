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
  | 'phc'
  | 'well'
  | 'community_hall'
  | 'toilet'
  | 'park';

export type AssetCondition = 'good' | 'fair' | 'poor' | 'damaged';
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
  last_inspected?: string;
  tax_status: AssetTaxStatus;
  owner: string;
  source: string;
}

// Community Asset Condition Reporting (Part 12)
export type CommunityReportStatus = 'new_report' | 'under_review' | 'verified_update' | 'rejected_update';

export interface AssetConditionReport {
  id: string;
  asset_id: number;
  asset_name: string;
  reporter_name: string;
  reporter_phone: string;
  reported_condition: AssetCondition;
  description: string;
  photo_name?: string;
  lat: number;
  lng: number;
  submitted_at: string;
  status: CommunityReportStatus;
  reviewer_name?: string;
  reviewer_decision_at?: string;
  reviewer_public_notes?: string;
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

// Citizen Land & Property Records (Part 6)
export type PropertyVerificationStatus =
  | 'citizen_submitted'
  | 'documents_uploaded'
  | 'verification_pending'
  | 'document_supported'
  | 'officially_verified'
  | 'rejected';

export interface PropertyDocument {
  id: string;
  name: string;
  doc_type: 'land_deed' | 'tax_receipt' | 'possession_cert' | 'survey_sketch' | 'other';
  size_kb: number;
  uploaded_at: string;
  file_url?: string;
}

export interface PropertyPhoto {
  id: string;
  name: string;
  caption?: string;
  uploaded_at: string;
  photo_url?: string;
}

export interface CitizenProperty {
  id: string;
  owner_phone: string;
  owner_name: string;
  survey_number: string;
  subdivision_number?: string;
  village_en: string;
  village_ml: string;
  taluk_en: string;
  taluk_ml: string;
  district_en: string;
  district_ml: string;
  ward_id: number;
  area_cents: number;
  property_type: 'residential' | 'agricultural' | 'commercial';
  has_house: boolean;
  address_en: string;
  address_ml?: string;
  classification: LandClassification;
  hazard_zone: HazardZoneType;
  verification_status: PropertyVerificationStatus;
  documents: PropertyDocument[];
  photos: PropertyPhoto[];
  geometry: GeoJSONPolygon;
  created_at: string;
  updated_at: string;
  source: string;
}

export type FacilityType =
  | 'school'
  | 'college'
  | 'phc'
  | 'fhc'
  | 'hospital'
  | 'clinic'
  | 'pharmacy'
  | 'police'
  | 'fire_station'
  | 'gov_office'
  | 'bank'
  | 'anganwadi'
  | 'akshaya'
  | 'krishi'
  | 'vet'
  | 'restaurant'
  | 'public_facility';

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

export type GrievanceCategory =
  | 'road'
  | 'water'
  | 'lighting'
  | 'sanitation'
  | 'pothole'
  | 'drainage'
  | 'waste'
  | 'public_facility'
  | 'waterlogging'
  | 'infrastructure'
  | 'other';

export type GrievanceStatus =
  | 'submitted'
  | 'received'
  | 'under_review'
  | 'in_progress'
  | 'delayed'
  | 'resolved'
  | 'reopened'
  | 'rejected'
  | 'closed'
  | 'open';

export interface GrievanceTimelineEntry {
  status: GrievanceStatus;
  timestamp: string;
  actor: string;
  public_message_en: string;
  public_message_ml: string;
  reason?: string;
}

export type GrievanceSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Grievance {
  id: string;
  ward_id: number;
  category: GrievanceCategory;
  category_other_desc?: string;
  description_en: string;
  description_ml: string;
  lat: number;
  lng: number;
  landmark?: string;
  severity?: GrievanceSeverity;
  status: GrievanceStatus;
  filed_date: string;
  assigned_dept: string;
  reporter_name?: string;
  reporter_phone?: string;
  reporter_block?: string;
  resolution_note?: string;
  rejection_reason?: string;
  delay_reason?: string;
  expected_completion_date?: string;
  timeline?: GrievanceTimelineEntry[];
  updated_at?: string;
  source?: string;
  local_photo_name?: string;
  attachments?: { name: string; size_kb: number; type: string }[];
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
