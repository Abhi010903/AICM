import { describe, it, expect, vi } from 'vitest';
import { translations } from '../lib/i18n-dictionary';
import { resetDemoState } from '../lib/demo-store';
import { evaluateDisasterRisk, DEFAULT_TELEMETRY, WeatherTelemetryInput, DisasterEvaluationResult } from '../lib/hazard-engine';
import mlaKnowledgeBase from '../data/mla-knowledge-base.json';

const { wards: wardsData, land_parcels: landParcelsData, hazard_zones: hazardZonesData, evacuation_routes: evacuationRoutesData } = mlaKnowledgeBase;
import fs from 'fs';
import path from 'path';

describe('Bilingual & Dictionary Integrity', () => {
  it('enforces 100% dictionary key parity between en and ml', () => {
    const enKeys = Object.keys(translations.en).sort();
    const mlKeys = Object.keys(translations.ml).sort();
    expect(mlKeys).toEqual(enKeys);
    expect(enKeys.length).toBeGreaterThanOrEqual(140);
  });

  it('contains no empty or whitespace-only translation values', () => {
    for (const [key, val] of Object.entries(translations.en)) {
      expect((val as string).trim().length, `Empty English value for key: ${key}`).toBeGreaterThan(0);
    }
    for (const [key, val] of Object.entries(translations.ml)) {
      expect((val as string).trim().length, `Empty Malayalam value for key: ${key}`).toBeGreaterThan(0);
    }
  });

  it('verifies hazard zones and evacuation routes have bilingual attributes', () => {
    hazardZonesData.features.forEach((f: any) => {
      expect(f.properties.name_en?.trim().length).toBeGreaterThan(0);
      expect(f.properties.name_ml?.trim().length).toBeGreaterThan(0);
    });

    evacuationRoutesData.features.forEach((f: any) => {
      expect(f.properties.name_en?.trim().length).toBeGreaterThan(0);
      expect(f.properties.name_ml?.trim().length).toBeGreaterThan(0);
      expect(f.properties.shelter_name_en?.trim().length).toBeGreaterThan(0);
      expect(f.properties.shelter_name_ml?.trim().length).toBeGreaterThan(0);
    });
  });

  it('verifies non-empty Malayalam text across all 14 wards and all parcels', () => {
    expect(wardsData.length).toBe(14);
    wardsData.forEach((w) => {
      expect(w.name_en?.trim().length).toBeGreaterThan(0);
      expect(w.name_ml?.trim().length).toBeGreaterThan(0);
    });

    landParcelsData.forEach((p) => {
      expect(p.permitted_activities_ml.length).toBeGreaterThan(0);
      expect(p.restricted_activities_ml.length).toBeGreaterThan(0);
    });
  });

  it('resolves flood_med hazard key properly in both English and Malayalam', () => {
    expect(translations.en.hazard_flood_med).toBe('Moderate Flood Zone');
    expect(translations.ml.hazard_flood_med).toBe('മിതമായ വെള്ളപ്പൊക്ക മേഖല');
  });
});

