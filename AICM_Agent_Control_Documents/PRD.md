# Product Requirements Document (PRD)
## Grama Panchayat Digital Twin Demo Portal — AICM

**Document status:** Baseline / scope-control document  
**Product:** Grama Panchayat Digital Twin Demo Portal (Web + Mobile PWA)  
**Demo Panchayat:** Thekkumpuram Grama Panchayat (തെക്കുംപുരം ഗ്രാമപഞ്ചായത്ത്)  
**District:** Kozhikode  
**Assembly Constituency:** Kunnamangalam  
**Data status:** Fictional demonstration data only  
**Last verified label required by the supplied build brief:** `2026-10-30`

---

## 1. Purpose

Build a single responsive web application, installable as a mobile Progressive Web App (PWA), that demonstrates a Grama Panchayat Digital Twin for two audiences:

1. **Panchayat President** — administrative monitoring and decision-support.
2. **Normal Citizen** — public information and citizen-service workflows.

The prototype must demonstrate the traceable chain:

**Government/public data source → Digital Twin layer → AICM delivery module → User-facing feature.**

This is a demo, not a production government system. All datasets are hardcoded fictional/demo data. No government portal may be called by the application.

## 2. Product goals

- Demonstrate a coherent digital representation of a fictional Grama Panchayat.
- Let the President inspect ward performance, plans, expenditure, assets, grievances, land suitability and hazard exposure.
- Let citizens inspect a demo parcel, find facilities, view ward works, understand demo hazard information and submit a local demo grievance.
- Reuse the same underlying entities across President and Citizen experiences.
- Make the source → layer → module → feature relationship visible and understandable.
- Support English and Malayalam.
- Work offline after the first successful load, subject to the offline limitations in `architecture.md`.
- Provide a reliable, scripted eight-minute demonstration.

## 3. Non-goals

The following are explicitly out of scope for this version:

- Real government API integration or live government data.
- Real authentication, authorization or user accounts.
- Production backend, database or server-side persistence.
- Citizen assistant/chatbot.
- Industrial intelligence.
- Constituency innovation index.
- Predictive flood modelling.
- PDF export.
- Analytics services, error-reporting services or third-party trackers.
- Legally authoritative land, construction, hazard or emergency advice.

Do not implement these items unless the product owner explicitly changes this document.

## 4. Demo identity — fixed values

Use exactly these values. Do not invent an alternative Panchayat identity.

| Field | Required value |
|---|---|
| Panchayat | Thekkumpuram Grama Panchayat |
| Malayalam | തെക്കുംപുരം ഗ്രാമപഞ്ചായത്ത് |
| District | Kozhikode |
| Assembly Constituency | Kunnamangalam |
| Wards | 14 |
| Population | 28,450 |
| Households | 6,820 |
| Area | 32.4 sq km |

### Ward list (English / Malayalam)

1. Kizhakkumuri / കിഴക്കുമുറി
2. Padinjarekkara / പടിഞ്ഞാറേക്കര
3. Thazhe Angadi / താഴെ അങ്ങാടി
4. Mele Angadi / മേലെ അങ്ങാടി
5. Kallurutty / കല്ലുരുട്ടി
6. Puthiyangadi / പുതിയങ്ങാടി
7. Cheruvannur / ചെറുവണ്ണൂർ
8. Kottakkunnu / കോട്ടക്കുന്ന്
9. Manalody / മണലോടി
10. Pulikkanny / പുലിക്കണ്ണി
11. Velliparamba / വെള്ളിപ്പറമ്പ്
12. Nellikkode / നെല്ലിക്കോട്
13. Kavumpuram / കവുമ്പുറം
14. Athanikkal / അത്താണിക്കൽ

Every screen must clearly identify the Panchayat as fictional demo data. Required banner wording:
`Demo data — fictional Panchayat (Thekkumpuram, Kozhikode). Not connected to live government systems.`

## 5. Users and permissions model

### President
A demo role selected through a role switch; not authenticated. Can view administrative dashboards and use demo simulations/actions.

### Citizen
A demo role selected through a role switch; not authenticated. Can view citizen-facing information and submit a local-only demo grievance.

### Shared
Read-only asset register and ward dashboard. Role-sensitive display may hide administrative spend-efficiency fields from the Citizen view.

**Important:** Role switching is navigation/UI behavior only. It is not security or access control.

## 6. Required routes and functionality

The supplied prompt says “16 total” but explicitly enumerates 18 routes/views when the landing page, President, Citizen and Shared routes are counted. To avoid silently dropping a requested feature, implement every explicitly listed route below. Treat the enumerated route list as authoritative.

### Landing
- `/`
- Project hero: `Grama Panchayat Digital Twin — Demo`.
- President and Citizen entry buttons.
- EN / മലയാളം toggle persisted in localStorage.
- Fictional-data disclaimer.
- Footer with three statutory placeholder links and `Last verified: 2026-10-30`.

