# Architecture
## Constituency Digital Twin Demo Portal — AICM

**Status:** Implementation baseline  
**Architecture principle:** Keep the demo simple, deterministic, traceable and replaceable with future data adapters without introducing out-of-scope infrastructure.

---

## 1. Architectural boundaries

The application has three primary layers:

1. **Presentation layer** — Next.js routes, layouts, UI components, charts, maps and interactions.
2. **Application/intelligence layer** — typed use cases, calculations, validation, siting rules, risk classification, distance calculations and state transitions.
3. **Data layer** — deterministic local JSON seed datasets and a mock API facade.

Conceptual flow:

```text
User action
   |
   v
Next.js route / UI component
   |
   v
Application service / domain rule
   |
   v
lib/api.ts + demo state repository
   |
   v
Local JSON seed data + localStorage demo state
   |
   v
Typed result
   |
   v
UI / chart / map / confirmation
```

No government portal, third-party API or remote backend is called by the application.

## 2. Required technology stack

Use exactly the stack named in the supplied build prompt:

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- Leaflet + react-leaflet
- `next-pwa`
- `react-i18next`
- lucide-react
- Inter and Noto Sans Malayalam

Do not replace these technologies or add a second framework without explicit approval. Small compatible utility dependencies may be added only when required, documented and justified.

## 3. Suggested repository structure

```text
app/
  page.tsx
  layout.tsx
  president/
    page.tsx
    wards/page.tsx
    equity/page.tsx
    siting/page.tsx
    assets/page.tsx
    hazard/page.tsx
    promises/page.tsx
    budget/page.tsx
  citizen/
    page.tsx
    plot/page.tsx
    build-check/page.tsx
    facilities/page.tsx
    ward/page.tsx
    hazard/page.tsx
    grievance/page.tsx
  shared/
    assets/page.tsx
    ward/[id]/page.tsx

components/
  layout/
  navigation/
  common/
  dashboard/
  charts/
  maps/
  tables/
  drawers/
  forms/

data/
  panchayat.json
  wards.json
  gpdp_projects.json
  assets.json
  land_parcels.json
  facilities.json
  grievances.json
  hazard_zones.geojson
  pdi_themes.json
  evacuation_routes.geojson

lib/
  api.ts
  types.ts
  calculations.ts
  siting-rules.ts
  hazard.ts
  geo-utils.ts
  demo-store.ts
  storage.ts
  source-map.ts

i18n/
  index.ts
  locales/
    en.json
    ml.json

public/
  manifest.json
  icons/
  images/

README.md
DEMO.md
PRD.md
architecture.md
rules.md
security.md
```

This is a recommended organization. Existing repository conventions may be retained if they preserve the same separation and route behavior. Do not create duplicate parallel structures.

## 4. Route model

Implement every route enumerated in `PRD.md`. The original prompt's “16 total” label conflicts with its explicit route enumeration; this architecture treats the route enumeration as authoritative.

Use shared layouts for:
- Global banner and role/language controls.
- President navigation.
- Citizen navigation.
- Shared views.
- Responsive desktop sidebar and mobile bottom navigation.

Do not duplicate the same domain logic between President and Citizen pages.

## 5. Data contracts

Define TypeScript interfaces for every entity before building consuming screens.

Minimum entity relationships:

```text
Panchayat
  └── Ward[14]
        ├── GPDPProject[*]
        ├── Asset[*]
        ├── Facility[*]
        ├── Grievance[*]
        └── PDIThemeScore[9]

LandParcel[20]
  └── GeoJSON Polygon + classification + hazard + setback

HazardZone[3..4]
EvacuationRoute[3]
Shelter[2 or more]
```

Use stable IDs. Do not use array position as an entity ID.

All references must resolve. Add a development-time data validation script or tests that verify:
- Exactly 14 wards.
- Every ward reference points to an existing ward.
- Project, asset, facility and grievance counts meet the approximate requirements.
- Parcel `412/2` exists and has valid polygon geometry.
- Every GeoJSON geometry is valid enough for Leaflet rendering.
- PDI theme coverage is 9 themes × 14 wards.
- Evacuation route features have valid coordinates and referenced endpoints.

## 6. Mock API facade

`lib/api.ts` is the only normal read entry point for application data.

Requirements:
- Read bundled local JSON; do not call `fetch` to government or public data endpoints.
- Return Promises.
- Add artificial delay of 200–400 ms to simulate a data service.
- Use typed return values.
- Expose focused functions such as `getPanchayat`, `getWards`, `getWardById`, `getProjects`, `getAssets`, `getParcelBySurveyNumber`, `getFacilities`, `getGrievances`, `getHazardZones` and `getEvacuationRoutes`.
- Keep data access out of presentational components.
- Handle missing IDs and invalid searches with explicit empty/not-found results, not uncaught exceptions.
- Avoid unnecessary repeated delays for data already loaded in a single screen.

The facade is a simulation boundary, not a real backend abstraction with networking.

## 7. State and persistence

There is no backend or database.

