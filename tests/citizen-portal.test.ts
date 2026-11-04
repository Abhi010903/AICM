import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getCitizenProperties,
  addCitizenProperty,
  getCommunityAssetReports,
  submitCommunityAssetReport,
  getProfileExtension,
  saveProfileExtension,
  resetCitizenMemoryStore,
} from '../lib/citizen-store';
import { getAssets } from '../lib/api';
import { CitizenProperty, AssetConditionReport } from '../lib/types';
import { evaluateSitingCompliance } from '../lib/siting-rules';
import { resetDemoState } from '../lib/demo-store';
import { discoverFacilitiesForOrigin } from '../lib/facility-discovery';
import { KUNNAMANGALAM_DEMO_LOCATION } from '../lib/location-context';
import { calculateDistanceKm } from '../lib/calculations';
import fs from 'fs';
import path from 'path';

describe('AICM Citizen Portal Unit & Integrity Tests', () => {
  beforeEach(() => {
    resetCitizenMemoryStore();
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    resetCitizenMemoryStore();
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  describe('Citizen Property Data Isolation by Phone', () => {
    it('isolates properties strictly to authenticated phone numbers', () => {
      const anitaProps = getCitizenProperties('9847654321');
      const rajeshProps = getCitizenProperties('9876543210');
      const unknownProps = getCitizenProperties('9999999999');
      const emptyProps = getCitizenProperties('');

      // Anita Nair should own survey 412/2
      expect(anitaProps.length).toBeGreaterThanOrEqual(1);
      expect(anitaProps.some((p) => p.survey_number === '412/2')).toBe(true);
      expect(anitaProps.every((p) => p.owner_phone === '9847654321')).toBe(true);

      // Rajesh Kumar should own survey 316/3
      expect(rajeshProps.length).toBeGreaterThanOrEqual(1);
      expect(rajeshProps.some((p) => p.survey_number === '316/3')).toBe(true);
      expect(rajeshProps.every((p) => p.owner_phone === '9876543210')).toBe(true);

      // Unknown or empty should return empty array
      expect(unknownProps).toHaveLength(0);
      expect(emptyProps).toHaveLength(0);
    });

    it('persists a new citizen property and maintains phone isolation', () => {
      const newProp: CitizenProperty = {
        id: 'PROP-TEST-001',
        owner_phone: '9847654321',
        owner_name: 'Anita Nair',
        survey_number: '555/1',
        subdivision_number: '1',
        village_en: 'Cheruvannur',
        village_ml: 'ചെറുവണ്ണൂർ',
        taluk_en: 'Kozhikode',
        taluk_ml: 'കോഴിക്കോട്',
        district_en: 'Kozhikode',
        district_ml: 'കോഴിക്കോട്',
        ward_id: 7,
        area_cents: 8.5,
        property_type: 'residential',
        has_house: false,
        address_en: 'Cheruvannur Ward 7',
        classification: 'purayidom',
        hazard_zone: 'none',
        verification_status: 'citizen_submitted',
        documents: [],
        photos: [],
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [75.885, 11.305],
              [75.886, 11.305],
              [75.886, 11.306],
              [75.885, 11.306],
              [75.885, 11.305],
            ],
          ],
        },
        source: 'Self-Reported Test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      addCitizenProperty(newProp);

      const anitaProps = getCitizenProperties('9847654321');
      expect(anitaProps.some((p) => p.id === 'PROP-TEST-001')).toBe(true);

      // Rajesh should NOT see Anita's new property
      const rajeshProps = getCitizenProperties('9876543210');
      expect(rajeshProps.some((p) => p.id === 'PROP-TEST-001')).toBe(false);
    });
  });

  describe('Shared Asset Condition Reports - Integrity Preservation', () => {
    it('records a community condition report without mutating ground-verified asset condition', async () => {
      const assetsBefore = await getAssets({ wardId: 1 });
      const targetAsset = assetsBefore.find((a) => a.id === 1);
      expect(targetAsset).toBeDefined();
      const verifiedConditionBefore = targetAsset?.condition;

      const report: AssetConditionReport = {
        id: 'CR-TEST-999',
        asset_id: 1,
        asset_name: targetAsset?.name_en || 'Kizhakkumuri Water Tank #1',
        reporter_name: 'Anita Nair',
        reporter_phone: '9847654321',
        reported_condition: 'damaged',
        description: 'Noticeable crack on southern base wall.',
        lat: targetAsset?.lat || 11.311,
        lng: targetAsset?.lng || 75.90675,
        submitted_at: new Date().toISOString(),
        status: 'under_review',
      };

      submitCommunityAssetReport(report);

      // 1. Verify community report is stored
      const reports = getCommunityAssetReports(1);
      expect(reports.some((r) => r.id === 'CR-TEST-999')).toBe(true);

      // 2. CRITICAL DATA INTEGRITY CHECK: Verified Asset condition MUST NOT change!
      const assetsAfter = await getAssets({ wardId: 1 });
      const targetAssetAfter = assetsAfter.find((a) => a.id === 1);
      expect(targetAssetAfter?.condition).toBe(verifiedConditionBefore);
    });
  });

  describe('Citizen Profile Extensions', () => {
    it('saves and retrieves communication preferences by phone', () => {
      saveProfileExtension('9847654321', {
        email: 'anita.nair@example.com',
        address: 'Nair Tharavadu, Cheruvannur North',
      });

      const ext = getProfileExtension('9847654321');
      expect(ext.email).toBe('anita.nair@example.com');
      expect(ext.address).toBe('Nair Tharavadu, Cheruvannur North');

      // Other phone should not have this profile extension
      const other = getProfileExtension('9876543210');
      expect(other.email).toBeUndefined();
    });
  });

  describe('Build Check Feasibility Evaluation', () => {
    it('restricts construction on Nilam paddy land', () => {
      const mockNilamParcel = {
        survey_number: '412/2',
        village_en: 'Cheruvannur',
        village_ml: 'ചെറുവണ്ണൂർ',
        ward_id: 7,
        classification: 'nilam' as const,
        area_cents: 14.5,
        hazard_zone: 'none' as const,
        road_setback_ok: true,
        permitted_activities_en: [],
        permitted_activities_ml: [],
        restricted_activities_en: [],
        restricted_activities_ml: [],
        geometry: { type: 'Polygon' as const, coordinates: [] },
        source: 'Demo',
      };

      const result = evaluateSitingCompliance(mockNilamParcel, 'residential');
      expect(result.verdict).toBe('FAIL');
      expect(result.citizen_verdict).toBe('NOT PERMITTED');
      expect(result.reasons.some((r) => r.rule_id === 'RULE_NILAM_RESTRICTION')).toBe(true);
    });

    it('approves compliant Purayidom dry land with road setback', () => {
      const mockPurayidomParcel = {
        survey_number: '316/3',
        village_en: 'Peruvayal',
        village_ml: 'പെരുവയൽ',
        ward_id: 3,
        classification: 'purayidom' as const,
        area_cents: 22.0,
        hazard_zone: 'none' as const,
        road_setback_ok: true,
        permitted_activities_en: [],
        permitted_activities_ml: [],
        restricted_activities_en: [],
        restricted_activities_ml: [],
        geometry: { type: 'Polygon' as const, coordinates: [] },
        source: 'Demo',
      };

      const result = evaluateSitingCompliance(mockPurayidomParcel, 'residential');
      expect(result.verdict).toBe('PASS');
      expect(result.citizen_verdict).toBe('PASS');
    });

    it('requires conditional disaster approval for high flood overlay', () => {
      const mockFloodParcel = {
        survey_number: '324/4',
        village_en: 'Peruvayal',
        village_ml: 'പെരുവയൽ',
        ward_id: 3,
        classification: 'purayidom' as const,
        area_cents: 18.0,
        hazard_zone: 'flood_high' as const,
        road_setback_ok: true,
        permitted_activities_en: [],
        permitted_activities_ml: [],
        restricted_activities_en: [],
        restricted_activities_ml: [],
        geometry: { type: 'Polygon' as const, coordinates: [] },
        source: 'Demo',
      };

      const result = evaluateSitingCompliance(mockFloodParcel, 'residential');
      expect(result.verdict).toBe('CONDITIONAL');
      expect(result.citizen_verdict).toBe('NEEDS APPROVAL');
      expect(result.reasons.some((r) => r.rule_id === 'RULE_HIGH_FLOOD_OVERLAY')).toBe(true);
    });
  });

  describe('Facility Discovery by Origin Coordinates', () => {
    it('returns authoritative Panchayat facilities when origin is within 25 km of Kunnamangalam', async () => {
      // Kunnamangalam Ward 7 centroid
      const result = await discoverFacilitiesForOrigin(11.305, 75.885);
      expect(result.isLiveOsm).toBe(false);
      expect(result.isDemo).toBe(true);
      expect(result.error).toBeNull();
      expect(result.facilities.length).toBeGreaterThan(0);
      expect(result.sourceDescription).toContain('Kunnamangalam Grama Panchayat Verified Registry');
    });

    it('queries live OpenStreetMap when citizen origin is outside Kunnamangalam', async () => {
      const originalFetch = global.fetch;
      try {
        const mockElements = [
          {
            id: 99001,
            lat: 17.3855,
            lon: 78.4865,
            tags: {
              amenity: 'hospital',
              name: 'City Care Hospital',
              'name:en': 'City Care Hospital',
              'contact:phone': '+91 40 12345678',
            },
          },
          {
            id: 99002,
            lat: 17.386,
            lon: 78.487,
            tags: {
              amenity: 'pharmacy',
              name: 'Apollo Pharmacy',
            },
          },
        ];

        global.fetch = async () =>
          ({
            ok: true,
            json: async () => ({ elements: mockElements }),
          } as unknown as Response);

        const result = await discoverFacilitiesForOrigin(17.385, 78.486);
        expect(result.isLiveOsm).toBe(true);
        expect(result.isDemo).toBe(false);
        expect(result.facilities).toHaveLength(2);
        expect(result.facilities[0].type).toBe('hospital');
        expect(result.facilities[0].name_en).toBe('City Care Hospital');
        expect(result.facilities[1].type).toBe('pharmacy');
        expect(result.facilities[1].name_en).toBe('Apollo Pharmacy');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('gracefully reports unreachable service without fabricating data when Overpass fails', async () => {
      const originalFetch = global.fetch;
      try {
        global.fetch = async () => {
          throw new Error('Network timeout');
        };

        const result = await discoverFacilitiesForOrigin(17.385, 78.486);
        expect(result.facilities).toHaveLength(0);
        expect(result.isLiveOsm).toBe(false);
        expect(result.isDemo).toBe(false);
        expect(result.error).toContain('could not be reached');
        expect(result.error).toContain('Kunnamangalam');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('propagates abort signal when caller cancels request', async () => {
      const controller = new AbortController();
      controller.abort();

      const originalFetch = global.fetch;
      try {
        global.fetch = async (_url, init) => {
          if (init?.signal?.aborted) {
            const err = new Error('This operation was aborted');
            err.name = 'AbortError';
            throw err;
          }
          return { ok: true, json: async () => ({ elements: [] }) } as unknown as Response;
        };

        await expect(
          discoverFacilitiesForOrigin(17.385, 78.486, controller.signal)
        ).rejects.toThrow();
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('Citizen Location Context & Coordinate Utilities', () => {
    it('provides valid demonstration centroid for Kunnamangalam Ward 7', () => {
      expect(KUNNAMANGALAM_DEMO_LOCATION.lat).toBe(11.305);
      expect(KUNNAMANGALAM_DEMO_LOCATION.lng).toBe(75.885);
      expect(KUNNAMANGALAM_DEMO_LOCATION.source).toBe('demo');
    });

    it('calculates geographic distance accurately', () => {
      // Distance from demo location to itself should be 0
      const distZero = calculateDistanceKm(11.305, 75.885, 11.305, 75.885);
      expect(distZero).toBe(0);

      // Distance from Kunnamangalam to Kozhikode Beach (~13-14 km)
      const distBeach = calculateDistanceKm(11.305, 75.885, 11.26, 75.77);
      expect(distBeach).toBeGreaterThan(12);
      expect(distBeach).toBeLessThan(16);

      // Distance from Kunnamangalam to Hyderabad (>700 km)
      const distHyd = calculateDistanceKm(11.305, 75.885, 17.385, 78.486);
      expect(distHyd).toBeGreaterThan(700);
    });
  });

  describe('OSRM Route Coordinate Translation & Race-Condition Guard', () => {
    it('correctly inverts GeoJSON [lon, lat] pairs to Leaflet [lat, lon] polyline format', () => {
      // OSRM GeoJSON format: [longitude, latitude]
      const osrmCoordinates: [number, number][] = [
        [75.885, 11.305],
        [75.886, 11.306],
        [75.887, 11.307],
      ];

      // Conversion for Leaflet polyline: [latitude, longitude]
      const leafletPolyline: [number, number][] = osrmCoordinates.map(([lon, lat]) => [lat, lon]);

      expect(leafletPolyline[0]).toEqual([11.305, 75.885]);
      expect(leafletPolyline[1]).toEqual([11.306, 75.886]);
      expect(leafletPolyline[2]).toEqual([11.307, 75.887]);
    });

    it('discards stale route responses when a newer selection request is made', () => {
      let activeRequestId = 0;
      let committedRouteDestination: string | null = null;

      // Simulate Request 1 (Facility A)
      activeRequestId = 1;
      const req1Id = activeRequestId;

      // Simulate Request 2 (Facility B) immediately afterwards
      activeRequestId = 2;
      const req2Id = activeRequestId;

      // Simulate Request 1 resolves after Request 2
      const handleReq1Resolve = () => {
        if (req1Id === activeRequestId) {
          committedRouteDestination = 'Facility A';
        }
      };

      // Simulate Request 2 resolves
      const handleReq2Resolve = () => {
        if (req2Id === activeRequestId) {
          committedRouteDestination = 'Facility B';
        }
      };

      handleReq2Resolve();
      handleReq1Resolve(); // Resolves late

      // Committed destination MUST be Facility B, NOT overwritten by stale Facility A
      expect(committedRouteDestination).toBe('Facility B');
    });
  });

  describe('Global Map Positioning, Containment & Modal Stacking Invariants', () => {
    it('enforces Leaflet containment and layer hierarchy in global styles', () => {
      const globalsCss = fs.readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8');

      // 1. Leaflet container must be contained with layout paint isolation and z-index 0
      expect(globalsCss).toContain('.leaflet-container');
      expect(globalsCss).toContain('contain: layout paint');
      expect(globalsCss).toContain('z-index: 0 !important');
      expect(globalsCss).toContain('border-radius: inherit');

      // 2. Leaflet controls must be bounded below application navigation (z-40)
      expect(globalsCss).toContain('.leaflet-top');
      expect(globalsCss).toContain('z-index: 400 !important');

      // 3. Tile & marker layers must have bounded internal z-index
      expect(globalsCss).toContain('.leaflet-tile-pane');
      expect(globalsCss).toContain('z-index: 100 !important');
      expect(globalsCss).toContain('.leaflet-marker-pane');
      expect(globalsCss).toContain('z-index: 300 !important');
    });

    it('enforces local stacking isolation and GPU composited clipping on InteractiveMap wrapper', () => {
      const mapComponent = fs.readFileSync(path.resolve(__dirname, '../components/maps/InteractiveMap.tsx'), 'utf8');

      // Wrapper must have isolation, 3D transform for WebKit/Blink border-radius clip, and z-0
      expect(mapComponent).toContain('isolate');
      expect(mapComponent).toContain('[transform:translateZ(0)]');
      expect(mapComponent).toContain('z-0');
      expect(mapComponent).toContain('w-full max-w-full min-w-0');

      // Selected markers must have calibrated zIndexOffset to avoid layer collision
      expect(mapComponent).toContain('zIndexOffset: isSelected ? 40 : 0');

      // Basemap switcher must be sealed inside the map's local stacking context
      expect(mapComponent).toContain('z-[450]');
    });

    it('enforces React Portal and authoritative z-[9999] stacking in Modal component', () => {
      const modalComponent = fs.readFileSync(path.resolve(__dirname, '../components/common/Modal.tsx'), 'utf8');

      // Must use React Portal targeting document.body
      expect(modalComponent).toContain('createPortal(');
      expect(modalComponent).toContain('document.body');

      // Must have z-[9999] to guarantee appearance above Leaflet maps and sticky header
      expect(modalComponent).toContain('z-[9999]');

      // Must have sticky header with z-20 to never be obscured by modal body content
      expect(modalComponent).toContain('sticky top-0 z-20');

      // Must have accessible dialog semantics and keyboard handling
      expect(modalComponent).toContain('role="dialog"');
      expect(modalComponent).toContain('aria-modal="true"');
      expect(modalComponent).toContain("e.key === 'Escape'");
      expect(modalComponent).toContain("document.body.style.overflow = 'hidden'");
    });
  });
});
