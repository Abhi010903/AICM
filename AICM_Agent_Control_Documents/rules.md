# Engineering and Product Rules
## Agent Guardrails for the AICM Digital Twin Demo

**This document is normative.** AI coding agents and developers must follow these rules. If a requested change conflicts with this file or `PRD.md`, stop and request explicit product-owner approval rather than silently changing scope.

---

## 1. Source-of-truth order

When instructions appear to conflict, follow this order:

1. Explicit latest instruction from the product owner in the current task.
2. `PRD.md` for product scope and acceptance criteria.
3. `architecture.md` for technical structure and boundaries.
4. `rules.md` for implementation constraints and domain behavior.
5. `security.md` for security and privacy constraints.
6. The supplied AICM build prompt and Public Data & API Map as source references.

Do not infer permission to expand scope from an example, library capability, agent suggestion or generated code.

## 2. Scope lock

- Build only the routes, features and behavior listed in `PRD.md`.
- Do not add Phase 2 features.
- Do not add real authentication, backend, database or government API integration.
- Do not add AI chat, predictive flood models, industrial intelligence, innovation index, analytics, trackers or PDF export.
- Do not add features merely because an AI agent thinks they would be useful.
- Do not remove or simplify an explicitly required feature without approval.
- Do not change the named Panchayat, ward count, ward names, population, households or area.
- Do not change the required technology stack without approval.

## 3. Data rules

- All data is fictional demo data until actual datasets are formally supplied and authorized.
- Never fabricate a claim that a record came live from a government portal.
- Use deterministic seed data. No random regeneration during renders or reloads.
- Keep all entity relationships valid.
- Keep ward aggregates consistent with their underlying records, or document a deliberate mock assumption.
- Use stable IDs and explicit source metadata.
- Include bilingual `_en` and `_ml` values for displayed names.
- Do not silently substitute real geographic coordinates or present fictional polygons as official boundaries.
- Keep `412/2` as the scripted demonstration parcel and make its configured rules produce the required FAIL result.
- President and Citizen views must read the same parcel and compatible shared rule logic.
- New grievances must appear in the shared local demo state across routes and persist through navigation/reload in the same browser.
- Reset Demo must restore the deterministic initial state.

## 4. Source traceability rules

Every relevant data-driven feature must identify:
- Public source label.
- Twin layer (L1–L8).
- Delivery module (M1–M8).
- Feature ID/name.
- Demo/simulated data status.
- `Last verified: 2026-10-30` label where required.

A source chip means the demo schema is modeled on or intended to use that named source. It does not mean data was retrieved from the source.

Do not claim that all 24 sources are integrated. The prototype has mock datasets and selected source labels.

## 5. Domain rules

### Ward ledger
- Display all 14 wards.
- Sort using actual numeric values, not formatted strings.
- Ward detail timeline must show promise → spend → asset → outcome.
- Aggregates must reconcile with the seed datasets or be clearly marked as illustrative.

### Equity analyser
- X-axis is PDI score.
- Y-axis is per-capita spend.
- Use the quadrant labels/interpretation specified in the PRD/build prompt.
- Clicking a point must identify the ward and explain the configured flag.
- Do not imply that spending caused a PDI score.

### Siting compliance
Implement only the configured demo checks:
- Parcel touches/is classified as Nilam → FAIL.
- Parcel is inside `flood_high` → CONDITIONAL, unless a higher-priority FAIL rule also applies.
- Road setback breach (`road_setback_ok === false`) → FAIL.

Priority when multiple rules apply:
1. Any FAIL rule → overall FAIL.
2. Otherwise, any CONDITIONAL rule → overall CONDITIONAL.
3. Otherwise → PASS.

Show every triggered reason, not only the highest-priority verdict. Do not describe this as legal approval or a complete regulatory engine.

### Citizen build check
- Reuse the same parcel lookup and shared rule engine as President siting.
- Translate the verdict into citizen wording: PASS / NEEDS APPROVAL / NOT PERMITTED.
- Do not create a second, divergent set of land rules.
- Clearly state that the result is a demo pre-check, not official permission.

