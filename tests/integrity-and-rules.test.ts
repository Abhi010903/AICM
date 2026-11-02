import { describe, it, expect } from 'vitest';
import { evaluateSitingCompliance } from '../lib/siting-rules';
import {
  simulateBudgetShift,
  calculateDistanceKm,
  calculatePerCapitaSpend,
  isPointInPolygon,
  findAssetsInHazardZones,
} from '../lib/calculations';
import { getParcelBySurveyNumber } from '../lib/api';
import { LandParcel, Ward } from '../lib/types';
import { translations } from '../lib/i18n-dictionary';

import panchayatData from '../data/panchayat.json';
import wardsData from '../data/wards.json';
import gpdpProjectsData from '../data/gpdp_projects.json';
import assetsData from '../data/assets.json';
import landParcelsData from '../data/land_parcels.json';
import facilitiesData from '../data/facilities.json';
import grievancesData from '../data/grievances.json';
import pdiThemesData from '../data/pdi_themes.json';
import hazardZonesData from '../data/hazard_zones.geojson';
import evacuationRoutesData from '../data/evacuation_routes.geojson';

describe('1. Data Integrity Tests', () => {
  it('panchayat.json matches required demo identity', () => {
    expect(panchayatData.id).toBe('thekkumpuram');
    expect(panchayatData.name_en).toBe('Thekkumpuram Grama Panchayat');
    expect(panchayatData.name_ml).toBe('തെക്കുംപുരം ഗ്രാമപഞ്ചായത്ത്');
    expect(panchayatData.district_en).toBe('Kozhikode');
    expect(panchayatData.constituency_en).toBe('Kunnamangalam');
    expect(panchayatData.wards_count).toBe(14);
    expect(panchayatData.population).toBe(28450);
    expect(panchayatData.households).toBe(6820);
    expect(panchayatData.area_sq_km).toBe(32.4);
    expect(panchayatData.last_verified).toBe('2026-10-30');
  });

  it('wards.json has exactly 14 wards and exact demographic sums', () => {
    expect(wardsData.length).toBe(14);

    const totalPop = wardsData.reduce((s, w) => s + w.population, 0);
    expect(totalPop).toBe(28450);

    const totalHh = wardsData.reduce((s, w) => s + w.households, 0);
    expect(totalHh).toBe(6820);

    // Verify Ward 7 is Cheruvannur
    const w7 = wardsData.find((w) => w.id === 7);
    expect(w7).toBeDefined();
    expect(w7?.name_en).toBe('Cheruvannur');
    expect(w7?.name_ml).toBe('ചെറുവണ്ണൂർ');
  });

  it('land_parcels.json has 20 parcels and includes scripted 412/2 in Ward 7', () => {
    expect(landParcelsData.length).toBe(20);

    const p412 = landParcelsData.find((p) => p.survey_number === '412/2');
    expect(p412).toBeDefined();
    expect(p412?.ward_id).toBe(7);
    expect(p412?.classification).toBe('nilam');
    expect(p412?.hazard_zone).toBe('flood_high');
    expect(p412?.road_setback_ok).toBe(false);
    expect(p412?.geometry.type).toBe('Polygon');
    expect(p412?.geometry.coordinates[0].length).toBeGreaterThanOrEqual(4);
  });

  it('pdi_themes.json contains exactly 9 themes x 14 wards = 126 records', () => {
    expect(pdiThemesData.length).toBe(126);
    // Each ward has 9 themes
    for (let wid = 1; wid <= 14; wid++) {
      const wThemes = pdiThemesData.filter((t) => t.ward_id === wid);
      expect(wThemes.length).toBe(9);
    }
  });

  it('all foreign keys in projects, assets, facilities, and grievances resolve to valid wards', () => {
    const validWardIds = new Set(wardsData.map((w) => w.id));

    gpdpProjectsData.forEach((p) => {
      expect(validWardIds.has(p.ward_id)).toBe(true);
    });

    assetsData.forEach((a) => {
      expect(validWardIds.has(a.ward_id)).toBe(true);
    });

    facilitiesData.forEach((f) => {
      expect(validWardIds.has(f.ward_id)).toBe(true);
    });

    grievancesData.forEach((g) => {
      expect(validWardIds.has(g.ward_id)).toBe(true);
    });
  });

  it('hazard_zones and evacuation_routes have valid GeoJSON features', () => {
    expect(hazardZonesData.type).toBe('FeatureCollection');
    expect(hazardZonesData.features.length).toBeGreaterThanOrEqual(3);

    expect(evacuationRoutesData.type).toBe('FeatureCollection');
    expect(evacuationRoutesData.features.length).toBe(3);
    expect(evacuationRoutesData.features[0].properties.shelter_name_en).toBeDefined();
  });

  it('panchayat.json aggregates reconcile exactly with underlying datasets', () => {
    const wardSpendTotal = wardsData.reduce((s, w) => s + w.spend_lakhs, 0);
    expect(panchayatData.total_spend_lakhs).toBe(wardSpendTotal);

    expect(panchayatData.total_projects).toBe(gpdpProjectsData.length);

    const delayedCount = gpdpProjectsData.filter((p) => p.status === 'delayed').length;
    expect(panchayatData.delayed_projects).toBe(delayedCount);
  });

  it('facilities.json name_en contains only English text and name_ml contains Malayalam', () => {
    const malayalamRegex = /[\u0D00-\u0D7F]/;
    facilitiesData.forEach((f) => {
      expect(malayalamRegex.test(f.name_en)).toBe(false);
      expect(malayalamRegex.test(f.name_ml)).toBe(true);
    });
  });

  it('i18n-dictionary has exact 1:1 key parity between en and ml', () => {
    const enKeys = Object.keys(translations.en);
    const mlKeys = Object.keys(translations.ml);
    expect(enKeys.sort()).toEqual(mlKeys.sort());
  });
});

