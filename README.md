# Grama Panchayat Digital Twin Demo Portal (Web + Mobile PWA)

> **Demo Identity Notice:**  
> **Panchayat:** Thekkumpuram Grama Panchayat (തെക്കുംപുരം ഗ്രാമപഞ്ചായത്ത്) — *Demo data — fictional panchayat (Thekkumpuram, Kozhikode). Not connected to live government systems.*  
> **District:** Kozhikode · **Assembly Constituency:** Kunnamangalam · **Wards:** 14  
> **Population:** 28,450 · **Households:** 6,820 · **Area:** 32.4 sq km  
> **Last verified stamp:** `2026-10-30`

---

## 1. Project Overview & Pitch

> *"This is a working Grama Panchayat Digital Twin demo for a fictional Kozhikode panchayat, built entirely on mock data modelled on the public sources we mapped — KSDI, Sanchaya, Ente Bhoomi, ReLIS, eGramSwaraj, PDI, KSDMA. Click any card to see which public source it corresponds to."*

The portal provides an end-to-end responsive web application and Progressive Web App (PWA) demonstrating spatial digital twin governance for two primary roles:
1. **Panchayat President:** Executive monitoring, ward ledgers, GPDP equity analysis, statutory siting compliance checker, public asset health, flood vulnerability, promise delivery tracking, and budget simulation.
2. **Normal Citizen:** Cadastral parcel inspection (My Plot), automated "Can I Build Here?" compliance checks, nearest emergency and public service finder, ward works transparency, hazard evacuation navigation, and spatial grievance reporting.

---

## 2. Setup & Execution Instructions

### Prerequisites
- Node.js `v18+` or `v20+` (tested on Node v24)
- npm `v10+`

### Installation
```bash
# Clone or navigate to the repository
cd C:\Coding\Projects\AICM

# Install dependencies
npm install
```

### Running Locally (Development Mode)
```bash
npm run dev
# The application will start at http://localhost:3000
```

### Running Production Build & Verification
```bash
# Compile and test production build
npm run build

# Start production server
npm run start
```

### Running Test Suite
```bash
npm run test
```

---

## 3. Reviewer's 8-Minute Scripted Walkthrough

Follow this scripted 8-step path to verify the full functional loop:

1. **Landing Page (`/`):**
   - Click the **മലയാളം** language toggle in the top-right header.
   - Confirm all text across headers, hero, and demographic badges renders in clean Noto Sans Malayalam with zero layout clipping or horizontal overflow.
   - Switch back to English or continue in Malayalam.

2. **President Ward Ledger (`/president/wards`):**
   - Click **Enter as Panchayat President** or navigate to `/president/wards`.
   - Click the **PDI Score** column header to sort ascending.
   - Locate **Ward 7 (Cheruvannur)** with the lowest PDI score (61.8).
   - Click the Ward 7 row to open the 4-stage lifecycle drawer displaying the complete chain: `1. Promise (GPDP) → 2. Spend (Treasury) → 3. Asset (Delivery) → 4. Outcome (PDI Metric)`.

3. **Asset Health & Grievance Correlation (`/president/assets`):**
   - In the Ward 7 detail drawer, click **Filter Ward 7 Assets** (or navigate to `/president/assets?ward=7`).
   - Notice the assets filtered to Ward 7.
   - Click a **Poor** condition asset (e.g., Water Tank).
   - In the asset detail drawer, inspect the linked citizen grievances matching Ward 7 (e.g. drinking water pipeline leak).

4. **Plan Siting Compliance Checker (`/president/siting`):**
   - Navigate to `/president/siting`.
   - Select Ward 7 (Cheruvannur) and select parcel **412/2**.
   - Verify the deterministic **FAIL** verdict.
   - Inspect the statutory reasons: (a) *Kerala Conservation of Paddy Land & Wetland Act — Classified as Nilam*, (b) *Building rules road setback breach (< 3m)*, and (c) *KSDMA High Flood Inundation Zone constraint*.
   - Verify that the parcel polygon renders highlighted in red over the KSDMA flood hazard overlay on the Leaflet map.

5. **Budget Simulation Sandbox (`/president/budget`):**
   - Navigate to `/president/budget`.
   - Shift **₹50 Lakhs** from **Ward 7 (Cheruvannur)** to **Ward 2 (Padinjarekkara)**.
   - Observe the live mathematical recalculation:
     - Formula: `new_pdi = old_pdi + 0.3 * (delta_spend / population * 1000)`
     - Ward 2 PDI increases dynamically by `+7.0 pts` from 64.2 to 71.2.
     - Total Panchayat budget remains **100% conserved** (exact fiscal neutrality).
     - District average changes deterministically.