### President
- `/president` — six KPI cards: PDI score, total GPDP spend (₹ lakh), assets, open grievances, wards below district average, delayed projects. Include spend-by-ward bar chart and PDI-by-ward horizontal bar chart with district average line. Link to all President features.
- `/president/wards` — sortable 14-ward ledger: ward, population, PDI, spend, projects (done/total), assets (good/fair/poor), open grievances. Row opens detail drawer showing promise → spend → asset → outcome timeline.
- `/president/equity` — scatter chart: X=PDI, Y=per-capita spend; show the quadrants described in the supplied prompt; clicking a point explains the selected ward's flag. Do not imply correlation or causation.
- `/president/siting` — select ward, parcel and proposed work type; evaluate configured demo rules and return PASS / CONDITIONAL / FAIL with reasons. Show selected parcel and hazard overlays on a Leaflet map.
- `/president/assets` — filter by ward, type and condition; group-by-condition counts; asset drawer with map pin, maintenance date and related grievances.
- `/president/hazard` — hazard polygons and asset pins; distinguish assets inside/outside demo hazard zones; list assets at risk and nearest shelters; Orange Book checklist with 8 mock items, 5 checked; preview one evacuation route.
- `/president/promises` — approximately 40 projects grouped by completed/ongoing/delayed; show title, ward, budget, spent and days overdue when delayed; filter by ward.
- `/president/budget` — sliders to shift ₹ lakh between two wards; dynamically update per-capita spend, illustrative PDI projection and equity position. Use the formula specified in `rules.md`.

### Citizen
- `/citizen` — bilingual cards: My Land, Build Check, Nearby Services, Report a Problem. Default citizen ward is Ward 7 Cheruvannur. Show PDI, spend per capita and open works.
- `/citizen/plot` — survey-number search, default example `412/2`; show parcel polygon, classification, hazard badge and plain-language demo guidance.
- `/citizen/build-check` — survey number/address and building type; return PASS / NEEDS APPROVAL / NOT PERMITTED with reasons; link to the same parcel in My Plot.
- `/citizen/facilities` — map and facility pins; filter Schools, Health, Anganwadi, Akshaya, Krishi and Vet; list distance and staff filled/sanctioned.
- `/citizen/ward` — latest eight Ward 7 GPDP projects; show title, status, budget, spent and photo placeholder; read-only all-wards toggle.
- `/citizen/hazard` — address/demo location input; HIGH / MEDIUM / LOW risk with reason; map house pin, hazard polygon, nearest shelter and route; shelter name, distance, capacity and contact.
- `/citizen/grievance` — category, description, local photo selection, map pin; submit creates a ticket with OPEN status; “See it on the map” leads to the corresponding demo view.

### Shared
- `/shared/assets` — read-only version of the asset register; no maintenance-action controls.
- `/shared/ward/:id` — combined ward ledger and citizen scorecard; hide spend-efficiency fields in Citizen role.

## 7. Required mock data

Create one JSON file per entity in `/data`:

| File | Required content |
|---|---|
| `panchayat.json` | Fixed identity block |
| `wards.json` | 14 wards; population, households, PDI, seven SDG scores, spend, GPDP project count, asset count, open grievances, centroid |
| `gpdp_projects.json` | Approximately 40 projects; valid ward IDs, category, budget, spent, status, dates, source `eGramSwaraj` |
| `assets.json` | Approximately 120 assets; valid ward IDs, type, bilingual names, coordinates, condition, maintenance date, tax status, owner, source `Sanchaya` |
| `land_parcels.json` | 20 demo parcels with GeoJSON Polygon; include survey `412/2`; classification, area, hazard zone and setback flag |
| `facilities.json` | Approximately 35 facilities; bilingual names, coordinates, ward, staff filled/sanctioned, source `UDISE+ / DES` as appropriate |
| `grievances.json` | Approximately 60 geotagged grievances; valid ward IDs, category, description, coordinates, status, filed date, assigned department |
| `hazard_zones.geojson` | 3–4 polygons: flood_high, flood_med, landslide |
| `pdi_themes.json` | 9 PDI themes × 14 wards |
| `evacuation_routes.geojson` | Three routes from populated areas to two shelters |

All displayed names must have English and Malayalam values (`_en` and `_ml`). Numbers may be shared across locales.

### Data integrity rules
- Every foreign key (`ward_id`, parcel reference, asset reference) must resolve.
- Ward aggregates must agree with their underlying projects/assets/grievances, or any intentionally different aggregate must be explicitly documented as a derived/demo value.
- The same parcel record and same rule engine must power President siting and Citizen build-check.
- Grievance submission must update the shared demo state so the President view can see it.
- All demo data must be deterministic and reproducible; do not generate new random data on each render.
- Every dataset must be labelled as simulated data, never represented as verified government records.