describe('2. Siting Compliance Engine Tests', () => {
  it('parcel 412/2 returns FAIL and citizen NOT PERMITTED', () => {
    const p412 = landParcelsData.find((p) => p.survey_number === '412/2') as LandParcel;
    const result = evaluateSitingCompliance(p412, 'residential');

    expect(result.verdict).toBe('FAIL');
    expect(result.citizen_verdict).toBe('NOT PERMITTED');

    const ruleIds = result.reasons.map((r) => r.rule_id);
    expect(ruleIds).toContain('RULE_NILAM_RESTRICTION');
    expect(ruleIds).toContain('RULE_ROAD_SETBACK_BREACH');
    expect(ruleIds).toContain('RULE_HIGH_FLOOD_OVERLAY');
  });

  it('dry land (purayidom) with compliant setback and no hazard returns PASS', () => {
    const compliantParcel: LandParcel = {
      survey_number: '999/1',
      village_en: 'Test Village',
      village_ml: 'ടെസ്റ്റ്',
      ward_id: 1,
      classification: 'purayidom',
      area_cents: 20,
      hazard_zone: 'none',
      road_setback_ok: true,
      permitted_activities_en: [],
      permitted_activities_ml: [],
      restricted_activities_en: [],
      restricted_activities_ml: [],
      geometry: { type: 'Polygon', coordinates: [] },
      source: 'Test',
    };

    const result = evaluateSitingCompliance(compliantParcel, 'residential');
    expect(result.verdict).toBe('PASS');
    expect(result.citizen_verdict).toBe('PASS');
    expect(result.reasons[0].rule_id).toBe('RULE_PURAYIDOM_CLEAR');
  });

  it('dry land with high flood hazard returns CONDITIONAL and citizen NEEDS APPROVAL', () => {
    const conditionalParcel: LandParcel = {
      survey_number: '999/2',
      village_en: 'Test Village',
      village_ml: 'ടെസ്റ്റ്',
      ward_id: 1,
      classification: 'purayidom',
      area_cents: 20,
      hazard_zone: 'flood_high',
      road_setback_ok: true,
      permitted_activities_en: [],
      permitted_activities_ml: [],
      restricted_activities_en: [],
      restricted_activities_ml: [],
      geometry: { type: 'Polygon', coordinates: [] },
      source: 'Test',
    };

    const result = evaluateSitingCompliance(conditionalParcel, 'residential');
    expect(result.verdict).toBe('CONDITIONAL');
    expect(result.citizen_verdict).toBe('NEEDS APPROVAL');
    expect(result.reasons.some((r) => r.rule_id === 'RULE_HIGH_FLOOD_OVERLAY')).toBe(true);
  });
});

