/**
 * AICM Multi-Factor Disaster Risk Evaluation & Emergency Response Engine
 *
 * Implements a transparent, explainable rule-based decision support system
 * combining meteorological telemetry, river basin water levels, drainage integrity,
 * and KSDMA spatial hazard zones for Flood and Drought early warning.
 *
 * Authoritative Data Sources:
 * - India Meteorological Department (IMD) Automatic Weather Station Network
 * - Central Water Commission (CWC) Chaliyar River Gauging at Feroke / Kunnamangalam
 * - Kerala State Disaster Management Authority (KSDMA) Hazard Atlases
 * - Kerala Irrigation Department Reservoir Storage Bulletins
 */

import { HazardZoneCollection, EvacuationRouteCollection } from './types';

export type DisasterRiskLevel = 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
export type DroughtStatus = 'NORMAL' | 'MILD_DEFICIT' | 'MODERATE_DROUGHT' | 'SEVERE_DROUGHT';

export interface WeatherTelemetryInput {
  rainfall_mm_24h: number; // 24-hour accumulated rainfall (mm)
  rainfall_intensity_mm_hr: number; // Current rainfall rate (mm/hr)
  river_level_meters: number; // Chaliyar River gauge (m) - Warning: 8.5m, Danger: 9.5m
  reservoir_storage_percent: number; // Upstream catchment storage (%)
  imd_alert: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  drainage_blockage_percent: number; // Observed culvert & storm drain blockage (%)
  monsoon_deficit_percent: number; // Seasonal rainfall deficit vs 30-year normal (%)
  groundwater_depletion_meters: number; // Water table drop below seasonal baseline (m)
}

export interface WardExposureEstimate {
  ward_id: number;
  ward_name: string;
  ward_name_ml?: string;
  hazard_type: 'flood' | 'landslide' | 'water_stress';
  exposed_population: number; // Aggregated estimate based on census GIS overlay
  exposed_households: number;
  risk_severity: 'HIGH' | 'MODERATE' | 'LOW';
  recommended_action: string;
  recommended_action_ml?: string;
}

export interface DisasterEvaluationResult {
  risk_level: DisasterRiskLevel;
  score: number; // 0 - 100 composite index
  verdict_title: string;
  explanation: string[];
  explanation_ml?: string[];
  vulnerable_wards: WardExposureEstimate[];
  active_shelters: Array<{ id: string; name: string; name_ml?: string; capacity: number; contact: string }>;
  activated_routes: Array<{ id: string; name: string; name_ml?: string; distance_km: number }>;
  drought_status: DroughtStatus;
  drought_summary: string;
  drought_summary_ml?: string;
  admin_alert?: {
    id: string;
    timestamp: string;
    severity: DisasterRiskLevel;
    headline: string;
    action_checklist: string[];
    broadcast_sms_template_en: string;
    broadcast_sms_template_ml: string;
  };
}

// Baseline default sensor telemetry for Thekkumpuram Grama Panchayat (Monsoon baseline)
export const DEFAULT_TELEMETRY: WeatherTelemetryInput = {
  rainfall_mm_24h: 88, // Heavy monsoon shower
  rainfall_intensity_mm_hr: 18,
  river_level_meters: 8.1, // Near warning level (8.5m)
  reservoir_storage_percent: 78,
  imd_alert: 'ORANGE',
  drainage_blockage_percent: 35,
  monsoon_deficit_percent: 5,
  groundwater_depletion_meters: 0.4,
};

/**
 * Transparent, multi-factor rule-based hazard risk evaluation
 */