## 8. Source traceability

Relevant cards/tables/details must display a `Public source: <name>` chip matching the dataset's `source` metadata. Source attribution means “modeled on / intended source,” not that the displayed demo record was fetched from that portal.

Show the mapping:
- L1 Spatial Base — boundaries, hydrography and spatial reference data.
- L2 Cadastral — parcels and land classification.
- L3 Built Environment — buildings, roads and utilities.
- L4 Socio-Demographic — population, SHG and voter-related indicators.
- L5 Service Infrastructure — health, education and facilities.
- L6 Plan & Finance — GPDP, PDI, SDG and budget.
- L7 Risk & Resilience — hazard, evacuation and sensors.
- L8 Natural Resources — crops and groundwater.

Modules:
- M1 Governance Ledger
- M2 Asset & Infrastructure
- M3 Land & Statutory
- M4 Disaster & Resilience
- M5 Social Well-being
- M6 Citizen Interface
- M7 Agriculture & Water
- M8 Planning & Finance

Each screen must be mapped in `README.md` using source → layer → module → feature. Do not claim every one of the 24 sources is integrated in the demo; the demo uses the mock datasets and selected source labels described here.

## 9. Shared behavior and global controls

- Role switch available on every screen.
- EN / മലയാളം toggle available on every screen.
- Persistent, dismissible-per-session fictional demo banner on all routes except the landing hero.
- Hidden footer menu includes Reset Demo; it clears demo localStorage and returns to `/`.
- Every data-driven card/table shows `Last verified: 2026-10-30`.
- Reset must restore deterministic seed state.
- Empty states and loading skeletons must exist for lists/data views.

## 10. Internationalization

- Use `react-i18next`.
- Locales: `en`, `ml`.
- Every user-visible string, including navigation, buttons, validation, empty/loading states, chart labels, map legends, dialogs, source labels and error messages, must be translated.
- Use Inter for Latin and Noto Sans Malayalam for Malayalam.
- Language choice persists in localStorage.
- Do not leave untranslated English strings in Malayalam mode except proper names, source identifiers, codes and technical terms where retaining the original is appropriate.

## 11. Responsive design and accessibility

- Mobile-first.
- At 375px, 768px and 1280px widths, no horizontal page overflow.
- Mobile bottom navigation: maximum five items.
- Desktop left sidebar groups screens by audience.
- Keyboard-reachable interactive controls.
- Accessible labels for icons and form controls.
- WCAG AA contrast target.
- Tables must have a mobile-usable presentation (responsive table, cards or controlled horizontal region without page-level overflow).

## 12. PWA and offline requirements

- Web app manifest: name, short name, 192px/512px and maskable icons, theme color, `/` start URL, standalone display.
- Installable on Android Chrome and support iOS Safari Add to Home Screen.
- Cache application shell, local JSON data and all required routes so all specified routes can load after first successful visit.
- No application data fetches to government sources or external APIs.
- OSM map tiles, Google Fonts and static assets are the only external-network exceptions stated in the prompt. Do not promise that map tiles or remote fonts work offline unless cached/licensed behavior is verified. Provide a useful offline map fallback.
- Offline grievance submission is local demo state only.

## 13. Acceptance criteria

The product is accepted for demo when:
- Every explicitly enumerated route renders at 375px, 768px and 1280px without page-level horizontal overflow.
- PWA install support is verified on supported platforms.
- All specified routes load offline after the first successful visit (with offline map fallback).
- Language toggle translates all visible application strings.
- Role switch works from every route.
- All 14 wards appear wherever ward lists/filters are required.
- Eight-step reviewer walkthrough succeeds.
- Source chips match the relevant mock dataset source metadata.
- Data-driven views show the required last-verified stamp.
- Demo banner behavior matches the requirements.
- No live government API calls occur.
- README includes setup, walkthrough, source/layer/module/feature mapping, feature coverage/deferred list and assumptions.
- DEMO.md includes the supplied one-line pitch.

## 14. Reviewer walkthrough

1. Landing → switch to Malayalam → verify layout.
2. President → Ward Ledger → sort lowest PDI → open Ward 7.
3. Ward 7 → Asset Register filtered to Ward 7 → open poor asset → inspect linked grievances.
4. Siting → select parcel `412/2` → show FAIL and reasons.
5. Budget → shift ₹50L from Ward 7 to Ward 2 → show projection and equity movement.
6. Citizen → My Plot → search `412/2` → show same parcel in plain language.
7. Citizen → Grievance → drop pin → submit → show ticket.
8. President → Hazard → show new grievance in ward hotspot panel.

## 15. Definition of done

A route is not complete merely because it renders. Its specified controls must work, data must be coherent, state transitions must be testable, loading/empty/error states must be handled, and the route must be included in the reviewer walkthrough or documented as not part of that walkthrough.

A feature must not be marked complete based only on a static mockup.
