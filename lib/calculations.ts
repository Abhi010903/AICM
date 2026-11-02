import {
  Ward,
  BudgetShiftParams,
  BudgetSimulationResult,
  WardBudgetSimulation,
  Asset,
  HazardZoneCollection,
} from './types';

/**
 * Geographic distance using Haversine formula (km)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Calculate per capita spend in Rupees
 * spend_lakhs * 100,000 / population
 */
export function calculatePerCapitaSpend(spendLakhs: number, population: number): number {
  if (!population || population <= 0) return 0;
  return Math.round((spendLakhs * 100000) / population);
}

/**
 * Budget Simulation Engine (P17 Sandbox)
 * Exact formula from prompt:
 * new_pdi = old_pdi + 0.3 * (delta_spend / population * 1000)
 * Capped between 0 and 100.
 * Conserves total Panchayat budget.
 */
export function simulateBudgetShift(
  wards: Ward[],
  params: BudgetShiftParams
): BudgetSimulationResult {
  const { from_ward_id, to_ward_id, amount_lakhs } = params;

  let totalOldSpend = 0;
  let totalNewSpend = 0;

  // Compute average metrics for quadrant threshold
  const avgPdi = wards.reduce((sum, w) => sum + w.pdi_score, 0) / wards.length;
  const avgPerCapita =
    wards.reduce((sum, w) => sum + calculatePerCapitaSpend(w.spend_lakhs, w.population), 0) /
    wards.length;

  // Ponytail fix: Cap effective transfer at donor ward's available spend to guarantee exact fiscal conservation
  const donor = wards.find((w) => w.id === from_ward_id);
  const effective_amount =
    from_ward_id !== to_ward_id && donor
      ? Math.min(Math.max(amount_lakhs, 0), donor.spend_lakhs)
      : 0;

  const simulated_wards: WardBudgetSimulation[] = wards.map((ward) => {
    let delta_spend = 0;
    if (effective_amount > 0) {
      if (ward.id === to_ward_id) {
        delta_spend = effective_amount;
      } else if (ward.id === from_ward_id) {
        delta_spend = -effective_amount;
      }
    }

    const old_spend_lakhs = ward.spend_lakhs;
    const new_spend_lakhs = Math.max(0, Math.round((old_spend_lakhs + delta_spend) * 10) / 10);

    const old_per_capita = calculatePerCapitaSpend(old_spend_lakhs, ward.population);
    const new_per_capita = calculatePerCapitaSpend(new_spend_lakhs, ward.population);

    // Formula: new_pdi = old_pdi + 0.3 * (delta_spend / population * 1000)
    const pdi_delta_raw = 0.3 * ((delta_spend / ward.population) * 1000);
    const raw_new_pdi = ward.pdi_score + pdi_delta_raw;
    const new_pdi = Math.round(Math.max(0, Math.min(100, raw_new_pdi)) * 10) / 10;
    const delta_pdi = Math.round((new_pdi - ward.pdi_score) * 10) / 10;

    totalOldSpend += old_spend_lakhs;
    totalNewSpend += new_spend_lakhs;

    // Equity Quadrant:
    // X = PDI, Y = Per Capita Spend
    // bottom-right: low PDI, high spend -> 'under_over' (under-served, over-spent)
    // top-left: high PDI, low spend -> 'well_under' (well-served, under-spent)
    let quadrant: 'under_over' | 'well_under' | 'high_high' | 'low_low';
    if (new_pdi < avgPdi && new_per_capita >= avgPerCapita) {
      quadrant = 'under_over';
    } else if (new_pdi >= avgPdi && new_per_capita < avgPerCapita) {
      quadrant = 'well_under';
    } else if (new_pdi >= avgPdi && new_per_capita >= avgPerCapita) {
      quadrant = 'high_high';
    } else {
      quadrant = 'low_low';
    }

    return {
      ward,
      old_spend_lakhs,
      new_spend_lakhs,
      old_per_capita,
      new_per_capita,
      old_pdi: ward.pdi_score,
      new_pdi,
      delta_pdi,
      quadrant,
    };
  });

  const newDistrictAvgPdi =
    Math.round(
      (simulated_wards.reduce((sum, sw) => sum + sw.new_pdi, 0) / simulated_wards.length) * 10
    ) / 10;

  const is_conserved = Math.abs(totalOldSpend - totalNewSpend) < 0.2;

  return {
    simulated_wards,
    district_avg_pdi: newDistrictAvgPdi,
    total_panchayat_spend: Math.round(totalNewSpend * 10) / 10,
    is_conserved,
  };
}

/**
 * Check if a point is within a bounding polygon
 * Simple ray casting algorithm with defensive bounds check
 */
export function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  if (!point || !polygon || polygon.length < 3) return false;
  const [lng, lat] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Domain service: Identify all public assets located inside mapped KSDMA hazard zones
 */
export function findAssetsInHazardZones(
  assets: Asset[],
  hazardZones: HazardZoneCollection | null
): { asset: Asset; zoneName: string; severity: string }[] {
  if (!assets || !hazardZones || !hazardZones.features) return [];
  const results: { asset: Asset; zoneName: string; severity: string }[] = [];

  for (const asset of assets) {
    for (const hz of hazardZones.features) {
      const polygonCoords = hz.geometry.coordinates[0];
      if (isPointInPolygon([asset.lng, asset.lat], polygonCoords)) {
        results.push({
          asset,
          zoneName: hz.properties.name_en,
          severity: hz.properties.severity,
        });
        break;
      }
    }
  }

  return results;
}