describe('3. Budget Simulation & Geo Calculations Tests', () => {
  it('simulateBudgetShift conserves total panchayat budget', () => {
    const wards = wardsData as unknown as Ward[];
    const result = simulateBudgetShift(wards, {
      from_ward_id: 7,
      to_ward_id: 2,
      amount_lakhs: 50,
    });

    expect(result.is_conserved).toBe(true);

    const fromSim = result.simulated_wards.find((sw) => sw.ward.id === 7);
    const toSim = result.simulated_wards.find((sw) => sw.ward.id === 2);

    expect(fromSim).toBeDefined();
    expect(toSim).toBeDefined();

    // From Ward 7 (spend reduced by 50L)
    expect(fromSim?.new_spend_lakhs).toBe(Math.round((fromSim!.old_spend_lakhs - 50) * 10) / 10);
    // To Ward 2 (spend increased by 50L)
    expect(toSim?.new_spend_lakhs).toBe(Math.round((toSim!.old_spend_lakhs + 50) * 10) / 10);

    // Ward 2 PDI increases
    expect(toSim!.new_pdi).toBeGreaterThan(toSim!.old_pdi);
  });

  it('calculateDistanceKm returns accurate geographic distances', () => {
    // Distance between Ward 7 (11.305, 75.885) and Shelter 1 (11.312, 75.892) ~ 1.1 km
    const dist = calculateDistanceKm(11.305, 75.885, 11.312, 75.892);
    expect(dist).toBeGreaterThan(0.5);
    expect(dist).toBeLessThan(3.0);
  });

  it('calculatePerCapitaSpend returns correct integer value', () => {
    // 82.5 Lakhs for 2180 population = (82.5 * 100,000) / 2180 = 3784.4 -> 3784
    const pc = calculatePerCapitaSpend(82.5, 2180);
    expect(pc).toBe(3784);
  });

  it('simulateBudgetShift ignores transfer when donor equals recipient', () => {
    const wards = wardsData as unknown as Ward[];
    const result = simulateBudgetShift(wards, {
      from_ward_id: 7,
      to_ward_id: 7,
      amount_lakhs: 50,
    });
    expect(result.is_conserved).toBe(true);
    const w7 = result.simulated_wards.find((sw) => sw.ward.id === 7);
    expect(w7?.delta_pdi).toBe(0);
    expect(w7?.new_spend_lakhs).toBe(w7?.old_spend_lakhs);
  });

  it('simulateBudgetShift conserves budget when amount exceeds donor ward spend (Ward 14)', () => {
    const wards = wardsData as unknown as Ward[];
    const w14 = wards.find((w) => w.id === 14)!;
    // Ward 14 has 39.0 Lakhs; attempt to transfer 50 Lakhs
    const result = simulateBudgetShift(wards, {
      from_ward_id: 14,
      to_ward_id: 2,
      amount_lakhs: 50,
    });

    expect(result.is_conserved).toBe(true);
    const fromSim = result.simulated_wards.find((sw) => sw.ward.id === 14)!;
    const toSim = result.simulated_wards.find((sw) => sw.ward.id === 2)!;

    // Clamped at donor available spend (39.0 Lakhs)
    expect(fromSim.new_spend_lakhs).toBe(0);
    expect(toSim.new_spend_lakhs).toBe(
      Math.round((toSim.old_spend_lakhs + w14.spend_lakhs) * 10) / 10
    );
  });

  it('isPointInPolygon safely handles malformed or empty polygon arrays', () => {
    expect(isPointInPolygon([75.88, 11.30], [])).toBe(false);
    expect(isPointInPolygon([75.88, 11.30], null as any)).toBe(false);
  });

  it('findAssetsInHazardZones correctly identifies assets in hazard zones', () => {
    const atRisk = findAssetsInHazardZones(assetsData as any, hazardZonesData as any);
    expect(Array.isArray(atRisk)).toBe(true);
    expect(atRisk.length).toBeGreaterThan(0);
    expect(atRisk[0].asset).toBeDefined();
    expect(atRisk[0].zoneName).toBeDefined();
  });

  it('getParcelBySurveyNumber defensively handles empty or whitespace input', async () => {
    expect(await getParcelBySurveyNumber('')).toBeNull();
    expect(await getParcelBySurveyNumber('   ')).toBeNull();
    expect(await getParcelBySurveyNumber(null as any)).toBeNull();
    const p412 = await getParcelBySurveyNumber('  412/2  ');
    expect(p412).not.toBeNull();
    expect(p412?.survey_number).toBe('412/2');
  });
});