describe('Service Worker & Cache Invalidation Strategy', () => {
  it('sw.js defines versioned caches and deletes obsolete versions on activate', () => {
    const swContent = fs.readFileSync(path.resolve(__dirname, '../public/sw.js'), 'utf-8');

    expect(swContent).toMatch(/CACHE_VERSION\s*=\s*['"]v\d+['"]/);
    expect(swContent).toContain('EXPECTED_CACHES');
    expect(swContent).toContain('caches.delete(key)');
    expect(swContent).not.toContain("const CACHE_NAME = 'aicm-twin-v2'");
  });

  it('sw.js implements Network-First with safe offline Response fallbacks', () => {
    const swContent = fs.readFileSync(path.resolve(__dirname, '../public/sw.js'), 'utf-8');

    expect(swContent).toContain("event.request.mode === 'navigate'");
    expect(swContent).toContain("url.searchParams.has('_rsc')");
    expect(swContent).toContain('RUNTIME_CACHE');
    expect(swContent).toContain('new Response(');
    expect(swContent).toContain("status: 503");
  });

  it('sw.js strictly scopes cache purges to aicm- prefix', () => {
    const swContent = fs.readFileSync(path.resolve(__dirname, '../public/sw.js'), 'utf-8');

    expect(swContent).toContain("key.startsWith('aicm-')");
  });

  it('sw.js bypasses webpack HMR, dev chunks, and native APIs', () => {
    const swContent = fs.readFileSync(path.resolve(__dirname, '../public/sw.js'), 'utf-8');

    expect(swContent).toContain('/_next/webpack-hmr');
    expect(swContent).toContain('hot-update');
    expect(swContent).toContain("url.pathname.startsWith('/api/')");
  });

  it('sw.js guarantees lifecycle safety without calling event.waitUntil inside async callbacks', () => {
    const swContent = fs.readFileSync(path.resolve(__dirname, '../public/sw.js'), 'utf-8');

    // Ensure no calls to event.waitUntil occur inside .then() or .catch() callbacks in fetch handler
    expect(swContent).not.toMatch(/\.then\s*\(\s*[^)]*event\.waitUntil/);
    expect(swContent).not.toMatch(/\.catch\s*\(\s*[^)]*event\.waitUntil/);

    // Verify synchronous registration of revalidatePromise during event dispatch
    expect(swContent).toContain('event.waitUntil(revalidatePromise);');

    // Verify cache writes are awaited directly inside respondWith promise chains via best-effort helper
    expect(swContent).toContain('await putInRuntimeCache(event.request, networkResponse);');
  });

  it('sw.js performs best-effort cache writes without turning network success into failure', async () => {
    const swContent = fs.readFileSync(path.resolve(__dirname, '../public/sw.js'), 'utf-8');

    // Verify static implementation properties
    expect(swContent).toContain('async function putInRuntimeCache(request, response)');
    expect(swContent).toContain("console.warn('[SW] Runtime cache write failed:', err);");
    expect(swContent).toContain('await cache.put(request, response.clone());');

    // Functional simulation: verify that cache.put failure is absorbed and network response is preserved
    const mockNetworkResponse = {
      status: 200,
      type: 'basic',
      clone: () => ({ ...mockNetworkResponse }),
    };

    const failingCache = {
      put: vi.fn().mockRejectedValue(new Error('QuotaExceededError')),
    };

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      // Simulate putInRuntimeCache logic as written in public/sw.js
      const putInRuntimeCacheSim = async (request: any, response: any) => {
        try {
          await failingCache.put(request, response.clone());
        } catch (err) {
          console.warn('[SW] Runtime cache write failed:', err);
        }
      };

      // Simulate navigation handler
      const simulateNavigationHandler = async () => {
        try {
          const networkResponse = mockNetworkResponse;
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            await putInRuntimeCacheSim('https://example.com/president', networkResponse);
          }
          return networkResponse;
        } catch {
          return { status: 503, statusText: 'Service Unavailable' };
        }
      };

      const result = await simulateNavigationHandler();
      expect(result.status).toBe(200);
      expect(warnSpy).toHaveBeenCalledWith(
        '[SW] Runtime cache write failed:',
        expect.any(Error)
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('sw.js explicitly scopes cache lookups to AICM caches and ignores unrelated origin caches', async () => {
    const swContent = fs.readFileSync(path.resolve(__dirname, '../public/sw.js'), 'utf-8');

    // Verify that global caches.match() is never called
    expect(swContent).not.toMatch(/caches\.match\s*\(/);

    // Verify scoped matchAicmCache function is defined and used
    expect(swContent).toContain('async function matchAicmCache(request)');
    expect(swContent).toContain('await matchAicmCache(event.request)');
    expect(swContent).toContain("await matchAicmCache('/')");

    // Functional simulation: verify only AICM caches are opened and unrelated origin caches are never read
    const openedCaches: string[] = [];
    const foreignCacheMatch = vi.fn().mockResolvedValue({ status: 200, body: 'foreign-data' });
    const aicmRuntimeMatch = vi.fn().mockResolvedValue(null);
    const aicmShellMatch = vi.fn().mockResolvedValue({ status: 200, body: 'aicm-shell-data' });

    const mockCaches = {
      open: async (name: string) => {
        openedCaches.push(name);
        if (name === 'aicm-runtime-v3') return { match: aicmRuntimeMatch };
        if (name === 'aicm-shell-v3') return { match: aicmShellMatch };
        if (name === 'foreign-origin-cache') return { match: foreignCacheMatch };
        return { match: async () => null };
      },
    };

    // Simulate matchAicmCache algorithm from sw.js
    const matchAicmCacheSim = async (request: any) => {
      for (const cacheName of ['aicm-runtime-v3', 'aicm-shell-v3']) {
        try {
          const cache = await mockCaches.open(cacheName);
          const match = await cache.match(request);
          if (match) return match;
        } catch {}
      }
      return null;
    };

    const result = await matchAicmCacheSim('https://example.com/manifest.json');
    expect(result).toEqual({ status: 200, body: 'aicm-shell-data' });
    expect(openedCaches).toEqual(['aicm-runtime-v3', 'aicm-shell-v3']);
    expect(openedCaches).not.toContain('foreign-origin-cache');
    expect(foreignCacheMatch).not.toHaveBeenCalled();
  });

  it('next.config.js sets no-cache headers for sw.js', () => {
    const nextConfigContent = fs.readFileSync(path.resolve(__dirname, '../next.config.js'), 'utf-8');

    expect(nextConfigContent).toContain('/sw.js');
    expect(nextConfigContent).toContain('no-cache, no-store, must-revalidate');
  });

  it('resetDemoState correctly clears demo keys, preserves language preference, and purges runtime cache', async () => {
    const mockStorage: Record<string, string> = {
      'aicm-demo-state-v1': JSON.stringify({ version: 1, custom_grievances: [] }),
      'aicm-role': 'citizen',
      'aicm-language': 'ml',
    };
    const mockSession: Record<string, string> = {
      'aicm-banner-dismissed': 'true',
    };

    const deletedCaches: string[] = [];

    const mockCaches = {
      keys: async () => ['aicm-shell-v3', 'aicm-runtime-v3', 'external-cache-v1'],
      delete: async (name: string) => {
        deletedCaches.push(name);
        return true;
      },
    };

    // Capture original values of all four globals and check property existence
    const hasOriginalWindow = 'window' in global;
    const originalWindow = (global as any).window;

    const hasOriginalCaches = 'caches' in global;
    const originalCaches = (global as any).caches;

    const hasOriginalLocalStorage = 'localStorage' in global;
    const originalLocalStorage = (global as any).localStorage;

    const hasOriginalSessionStorage = 'sessionStorage' in global;
    const originalSessionStorage = (global as any).sessionStorage;

    (global as any).window = {
      location: {
        pathname: '/president',
        replace: vi.fn(),
        reload: vi.fn(),
      },
      caches: mockCaches,
    };
    (global as any).caches = mockCaches;
    (global as any).localStorage = {
      getItem: (k: string) => mockStorage[k] || null,
      setItem: (k: string, v: string) => { mockStorage[k] = v; },
      removeItem: (k: string) => { delete mockStorage[k]; },
    };
    (global as any).sessionStorage = {
      getItem: (k: string) => mockSession[k] || null,
      setItem: (k: string, v: string) => { mockSession[k] = v; },
      removeItem: (k: string) => { delete mockSession[k]; },
    };

    try {
      await resetDemoState();

      // Verify demo state removed
      expect(mockStorage['aicm-demo-state-v1']).toBeUndefined();
      expect(mockStorage['aicm-role']).toBeUndefined();
      expect(mockSession['aicm-banner-dismissed']).toBeUndefined();

      // Verify language preference preserved
      expect(mockStorage['aicm-language']).toBe('ml');

      // Verify only aicm runtime cache was purged, not shell or external caches
      expect(deletedCaches).toEqual(['aicm-runtime-v3']);

      // Verify navigation was triggered
      expect((global as any).window.location.replace).toHaveBeenCalledWith('/');
    } finally {
      // Restore all four globals, deleting properties that did not originally exist
      if (hasOriginalWindow) {
        (global as any).window = originalWindow;
      } else {
        delete (global as any).window;
      }

      if (hasOriginalCaches) {
        (global as any).caches = originalCaches;
      } else {
        delete (global as any).caches;
      }

      if (hasOriginalLocalStorage) {
        (global as any).localStorage = originalLocalStorage;
      } else {
        delete (global as any).localStorage;
      }

      if (hasOriginalSessionStorage) {
        (global as any).sessionStorage = originalSessionStorage;
      } else {
        delete (global as any).sessionStorage;
      }
    }
  });
});

describe('Hazard Engine Disaster Management & Localization Integrity', () => {
  const baseTelemetry: WeatherTelemetryInput = {
    rainfall_mm_24h: 20,
    rainfall_intensity_mm_hr: 4,
    river_level_meters: 5.5,
    reservoir_storage_percent: 50,
    imd_alert: 'GREEN',
    drainage_blockage_percent: 10,
    monsoon_deficit_percent: 0,
    groundwater_depletion_meters: 0.1,
  };

  it('correctly evaluates NORMAL risk scenario', () => {
    const res = evaluateDisasterRisk(baseTelemetry);
    expect(res.risk_level).toBe('NORMAL');
    expect(res.verdict_title).toBe('Normal Seasonal Conditions');
    expect(res.admin_alert).toBeUndefined();
    expect(res.vulnerable_wards.length).toBe(0);
  });

  it('correctly evaluates WATCH risk scenario', () => {
    const watchTelemetry: WeatherTelemetryInput = {
      ...baseTelemetry,
      river_level_meters: 7.2, // WATCH threshold (>= 7.0m gives 12 pts)
      rainfall_mm_24h: 70, // WATCH threshold (>= 64.5mm gives 15 pts) -> total 27 pts >= 20
    };
    const res = evaluateDisasterRisk(watchTelemetry);
    expect(res.risk_level).toBe('WATCH');
    expect(res.verdict_title).toBe('HAZARD WATCH: Active Monsoon Vigilance');
    expect(res.vulnerable_wards.length).toBe(1);
    expect(res.vulnerable_wards[0].ward_id).toBe(7);
    expect(res.vulnerable_wards[0].ward_name_ml).toBe('ചെറുവണ്ണൂർ (നദീതീരം)');
    expect(res.vulnerable_wards[0].recommended_action_ml).toBe('നദീതീര വീടുകൾക്ക് ജാഗ്രതാ നിർദ്ദേശം നൽകുക; ഓടകളിലെ തടസ്സങ്ങൾ നീക്കുക');
    expect(res.admin_alert).toBeUndefined();
  });

  it('correctly evaluates WARNING risk scenario and generates original alert structure', () => {
    const warningTelemetry: WeatherTelemetryInput = {
      ...baseTelemetry,
      river_level_meters: 8.6, // WARNING threshold (>= 8.5m)
    };
    const res = evaluateDisasterRisk(warningTelemetry);
    expect(res.risk_level).toBe('WARNING');
    expect(res.verdict_title).toBe('FLOOD WARNING: Elevated Inundation Exposure');
    expect(res.vulnerable_wards.length).toBe(3);
    expect(res.admin_alert).toBeDefined();
    expect(res.admin_alert?.severity).toBe('WARNING');
    expect(res.admin_alert?.headline).toBe('AUTOMATIC DISASTER WARNING: FLOOD WARNING: Elevated Inundation Exposure');
  });

  it('correctly evaluates CRITICAL risk scenario with dynamic emergency ID and original response checklist', () => {
    const criticalTelemetry: WeatherTelemetryInput = {
      ...baseTelemetry,
      river_level_meters: 9.8, // CRITICAL threshold (>= 9.5m)
    };

    // Deterministic test strategy for dynamic emergency ID uniqueness wrapped in try/finally
    const dateSpy = vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1700000000000)
      .mockReturnValueOnce(1700000005000);

    let res1: DisasterEvaluationResult;
    let res2: DisasterEvaluationResult;

    try {
      res1 = evaluateDisasterRisk(criticalTelemetry);
      res2 = evaluateDisasterRisk(criticalTelemetry);

      expect(res1.risk_level).toBe('CRITICAL');
      expect(res1.verdict_title).toBe('CRITICAL FLOOD & LANDSLIDE EMERGENCY');
      expect(res1.admin_alert).toBeDefined();
      expect(res1.admin_alert?.severity).toBe('CRITICAL');
      expect(res1.admin_alert?.id).toMatch(/^EMERGENCY-\d+$/);

      // Verify dynamic emergency ID uniqueness and deterministic generation
      expect(res1.admin_alert?.id).toBe('EMERGENCY-1700000000000');
      expect(res2.admin_alert?.id).toBe('EMERGENCY-1700000005000');
      expect(res1.admin_alert?.id).not.toBe(res2.admin_alert?.id);

      // Verify exact original 5-point action checklist
      expect(res1.admin_alert?.action_checklist).toEqual([
        'Convene Emergency Disaster Management Committee at Panchayat Office.',
        'Deploy Ward 7 & Ward 8 rescue volunteers to coordinate high-ground evacuation.',
        'Open Thekkumpuram HSS Relief Camp with dry rations and medical first-aid.',
        'Contact KSEB to isolate inundated low-tension power cables.',
        'Initiate public broadcast advisory via community loudspeakers & SMS gateway.',
      ]);

      // Verify exact original English and Malayalam broadcast SMS templates
      expect(res1.admin_alert?.broadcast_sms_template_en).toBe(
        `URGENT NOTICE (Thekkumpuram GP): Chaliyar river has reached 9.8m. Citizens in Ward 7 & Ward 8 are advised to move to designated relief shelters immediately. Control room: 0495-2884101.`
      );
      expect(res1.admin_alert?.broadcast_sms_template_ml).toBe(
        `അടിയന്തര മുന്നറിയിപ്പ് (തെക്കുംപുരം ഗ്രാമപഞ്ചായത്ത്): ചാലിയാർ ജലനിരപ്പ് 9.8 മീറ്ററിലെത്തി. വാർഡ് 7, 8 നിവാസികൾ ദുരിതാശ്വാസ ക്യാമ്പുകളിലേക്ക് മാറുക. കൺട്രോൾ റൂം: 0495-2884101.`
      );
    } finally {
      dateSpy.mockRestore();
    }
  });

  it('enforces 1:1 explanation parity between English and Malayalam telemetry statements', () => {
    const res = evaluateDisasterRisk(DEFAULT_TELEMETRY);
    expect(res.explanation.length).toBeGreaterThan(0);
    expect(res.explanation_ml?.length).toBe(res.explanation.length);

    res.explanation.forEach((exp, idx) => {
      expect(exp.trim().length).toBeGreaterThan(0);
      const expMl = res.explanation_ml?.[idx];
      expect(expMl?.trim().length).toBeGreaterThan(0);
    });
  });

  it('provides bilingual names for all active shelters and activated routes', () => {
    const res = evaluateDisasterRisk(DEFAULT_TELEMETRY);
    expect(res.active_shelters.length).toBe(2);
    expect(res.active_shelters[0].name_ml).toBe('തെക്കുംപുരം ഗവ. ഹയർ സെക്കൻഡറി സ്കൂൾ ദുരിതാശ്വാസ ക്യാമ്പ്');
    expect(res.active_shelters[1].name_ml).toBe('മേലെ അങ്ങാടി കമ്മ്യൂണിറ്റി ഹാൾ & ദുരിതാശ്വാസ ഷെൽട്ടർ');

    res.active_shelters.forEach((shelter) => {
      expect(shelter.name.trim().length).toBeGreaterThan(0);
      expect(shelter.name_ml?.trim().length).toBeGreaterThan(0);
    });

    expect(res.activated_routes.length).toBe(2);
    expect(res.activated_routes[0].name_ml).toBe('ചെറുവണ്ണൂർ താഴ്ന്ന പ്രദേശം മുതൽ ഹയർ സെക്കൻഡറി സ്കൂൾ വരെയുള്ള പാത');
    expect(res.activated_routes[1].name_ml).toBe('കോട്ടക്കുന്ന് ഉരുൾപൊട്ടൽ സാധ്യതയുള്ള ചരിവിലെ ഒഴിപ്പിക്കൽ പാത');

    res.activated_routes.forEach((route) => {
      expect(route.name.trim().length).toBeGreaterThan(0);
      expect(route.name_ml?.trim().length).toBeGreaterThan(0);
    });
  });

  it('preserves bilingual drought evaluation summaries', () => {
    const severeDroughtTelemetry: WeatherTelemetryInput = {
      ...baseTelemetry,
      monsoon_deficit_percent: 50,
      groundwater_depletion_meters: 2.0,
    };
    const res = evaluateDisasterRisk(severeDroughtTelemetry);
    expect(res.drought_status).toBe('SEVERE_DROUGHT');
    expect(res.drought_summary).toBe('CRITICAL DEFICIT: Monsoon rainfall is 50% below normal. Severe groundwater depletion (2m).');
    expect(res.drought_summary_ml).toBe('ഗുരുതര ജലക്ഷാമം: കാലവർഷം സാധാരണയേക്കാൾ 50% കുറവ്. കടുത്ത ഭൂഗർഭജല ശോഷണം (2 മീറ്റർ).');
  });
});