### Assets and grievances
- Asset filters must work by ward, type and condition.
- Asset detail must show related grievances using ward and relevant category/asset association where available.
- Do not associate every grievance in a ward with every asset. Use explicit relation/category logic and explain the matching basis.
- Shared asset register is read-only.

### Hazard and evacuation
- Hazard levels are demo classifications based on the bundled polygons/rules.
- Assets at risk must be computed from the same hazard geometries displayed on the map.
- Preview route must use one of the bundled evacuation route features.
- Shelter distance and route are illustrative.
- Do not present the demo as an emergency warning or operational evacuation service.

### Promise tracker
- Show projects grouped by completed, ongoing and delayed.
- Show budget and spent values.
- Calculate overdue days using an injected/reference date or fixed demo date so the demo is deterministic.
- Do not let a delayed project have negative overdue days.

### Budget simulation
Use the exact illustrative formula from the supplied prompt:

```text
new_pdi = old_pdi + 0.3 * (delta_spend / population * 1000)
```

- Cap the result at 100.
- Clamp to a minimum of 0.
- Use the sign of `delta_spend` consistently: receiving ward positive, funding ward negative.
- Update per-capita spend and chart/quadrant position from the same simulated allocation state.
- Do not mutate the original seed data.
- Show that this is an illustrative mock projection, not a validated forecast.
- Ensure total Panchayat budget remains conserved when shifting funds between two wards.

### Facility finder
- Calculate distance using a documented geographic distance function (e.g. Haversine).
- Use the selected/default Ward 7 centroid as the origin unless the user explicitly selects another supported demo location.
- Display distance units consistently.
- Handle missing coordinates safely.

### Grievance
- Validate required category, description and map location.
- Photo remains local; do not upload it.
- Generate a unique-enough demo ticket ID without exposing personal information.
- Initial status is OPEN.
- New grievance is visible in President-facing ward/hotspot views through shared demo state.
- Do not claim that a real government department received or assigned the grievance.

## 6. UX and interaction rules

- No dead buttons, fake links or controls that do nothing.
- Every control must have a meaningful action or be clearly disabled with an explanation.
- All forms need validation and visible success/error feedback.
- All lists need loading, empty and error states.
- Confirm destructive/reset actions.
- Avoid alert-only interactions when an in-app status/dialog is practical.
- Preserve user context when navigating between related screens (e.g. selected ward or parcel) where practical.
- Role switch and language toggle must be available globally.
- Mobile bottom navigation must have no more than five items.
- No page-level horizontal overflow at target widths.

## 7. Internationalization rules

- All visible UI strings must use translation keys.
- No hardcoded user-facing English strings in components.
- Include English and Malayalam for labels, navigation, validation, chart labels, legends, status names, dialogs, empty/loading states and action feedback.
- Preserve proper names, dataset source names and technical identifiers where translation would be misleading.
- Apply Noto Sans Malayalam in Malayalam mode.
- Check for missing translation keys in development/tests.

## 8. Code quality rules

- TypeScript strictness should be retained; do not use `any` to bypass type errors.
- Avoid duplicate business logic.
- Keep components focused and reusable.
- Keep calculations/rules outside JSX.
- Do not suppress lint/type errors without documenting and justifying the reason.
- Do not add speculative abstractions or unnecessary dependencies.
- Do not rewrite unrelated files.
- Do not change package versions or configuration without need and explicit explanation.
- Do not leave TODOs for required functionality.
- Do not claim tests passed unless they were actually run.
- Do not claim a route works without exercising its key interaction.

## 9. Required completion report for every agent task

At the end of each implementation task, report:

1. Files created/modified.
2. Requirements implemented (with route/feature IDs).
3. Tests/checks run and their actual results.
4. Known limitations or unverified behavior.
5. Any deviation from these documents (must be zero unless approved).
6. Next smallest implementation step.

If a requirement is ambiguous, choose the smallest interpretation consistent with these documents and record the assumption. If ambiguity affects safety, data meaning, route scope or architecture, ask before implementing.
