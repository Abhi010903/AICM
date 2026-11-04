# Security, Privacy and Data-Integrity Requirements
## Constituency Digital Twin Demo Portal — AICM

**Security posture:** Low-risk local demonstration, not a production government service.  
**Critical rule:** Do not represent this demo as a secure, authenticated, authoritative or live government system.

---

## 1. Security objectives

- Prevent accidental connection to real government systems.
- Avoid collecting or transmitting real citizen personal information.
- Keep grievance photos and demo submissions local to the browser.
- Prevent the UI role selector from being mistaken for real authorization.
- Protect application integrity against malformed demo input.
- Clearly disclose fictional data and non-authoritative outputs.
- Avoid introducing unnecessary third-party services or dependencies.

## 2. Explicit security boundaries

This version has:
- No real authentication.
- No real authorization.
- No backend or database.
- No government API integration.
- No server-side grievance persistence.
- No real citizen identity verification.
- No production incident monitoring.

The President/Citizen role switch is a presentation/navigation convenience only. It must never be described as access control. Do not place secrets or privileged operations behind a client-side role check.

## 3. Data classification and handling

| Data category | Demo handling |
|---|---|
| Panchayat/ward metrics | Fictional static data |
| Land parcel data | Fictional geometry and attributes |
| Assets/facilities/projects | Fictional static data |
| Grievances | Fictional seed data and local-only demo submissions |
| Photos | Browser-local preview only; no upload |
| Language preference | localStorage |
| Demo state | localStorage |
| Secrets/API keys | None permitted in this demo |

Never ask a reviewer to enter real Aadhaar numbers, phone numbers, addresses, survey-owner names, health information or other personal data.

Use synthetic names and synthetic contact details in demo records. If a contact field is needed for a shelter, use clearly fictional placeholder data.

## 4. Network restrictions

- No requests to government portals or APIs.
- No hidden external data fetches.
- No analytics, telemetry, trackers or error-reporting SDKs.
- No external storage upload for photos.
- External network exceptions allowed by the supplied prompt: OpenStreetMap tiles, Google Fonts and the app's own static assets.
- Prefer self-hosted/local font assets if available and compatible; otherwise document the Google Fonts dependency.
- Keep the app usable when external tile/font requests fail.
- Do not add remote scripts or services without explicit approval.

A developer/test should inspect browser network activity and confirm that no government data endpoint is contacted.

## 5. Input validation

Validate and constrain all user-controlled values:
- Survey number: trim, length limit, permitted characters; do not interpolate into HTML or URLs unsafely.
- Description: required, length limit, render as text.
- Category: allow only enumerated values.
- Map coordinates: finite numbers and within valid latitude/longitude ranges.
- Ward ID: must exist in the seed dataset.
- Parcel ID: must resolve to a known parcel.
- Building type: allow only configured enum values.
- Budget slider: finite value, bounded range, preserve total allocation.
- File upload: allow only expected image MIME types, enforce a modest size limit, do not upload or persist large base64 files unnecessarily.

Never trust values from localStorage; parse defensively, validate schema/version and recover to seed state if malformed.

## 6. XSS and rendering safety

- Render user-entered descriptions as text, never as raw HTML.
- Do not use `dangerouslySetInnerHTML` for user-controlled or dataset-controlled strings.
- Avoid dynamic script evaluation.
- Validate/escape any values used in attributes, query parameters or generated markup.
- Use framework defaults and avoid bypassing built-in escaping.

## 7. Browser storage

- Store only the minimum demo state required.
- Use a versioned storage key.
- Handle unavailable, blocked or malformed localStorage gracefully.
- Do not store passwords, tokens, identity documents or sensitive personal information.
- Photo data should remain transient/local; do not persist it unless explicitly required and reviewed.
- Reset Demo must clear only this application's demo keys, not unrelated site storage.
- Explain that localStorage is browser-local and does not synchronize across devices or users.

## 8. Role and authorization disclaimer

Because roles are selected by the user and no authentication exists:
- Do not call the President view “secured”.
- Do not imply that citizens are prevented from viewing administrative routes.
- Do not expose real confidential data.
- Do not implement hidden privileged API calls.
- Clearly mark all roles and actions as demo-only.

## 9. Geospatial and public-safety disclaimers

- Panchayat identity and geographic demo data are fictional.
- Hazard overlays are illustrative and must not be used for emergency decisions.
- Evacuation routes and shelter details are illustrative.
- Siting/build-check results are not legal advice, permits, approvals or authoritative land-use determinations.
- PDI/budget projections are illustrative and not validated predictive models.
- Show clear disclaimers adjacent to high-impact outputs, not only in README.

## 10. Dependency and configuration hygiene

- Use only dependencies needed for the specified stack and required behavior.
- Do not introduce packages with unclear provenance or unnecessary permissions.
- Do not commit `.env` files, credentials, tokens or private keys.
- No secrets are expected in this demo. If a future integration requires credentials, it must be separately approved and designed outside this demo.
- Keep lockfile changes intentional and review package scripts before adding dependencies.

## 11. Error handling and resilience

- Do not expose stack traces or internal paths in the UI.
- Provide user-readable error states.
- Handle malformed local data and missing records safely.
- Do not silently turn failed data reads into plausible-looking fabricated values.
- Log only non-sensitive development diagnostics; no third-party logging service.
- Ensure reset and offline behavior do not leave the app in a corrupted partial state.

## 12. Security verification checklist

Before demo handoff:
- [ ] Confirm no government API calls in browser network log.
- [ ] Confirm no analytics/tracker/error-reporting service.
- [ ] Confirm no secrets or `.env` credentials in repository.
- [ ] Confirm role switch is clearly demo-only and not represented as authentication.
- [ ] Confirm grievance photo is not uploaded.
- [ ] Confirm user-entered descriptions render as text.
- [ ] Confirm invalid survey number, ward, coordinates and form fields are handled safely.
- [ ] Confirm malformed localStorage recovers safely.
- [ ] Confirm Reset Demo clears only app-owned keys and restores seed state.
- [ ] Confirm hazard, evacuation, land and budget outputs carry non-authoritative demo disclaimers.
- [ ] Confirm fictional data banner is visible on all required routes.