export function evaluateDisasterRisk(telemetry: WeatherTelemetryInput): DisasterEvaluationResult {
  const explanation: string[] = [];
  const explanation_ml: string[] = [];
  let score = 0;

  // 1. River Gauge Evaluation (Chaliyar Basin)
  if (telemetry.river_level_meters >= 9.5) {
    score += 40;
    explanation.push(
      `CRITICAL: Chaliyar river level (${telemetry.river_level_meters}m) has breached the statutory DANGER mark (9.5m). Severe lowland inundation underway.`
    );
    explanation_ml.push(
      `ഗുരുതരം: ചാലിയാർ ജലനിരപ്പ് (${telemetry.river_level_meters} മീറ്റർ) അപകടനില (9.5 മീറ്റർ) മറികടന്നു. താഴ്ന്ന പ്രദേശങ്ങളിൽ കനത്ത വെള്ളപ്പൊക്കം.`
    );
  } else if (telemetry.river_level_meters >= 8.5) {
    score += 26;
    explanation.push(
      `WARNING: River level (${telemetry.river_level_meters}m) has crossed the WARNING threshold (8.5m). Backwater ingress threatening riverside wards.`
    );
    explanation_ml.push(
      `മുന്നറിയിപ്പ്: ജലനിരപ്പ് (${telemetry.river_level_meters} മീറ്റർ) ജാഗ്രതാ പരിധി (8.5 മീറ്റർ) പിന്നിട്ടു. നദീതീര വാർഡുകളിൽ വെള്ളം കയറാൻ സാധ്യത.`
    );
  } else if (telemetry.river_level_meters >= 7.0) {
    score += 12;
    explanation.push(
      `WATCH: Elevated river discharge (${telemetry.river_level_meters}m). Approaching seasonal buffer.`
    );
    explanation_ml.push(
      `നിരീക്ഷണം: ഉയർന്ന നദീജല പ്രവാഹം (${telemetry.river_level_meters} മീറ്റർ). സീസണൽ ബഫറിലേക്ക് അടുക്കുന്നു.`
    );
  } else {
    explanation.push(
      `NORMAL: River level (${telemetry.river_level_meters}m) is within safe seasonal conveyance capacity.`
    );
    explanation_ml.push(
      `സാധാരണം: നദിയിലെ ജലനിരപ്പ് (${telemetry.river_level_meters} മീറ്റർ) സുരക്ഷിത പരിധിയിലാണ്.`
    );
  }

  // 2. Rainfall Intensity & 24h Accumulation (IMD AWS Standards)
  if (telemetry.rainfall_mm_24h >= 204.5) {
    score += 35;
    explanation.push(
      `CRITICAL: Extremely heavy rainfall (${telemetry.rainfall_mm_24h}mm/24h) recorded, saturating hill slopes and low-lying drainage channels.`
    );
    explanation_ml.push(
      `ഗുരുതരം: അതിശക്തമായ മഴ (${telemetry.rainfall_mm_24h} മി.മീ/24മണിക്കൂർ) രേഖപ്പെടുത്തി. മലഞ്ചെരിവുകളിലും ഓടകളിലും വെള്ളക്കെട്ട്.`
    );
  } else if (telemetry.rainfall_mm_24h >= 115.6) {
    score += 25;
    explanation.push(
      `WARNING: Very heavy rainfall (${telemetry.rainfall_mm_24h}mm/24h) triggering rapid surface runoff.`
    );
    explanation_ml.push(
      `മുന്നറിയിപ്പ്: ശക്തമായ മഴ (${telemetry.rainfall_mm_24h} മി.മീ/24മണിക്കൂർ). പെട്ടെന്നുള്ള വെള്ളപ്പാച്ചിലിന് സാധ്യത.`
    );
  } else if (telemetry.rainfall_mm_24h >= 64.5) {
    score += 15;
    explanation.push(
      `WATCH: Heavy rainfall event (${telemetry.rainfall_mm_24h}mm/24h) reported by local IMD weather station.`
    );
    explanation_ml.push(
      `നിരീക്ഷണം: കനത്ത മഴ (${telemetry.rainfall_mm_24h} മി.മീ/24മണിക്കൂർ) പ്രാദേശിക കാലാവസ്ഥാ കേന്ദ്രം രേഖപ്പെടുത്തി.`
    );
  } else {
    score += 2;
  }

  // 3. Official Meteorological Alert Factor
  if (telemetry.imd_alert === 'RED') {
    score += 20;
    explanation.push('IMD RED ALERT active for Kozhikode district: Severe convective precipitation anticipated.');
    explanation_ml.push('കോഴിക്കോട് ജില്ലയിൽ ഐ.എം.ഡി റെഡ് അലർട്ട് നിലവിലുണ്ട്: അതിതീവ്ര മഴയ്ക്ക് സാധ്യത.');
  } else if (telemetry.imd_alert === 'ORANGE') {
    score += 12;
    explanation.push('IMD ORANGE ALERT active: Prepare for isolated heavy to very heavy rainfall.');
    explanation_ml.push('ഐ.എം.ഡി ഓറഞ്ച് അലർട്ട് നിലവിലുണ്ട്: ഒറ്റപ്പെട്ട ശക്തമായ മഴയ്ക്ക് സാധ്യത.');
  } else if (telemetry.imd_alert === 'YELLOW') {
    score += 5;
    explanation.push('IMD YELLOW ALERT: Localized waterlogging watch in effect.');
    explanation_ml.push('ഐ.എം.ഡി യെല്ലോ അലർട്ട്: ചിലയിടങ്ങളിൽ വെള്ളക്കെട്ട് സാധ്യത.');
  }

  // 4. Drainage Network Integrity
  if (telemetry.drainage_blockage_percent >= 50) {
    score += 10;
    explanation.push(
      `VULNERABILITY: Severe storm drain blockage (${telemetry.drainage_blockage_percent}%) detected across Ward 7 and Ward 12 channels.`
    );
    explanation_ml.push(
      `ദുർബലത: വാർഡ് 7, വാർഡ് 12 തോടുകളിൽ വലിയ തോതിലുള്ള മാലിന്യ തടസ്സം (${telemetry.drainage_blockage_percent}%).`
    );
  }

  // Final Risk Classification based on transparent score intervals
  let riskLevel: DisasterRiskLevel = 'NORMAL';
  let verdictTitle = 'Normal Seasonal Conditions';

  if (score >= 65 || telemetry.river_level_meters >= 9.5) {
    riskLevel = 'CRITICAL';
    verdictTitle = 'CRITICAL FLOOD & LANDSLIDE EMERGENCY';
  } else if (score >= 42 || telemetry.river_level_meters >= 8.5) {
    riskLevel = 'WARNING';
    verdictTitle = 'FLOOD WARNING: Elevated Inundation Exposure';
  } else if (score >= 20) {
    riskLevel = 'WATCH';
    verdictTitle = 'HAZARD WATCH: Active Monsoon Vigilance';
  }

  // Aggregated Ward Exposure (Privacy-Preserving demographic sums)
  const vulnerableWards: WardExposureEstimate[] = [];

  if (riskLevel === 'CRITICAL' || riskLevel === 'WARNING') {
    vulnerableWards.push(
      {
        ward_id: 7,
        ward_name: 'Cheruvannur (Riverside)',
        ward_name_ml: 'ചെറുവണ്ണൂർ (നദീതീരം)',
        hazard_type: 'flood',
        exposed_population: 1420,
        exposed_households: 340,
        risk_severity: 'HIGH',
        recommended_action: 'Immediate evacuation to Higher Secondary School Camp via Route 1',
        recommended_action_ml: 'റൂട്ട് 1 വഴി ഹയർ സെക്കൻഡറി സ്കൂൾ ക്യാമ്പിലേക്ക് ഉടൻ മാറുക',
      },
      {
        ward_id: 8,
        ward_name: 'Kottakkunnu (Hill Slopes)',
        ward_name_ml: 'കോട്ടക്കുന്ന് (കുന്നിൻ ചരിവ്)',
        hazard_type: 'landslide',
        exposed_population: 480,
        exposed_households: 110,
        risk_severity: riskLevel === 'CRITICAL' ? 'HIGH' : 'MODERATE',
        recommended_action: 'Shift residents from steep terraced slopes to Camp 1',
        recommended_action_ml: 'ചെങ്കുത്തായ ചരിവുകളിൽ നിന്ന് താമസക്കാരെ ക്യാമ്പ് 1-ലേക്ക് മാറ്റുക',
      },
      {
        ward_id: 12,
        ward_name: 'Feroke Border (Lowland)',
        ward_name_ml: 'ഫറോക്ക് അതിർത്തി (താഴ്ന്ന പ്രദേശം)',
        hazard_type: 'flood',
        exposed_population: 860,
        exposed_households: 210,
        risk_severity: 'MODERATE',
        recommended_action: 'Activate Mele Angadi Cyclone Shelter; deploy motor pumps',
        recommended_action_ml: 'മേലെ അങ്ങാടി സൈക്ലോൺ ഷെൽട്ടർ തുറക്കുക; മോട്ടോർ പമ്പുകൾ വിന്യസിക്കുക',
      }
    );
  } else if (riskLevel === 'WATCH') {
    vulnerableWards.push({
      ward_id: 7,
      ward_name: 'Cheruvannur (Riverside)',
      ward_name_ml: 'ചെറുവണ്ണൂർ (നദീതീരം)',
      hazard_type: 'flood',
      exposed_population: 450,
      exposed_households: 105,
      risk_severity: 'MODERATE',
      recommended_action: 'Issue advisory to riverside dwellings; clear drainage bottlenecks',
      recommended_action_ml: 'നദീതീര വീടുകൾക്ക് ജാഗ്രതാ നിർദ്ദേശം നൽകുക; ഓടകളിലെ തടസ്സങ്ങൾ നീക്കുക',
    });
  }

  // Drought Evaluation
  let droughtStatus: DroughtStatus = 'NORMAL';
  let droughtSummary = 'Seasonal precipitation and surface reservoirs satisfy agricultural demand.';
  let droughtSummary_ml = 'കാലവർഷവും ജലാശയങ്ങളും കാർഷികാവശ്യങ്ങൾക്ക് പര്യാപ്തമാണ്.';

  if (telemetry.monsoon_deficit_percent >= 45 || telemetry.groundwater_depletion_meters >= 1.8) {
    droughtStatus = 'SEVERE_DROUGHT';
    droughtSummary = `CRITICAL DEFICIT: Monsoon rainfall is ${telemetry.monsoon_deficit_percent}% below normal. Severe groundwater depletion (${telemetry.groundwater_depletion_meters}m).`;
    droughtSummary_ml = `ഗുരുതര ജലക്ഷാമം: കാലവർഷം സാധാരണയേക്കാൾ ${telemetry.monsoon_deficit_percent}% കുറവ്. കടുത്ത ഭൂഗർഭജല ശോഷണം (${telemetry.groundwater_depletion_meters} മീറ്റർ).`;
  } else if (telemetry.monsoon_deficit_percent >= 25 || telemetry.groundwater_depletion_meters >= 1.0) {
    droughtStatus = 'MODERATE_DROUGHT';
    droughtSummary = `MODERATE DROUGHT: Rainfall deficit of ${telemetry.monsoon_deficit_percent}%. Water supply rationing recommended for agricultural wards.`;
    droughtSummary_ml = `മിതമായ വരൾച്ച: മഴയിൽ ${telemetry.monsoon_deficit_percent}% കുറവ്. കാർഷിക വാർഡുകളിൽ ജലവിതരണം നിയന്ത്രിക്കാൻ ശുപാർശ.`;
  } else if (telemetry.monsoon_deficit_percent >= 15) {
    droughtStatus = 'MILD_DEFICIT';
    droughtSummary = `MILD DEFICIT: Rainfall is ${telemetry.monsoon_deficit_percent}% below normal. Monitor community water storage tanks.`;
    droughtSummary_ml = `നേരിയ കുറവ്: മഴ സാധാരണയേക്കാൾ ${telemetry.monsoon_deficit_percent}% കുറവ്. കമ്മ്യൂണിറ്റി ജലസംഭരണികൾ നിരീക്ഷിക്കുക.`;
  }

  // Active Shelters & Evacuation Routes
  const activeShelters = [
    {
      id: 'shelter_1',
      name: 'Thekkumpuram Govt Higher Secondary School Relief Camp',
      name_ml: 'തെക്കുംപുരം ഗവ. ഹയർ സെക്കൻഡറി സ്കൂൾ ദുരിതാശ്വാസ ക്യാമ്പ്',
      capacity: 450,
      contact: '+91 495 2884101',
    },
    {
      id: 'shelter_2',
      name: 'Mele Angadi Community Hall & Cyclone Shelter',
      name_ml: 'മേലെ അങ്ങാടി കമ്മ്യൂണിറ്റി ഹാൾ & ദുരിതാശ്വാസ ഷെൽട്ടർ',
      capacity: 320,
      contact: '+91 495 2884102',
    },
  ];

  const activatedRoutes = [
    {
      id: 'route_1',
      name: 'Cheruvannur Lowland to Higher Secondary School Shelter',
      name_ml: 'ചെറുവണ്ണൂർ താഴ്ന്ന പ്രദേശം മുതൽ ഹയർ സെക്കൻഡറി സ്കൂൾ വരെയുള്ള പാത',
      distance_km: 2.1,
    },
    {
      id: 'route_3',
      name: 'Kottakkunnu Landslide Slope Evacuation Line',
      name_ml: 'കോട്ടക്കുന്ന് ഉരുൾപൊട്ടൽ സാധ്യതയുള്ള ചരിവിലെ ഒഴിപ്പിക്കൽ പാത',
      distance_km: 1.8,
    },
  ];

  // Administrative Alert Template
  const adminAlert =
    riskLevel === 'CRITICAL' || riskLevel === 'WARNING'
      ? {
          id: `EMERGENCY-${Date.now()}`,
          timestamp: new Date().toISOString(),
          severity: riskLevel,
          headline: `AUTOMATIC DISASTER WARNING: ${verdictTitle}`,
          action_checklist: [
            'Convene Emergency Disaster Management Committee at Panchayat Office.',
            'Deploy Ward 7 & Ward 8 rescue volunteers to coordinate high-ground evacuation.',
            'Open Thekkumpuram HSS Relief Camp with dry rations and medical first-aid.',
            'Contact KSEB to isolate inundated low-tension power cables.',
            'Initiate public broadcast advisory via community loudspeakers & SMS gateway.',
          ],
          broadcast_sms_template_en: `URGENT NOTICE (Thekkumpuram GP): Chaliyar river has reached ${telemetry.river_level_meters}m. Citizens in Ward 7 & Ward 8 are advised to move to designated relief shelters immediately. Control room: 0495-2884101.`,
          broadcast_sms_template_ml: `അടിയന്തര മുന്നറിയിപ്പ് (തെക്കുംപുരം ഗ്രാമപഞ്ചായത്ത്): ചാലിയാർ ജലനിരപ്പ് ${telemetry.river_level_meters} മീറ്ററിലെത്തി. വാർഡ് 7, 8 നിവാസികൾ ദുരിതാശ്വാസ ക്യാമ്പുകളിലേക്ക് മാറുക. കൺട്രോൾ റൂം: 0495-2884101.`,
        }
      : undefined;

  return {
    risk_level: riskLevel,
    score,
    verdict_title: verdictTitle,
    explanation,
    explanation_ml,
    vulnerable_wards: vulnerableWards,
    active_shelters: activeShelters,
    activated_routes: activatedRoutes,
    drought_status: droughtStatus,
    drought_summary: droughtSummary,
    drought_summary_ml: droughtSummary_ml,
    admin_alert: adminAlert,
  };
}