Use:
- JSON files as deterministic seed data.
- React state/context for current-session interactions.
- localStorage for explicitly required persistence: language, dismissible banner session behavior as appropriate, and local demo grievance additions/reset state.
- A clear version key for persisted demo state, e.g. `aicm-demo-state-v1`.

Grievance flow:
1. Validate form input and selected map point.
2. Generate a demo ticket ID.
3. Add grievance to shared client-side demo state.
4. Persist it locally so route navigation and reload retain the demonstration state.
5. Read the same state in President hazard/ward/asset views.
6. Reset Demo restores seed state and clears local demo changes.

Do not claim multi-device or multi-user synchronization. localStorage is browser-local.

## 8. Domain/application services

Keep business rules in pure functions or focused services, not embedded in React components.

Recommended services:
- `calculateWardAggregates`
- `calculatePerCapitaSpend`
- `calculateBudgetProjection`
- `evaluateSiting`
- `evaluateBuildCheck`
- `classifyHazardRisk`
- `findAssetsInHazardZones`
- `getRelatedGrievances`
- `calculateDistanceKm`
- `getNearestFacilities`
- `getNearestShelter`
- `getProjectDaysOverdue`

Pure functions should accept explicit inputs and return deterministic outputs. Avoid hidden dependence on browser state or current time; inject dates where necessary.

## 9. Maps and geospatial behavior

Use Leaflet and React Leaflet. Components requiring browser globals must be client components and may need dynamic import with server-side rendering disabled.

Requirements:
- Use valid GeoJSON Feature/FeatureCollection structures.
- Keep coordinate order correct: GeoJSON positions are `[longitude, latitude]`; Leaflet markers use `[latitude, longitude]`.
- Use a documented demo coordinate system and consistent fictional geometry. Do not imply that fictional polygons are authoritative boundaries.
- Render parcel, hazard and evacuation layers with a visible legend.
- Provide map loading and error states.
- Provide a usable offline fallback when OSM tiles cannot load. Do not rely on remote map tiles for core textual workflow completion.
- Do not download or bulk-cache OSM tiles. Follow the tile provider's usage policy.

## 10. Charts and calculations

Use Recharts for the specified charts. Charts must:
- Have accessible titles/labels or equivalent textual summaries.
- Use the same source data as tables/KPIs.
- Respond to selected ward/filter state.
- Show the district average line where specified.
- Avoid implying causality from descriptive comparisons.
- Handle empty and zero values safely.

Budget simulation must be implemented in a pure function and follow `rules.md`.

## 11. Internationalization

Use `react-i18next` with `en` and `ml` resource bundles.

All visible strings must use translation keys. Avoid hardcoded UI copy inside components. Include chart labels, map legends, form errors, statuses, source labels, buttons, empty/loading states, dialogs and navigation.

Persist locale selection in localStorage. Apply Malayalam font styling when locale is `ml`.

## 12. PWA and offline strategy

Implement:
- `manifest.json`.
- Required icons (192, 512, maskable).
- Standalone display and `/` start URL.
- Service worker caching for application shell, static assets, local data and required routes.
- Install affordance where browser support permits.
- iOS Add to Home Screen metadata/instructions.

Offline acceptance:
- After first successful online visit, required application routes should load offline.
- Local JSON and local demo state remain available.
- OSM tiles and Google Fonts may be unavailable offline; show map fallback and use a system/font fallback.
- Do not claim offline map tiles unless tested and permitted.
- Verify service-worker behavior in a production build over HTTPS or localhost, not only the development server.

## 13. Error and loading behavior

Every data-driven route must provide:
- Loading skeleton or equivalent.
- Empty state.
- Not-found state for invalid IDs/survey numbers.
- Recoverable error message.
- No blank screen on malformed demo input.

Use an application-level error boundary and route-level not-found behavior where appropriate.

## 14. Testing strategy

Minimum:
- TypeScript typecheck.
- Lint.
- Production build.
- Unit tests for calculation and rule functions.
- Data integrity tests.
- Route smoke tests.
- Workflow tests for the eight-step walkthrough.
- Responsive checks at 375px, 768px and 1280px.
- Locale coverage check for visible strings.
- PWA/offline test after production build.
- Browser console check during walkthrough.

Do not mark a feature complete because it compiles. Validate its behavior.

## 15. Future real-data replacement boundary

When authorized real datasets arrive, replace or extend the data provider/adapters behind the application boundary. Do not add live integrations during this demo.

Potential future sources named in the AICM map include KSDI, Ente Bhoomi, ReLIS, Sanchaya/IKM, PWD, KSEB via KSDI, DES, OpenDataKerala, Dataful, UDISE+, eGramSwaraj, PDI Portal, Kerala SDG Dashboard, KSDMA, IMD, Kerala Startup Mission, EoDB/DIC, IP India, OpenStreetMap, Bhuvan Panchayat, Censusindia, Kerala OGD and Sanketham.

The source map is not proof of API availability. The PDF explicitly notes that several sources are portal-first or require departmental coordination. Future integration requires separate access approval, data contracts, freshness policy and security review.