6. **Citizen "My Plot on the Map" (`/citizen/plot`):**
   - Use the global role switch dropdown in the top bar to switch to **Normal Citizen**.
   - Open `/citizen/plot` and search for survey number **412/2**.
   - Notice how the exact same parcel from President Siting is translated into plain citizen language: red Nilam pill, permitted agricultural activities, and building restrictions.

7. **Citizen Grievance Geo-tagging (`/citizen/grievance`):**
   - Navigate to `/citizen/grievance`.
   - Select category "Road Damage / Potholes" in Ward 7.
   - Enter a description and tap the map to drop a pin.
   - Click **Submit Grievance**; receive a unique tracking ticket (e.g., `TK-2026-XXXX`).
   - Click **See it on President Hazard Map**.

8. **President Hazard Continuity Verification (`/president/hazard`):**
   - In `/president/hazard`, inspect the **Live Ward Incident & Grievance Hotspots** panel.
   - Confirm that the newly submitted grievance ticket is immediately visible, demonstrating live shared state across roles.

---

## 4. Screen-to-AICM Mapping Table

The table below documents how all 18 routes map across the complete AICM hierarchy:
`Government Data Source → Digital Twin Layer (L1–L8) → Delivery Module (M1–M8) → User-Facing Feature`.

| Route | Screen / View Name | Feature ID | Public Data Source | Twin Layer | AICM Delivery Module | Feature Description & Traceability |
|---|---|---|---|---|---|---|
| `/` | Portal Landing & Role Selector | L0 | KSDI / PDI Portal / eGramSwaraj | L1 / L6 | Shared | Bilingual landing, role switch, demo banner, statutory links, and 8-minute walkthrough. |
| `/president` | President Executive Dashboard | P0 | PDI Portal / eGramSwaraj / KSDI | L1 / L6 | M1 Governance / M8 Finance | 6 KPI metrics, spend by ward bar chart, PDI vs district average chart, Phase 2 previews. |
| `/president/wards` | Ward Plan–Spend–Asset–Outcome Ledger | P1 | PDI / eGramSwaraj / Sanchaya | L6 Plan & Finance | M1 Governance Ledger | 14-ward sortable table; drawer with 4-stage lifecycle timeline (promise → spend → asset → outcome). |
| `/president/equity` | GPDP Gap & Equity Analyser | P2 | PDI Portal / eGramSwaraj / DES | L6 Plan & Finance | M1 Governance / M5 Wellbeing | Scatter chart (PDI vs Per-Capita spend); 4 quadrant flags explaining under-served vs well-served wards. |
| `/president/siting` | Plan Siting Compliance Checker | P3 | Ente Bhoomi / ReLIS / KSDMA | L2 Cadastral / L7 Risk | M3 Land & Statutory | Evaluates Nilam, flood_high, and setback rules; returns PASS/CONDITIONAL/FAIL; shows Leaflet polygon. |
| `/president/assets` | Asset Health Register | P4 | Sanchaya (IKM) / PWD GeoJSON | L3 Built Environment | M2 Asset & Infrastructure | Filterable asset table (ward, type, condition); detail drawer with map pin and linked ward grievances. |
| `/president/hazard` | Vulnerability & Evacuation Twin | P5 | KSDMA / KILA DMP / CMO Grievance | L7 Risk & Resilience | M4 Disaster & Resilience | Leaflet map with flood polygons, assets at risk, shelters, Orange Book checklist, live hotspot feed. |
| `/president/promises` | Promise-vs-Delivery Tracker | P6 | eGramSwaraj / Samvedhitha | L6 Plan & Finance | M1 Governance Ledger | 3-column traffic light board (completed, ongoing, delayed); shows overdue days and budget execution. |
| `/president/budget` | Budget Simulation Sandbox | P17 | eGramSwaraj / PDI Portal | L6 Plan & Finance | M8 Planning & Finance | Inter-ward capital reallocation slider; live formula calculation for projected PDI and district average. |
| `/citizen` | Citizen Governance Dashboard | C0 | PDI / eGramSwaraj / KSDI | L4 Socio-Demo / L6 | M6 Citizen Interface | Ward 7 Cheruvannur scorecard; 4 primary action cards (My Land, Build Check, Services, Grievance). |
| `/citizen/plot` | My Plot on the Map | C1 | Ente Bhoomi / ReLIS / KSDI | L2 Cadastral | M3 Land & Statutory | Survey number search (default 412/2); shows boundary polygon, Nilam/Purayidom pill, permitted activities. |
| `/citizen/build-check` | "Can I Build Here?" Checker | C2 | Ente Bhoomi / ReLIS / Sanketham | L2 Cadastral / L3 Built | M3 Land & Statutory | Reuses shared siting engine; returns PASS / NEEDS APPROVAL / NOT PERMITTED; links to My Plot. |
| `/citizen/facilities` | Nearest Facility Finder | C3 | UDISE+ / DES / e-Health | L5 Service Infrastructure | M5 Social Well-being | Map centred on Ward 7; filters schools, health, anganwadi, akshaya, krishi; lists distance & staff filling. |
| `/citizen/ward` | What Was Built in My Ward | C4 | eGramSwaraj | L6 Plan & Finance | M1 / M6 Interface | 8 recent Ward 7 GPDP projects with status, budget, expenditure, photo verification, and all-wards toggle. |
| `/citizen/hazard` | Hazard Risk & Evacuation | C5/C6 | KSDMA / KILA DMP / OSM | L7 Risk & Resilience | M4 Disaster & Resilience | Address risk evaluator (HIGH/MEDIUM/LOW); map pin, flood polygon, nearest shelter and evacuation route. |
| `/citizen/grievance` | Spatial Grievance Geo-tagging | C11 | CMO Grievance Portal / Local Demo | L3 / L6 Overlay | M6 Citizen Interface | Category, description, local photo attachment, interactive pin drop; registers ticket and persists state. |
| `/shared/assets` | Public Asset Register (Shared) | S1 | Sanchaya / IKM | L3 Built Environment | M2 Asset & Infrastructure | Read-only version of the asset inventory; filterable by ward and condition without maintenance edit actions. |
| `/shared/ward/[id]` | Ward Dashboard (Shared) | S2 | PDI Portal / eGramSwaraj | L4 Socio-Demo / L6 | M1 / M6 Interface | Merged President and Citizen ward scorecard with role-sensitive toggle showing/hiding capital ratios. |

