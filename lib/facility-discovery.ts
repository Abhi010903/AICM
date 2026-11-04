import { Facility, FacilityType } from './types';
import mlaKnowledgeBase from '../data/mla-knowledge-base.json';
const facilitiesData = mlaKnowledgeBase.facilities as Facility[];
import { calculateDistanceKm } from './calculations';

export interface FacilityDiscoveryResult {
  facilities: Facility[];
  isLiveOsm: boolean;
  isDemo: boolean;
  sourceDescription: string;
  error?: string | null;
}

// Map OSM amenity tags to AICM FacilityType
function mapOsmAmenityToFacilityType(amenity: string): FacilityType {
  switch (amenity) {
    case 'hospital':
      return 'hospital';
    case 'clinic':
    case 'doctors':
      return 'clinic';
    case 'pharmacy':
      return 'pharmacy';
    case 'school':
      return 'school';
    case 'college':
    case 'university':
      return 'college';
    case 'bank':
    case 'atm':
      return 'bank';
    case 'police':
      return 'police';
    case 'fire_station':
      return 'fire_station';
    case 'restaurant':
    case 'cafe':
    case 'fast_food':
      return 'restaurant';
    case 'veterinary':
      return 'vet';
    case 'townhall':
    case 'community_centre':
      return 'public_facility';
    default:
      return 'gov_office';
  }
}

/**
 * Discover facilities based on citizen departure origin.
 * - When within 25 km of Kunnamangalam: uses authoritative Kunnamangalam Panchayat dataset.
 * - When outside (e.g. Hyderabad / Bengaluru / elsewhere): queries live OpenStreetMap Overpass API.
 * - If Overpass is offline or unavailable: handles honestly without fabricating data.
 */
export async function discoverFacilitiesForOrigin(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<FacilityDiscoveryResult> {
  const distKm = calculateDistanceKm(lat, lng, 11.305, 75.885);

  // Case 1: Within Kunnamangalam Constituency area
  if (distKm <= 25) {
    return {
      facilities: facilitiesData as Facility[],
      isLiveOsm: false,
      isDemo: true,
      sourceDescription: 'Kunnamangalam Grama Panchayat Verified Registry (UDISE+ / DHS / LSGD Kerala)',
      error: null,
    };
  }

  // Case 2: Outside Kunnamangalam (e.g., Live GPS in Hyderabad or other cities)
  try {
    const radiusMeters = 8000;
    const overpassQuery = `[out:json][timeout:8];(node["amenity"~"hospital|clinic|pharmacy|school|college|bank|police|fire_station|restaurant"](around:${radiusMeters},${lat},${lng});way["amenity"~"hospital|clinic|pharmacy|school|college|bank|police|fire_station|restaurant"](around:${radiusMeters},${lat},${lng}););out center 40;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Overpass service returned status ${response.status}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    if (elements.length === 0) {
      return {
        facilities: [],
        isLiveOsm: true,
        isDemo: false,
        sourceDescription: 'OpenStreetMap (Live Query — 0 amenities found in radius)',
        error: null,
      };
    }

    const parsedFacilities: Facility[] = elements
      .filter((el: any) => {
        const itemLat = el.lat || el.center?.lat;
        const itemLng = el.lon || el.center?.lon;
        return typeof itemLat === 'number' && typeof itemLng === 'number';
      })
      .slice(0, 40)
      .map((el: any, idx: number) => {
        const itemLat = el.lat || el.center?.lat;
        const itemLng = el.lon || el.center?.lon;
        const tags = el.tags || {};
        const amenity = tags.amenity || 'facility';
        const type = mapOsmAmenityToFacilityType(amenity);
        const nameEn = tags['name:en'] || tags.name || `${amenity.replace('_', ' ').toUpperCase()} (${tags.operator || 'Public'})`;
        const nameMl = tags['name:ml'] || tags.name || nameEn;
        const phone = tags.phone || tags['contact:phone'] || '+91 Helpline Available';

        return {
          id: el.id || idx + 1000,
          type,
          name_en: nameEn,
          name_ml: nameMl,
          lat: itemLat,
          lng: itemLng,
          ward_id: 0, // Outside constituency wards
          staff_filled: 0,
          staff_sanctioned: 0,
          contact_phone: phone,
          source: 'OpenStreetMap (Live OSM Query)',
        };
      });

    return {
      facilities: parsedFacilities,
      isLiveOsm: true,
      isDemo: false,
      sourceDescription: `OpenStreetMap (Live Overpass API — ${parsedFacilities.length} real amenities discovered)`,
      error: null,
    };
  } catch (err: any) {
    if (signal?.aborted) {
      throw err;
    }
    // Honest offline / unreachable fallback
    return {
      facilities: [],
      isLiveOsm: false,
      isDemo: false,
      sourceDescription: 'OpenStreetMap Live Query Unreachable',
      error: `Live OpenStreetMap facility search could not be reached (offline or timeout). The selected origin is ~${Math.round(distKm)} km from Kunnamangalam.`,
    };
  }
}