---

## 5. Feature Coverage vs Deferred Roadmap

### Fully Implemented in Phase 1 MVP
- [x] All 18 enumerated routes and screens with mobile-first responsive layouts (375px, 768px, 1280px).
- [x] Full bilingual localization (English & Noto Sans Malayalam) persisting in localStorage.
- [x] Role switching between Panchayat President and Normal Citizen.
- [x] 10 deterministic mock datasets in `/data` with 100% mathematical and relational integrity.
- [x] Deterministic Siting & Build-check rule engine (Nilam restriction, flood zone, road setback breach).
- [x] Budget Simulation sandbox conserving 100% of Panchayat capital.
- [x] Haversine geographic facility distance calculation.
- [x] Spatial grievance geo-tagging persisting in localStorage demo state and propagating to President views.
- [x] Progressive Web App (PWA) manifest, service worker caching, and offline fallback messaging.
- [x] Public source chips matching dataset metadata and static `Last verified: 2026-10-30` stamps.
- [x] Dismissible persistent demo-data disclaimer banner.

### Deferred to Phase 2 (Roadmap Placeholders)
- **AI Conversational Citizen Assistant:** Multilingual voice/chat bot.
- **Predictive Hydro-Flood Sensor Grid:** Real-time IoT river gauges and radar nowcasting.
- **Constituency Industrial & MSME Intelligence:** Factory cluster metrics and patent innovation tracking.
- **Live Government API Adapters:** Real integration with live government portals once authorized.

---

## 6. Assumptions & Governance Notes

1. **Fictional Panchayat:** Thekkumpuram Grama Panchayat is a synthetic demonstration entity located in Kozhikode district, Kunnamangalam constituency.
2. **Deterministic Seed Data:** All population numbers (28,450), household counts (6,820), 14 ward centroids, and GPDP expenditure totals are deterministic constants.
3. **Local Demo Persistence:** Citizen grievances submitted in the browser are persisted in browser-local `localStorage` (`aicm-demo-state-v1`). Photo uploads remain local to the client browser and are never uploaded to an external server.
4. **Offline Map Behavior:** OpenStreetMap raster tiles require network access on first fetch; if network connectivity is lost, the application shell, routes, data tables, and textual workflows remain fully operational, and the map displays an offline boundary fallback notice.
