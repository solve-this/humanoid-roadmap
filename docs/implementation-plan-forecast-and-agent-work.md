# Implementation plan: forecast-vs-actual timeline and AI-agent-vs-human-work layer

This document is the execution tracker for the next feature set.
Use it together with `/home/runner/work/humanoid-roadmap/humanoid-roadmap/docs/data-feature-planning-memo.md`, which defines the deterministic data methodology and anti-fabrication rules.

## Objectives

1. Add a new product layer that shows **forecast vs actual development** over time, with the long-term target of making the 2035 view compare:
   - what the system estimated at an earlier date
   - what later real-world evidence showed
2. Add a second product layer for **AI-agent work in human jobs vs human work**, using deterministic evidence collected in the daily update process.
3. Keep the implementation **typesafe, schema-validated, append-only where historical truth matters, and auditable**.

## Current repo baseline

- `src/components/AdoptionForecast.tsx` already renders forecast lines for `replacementPct2027`, `replacementPct2030`, and `replacementPct2035`.
- `src/components/WorldMap.tsx` already renders a map layer keyed to `adoptionScore` and year-specific displacement tooltip values.
- `src/App.tsx` already mounts the fixed HUD, map, cost breakdown, forecast drawer, and news feed.
- `scripts/collect-all.ts` already orchestrates daily collection and writes `timeline-snapshots.json` and `last-updated.json`.
- `scripts/validate-data.ts` is the schema gate that must be extended before any new dataset can be trusted in CI.

## Workstreams

### Workstream A — historical forecast tracking

Goal: preserve each forecast as an immutable historical claim so later data can be compared against the exact estimate that was visible at the time.

#### Deliverables

- [ ] Add a new persisted artifact for forecast claims
- [ ] Capture each daily forecast snapshot without overwriting prior predictions
- [ ] Support country-level and global-level forecast claims
- [ ] Version the forecasting method/source basis used for each claim

#### Planned data artifacts

- [ ] `src/data/forecast-claims.json`
- [ ] Add build/runtime loading for the new file
- [ ] Extend validation and build verification to require the file

#### Required record shape

- [ ] Claim identifier
- [ ] Forecast creation date
- [ ] Subject scope (`global`, `country`, `industry`, `job-task`)
- [ ] Subject id (for example ISO3 when applicable)
- [ ] Forecast horizon (`2027`, `2030`, `2035`)
- [ ] Metric name and unit
- [ ] Predicted value
- [ ] Baseline value used at claim time
- [ ] Method version
- [ ] Input/evidence references used when creating the claim

### Workstream B — observed outcomes and forecast evaluation

Goal: store real-world evidence separately from forecasts, then compute the comparison layer instead of mixing assumptions and outcomes in the same dataset.

#### Deliverables

- [ ] Add an evidence registry for auditable sources
- [ ] Add observed outcomes as dated, source-linked records
- [ ] Add evaluation records that score forecast accuracy only when enough evidence exists
- [ ] Keep insufficient-evidence states explicit instead of inventing values

#### Planned data artifacts

- [ ] `src/data/evidence-registry.json`
- [ ] `src/data/observed-outcomes.json`
- [ ] `src/data/forecast-evaluations.json`

#### Rules to preserve

- [ ] Never write an "actual" value without a cited deterministic source
- [ ] Never replace older forecast claims
- [ ] Keep observations append-only except for explicit versioned corrections
- [ ] Track confidence separately from value storage

### Workstream C — AI-agent work vs human work layer

Goal: measure work share conservatively, using task evidence, not speculative "jobs replaced" headlines.

#### Deliverables

- [ ] Define a starter occupation/task catalog
- [ ] Add deterministic observation records for agent work and human work
- [ ] Produce daily work-share snapshots
- [ ] Support country/job/task rollups for the UI

#### Planned data artifacts

- [ ] `src/data/job-task-catalog.json`
- [ ] `src/data/agent-work-observations.json`
- [ ] `src/data/work-share-snapshots.json`
- [ ] `src/data/job-rollups.json`

#### Scope controls

- [ ] Start with a narrow pilot set of occupations with measurable public evidence
- [ ] Separate fully agent-executed work from agent-assisted human work
- [ ] Require explicit task units before aggregation
- [ ] Use conservative confidence/range handling when quality or coverage is incomplete

### Workstream D — daily pipeline integration

Goal: collect the new datasets in the same daily workflow without weakening reliability.

#### Deliverables

- [ ] Add new collection scripts for claims, evidence/outcomes, and job-work data
- [ ] Integrate them into `scripts/collect-all.ts` in a deterministic order
- [ ] Extend `scripts/validate-data.ts` schemas
- [ ] Extend `scripts/verify-build.ts` so new artifacts must exist in `dist/data`
- [ ] Extend `last-updated.json` metadata with counts/status for the new datasets

#### Execution order

- [ ] Run current collectors first (`news`, `countries`, `cost-model`)
- [ ] Derive forecast claims from the latest generated forecast outputs
- [ ] Derive candidate evidence/outcomes from deterministic source parsing
- [ ] Derive job-work observations and rollups
- [ ] Validate all JSON artifacts before build/deploy steps proceed

### Workstream E — UI delivery

Goal: introduce both new surfaces without destabilizing the current HUD layout.

#### Forecast-vs-actual UI

- [ ] Add a dedicated comparison surface, preferably by extending `AdoptionForecast.tsx` with a mode switch
- [ ] Support side-by-side or overlaid lines for forecast and observed/evaluated series
- [ ] Show delta, status, and confidence clearly
- [ ] Support an "insufficient evidence" state in the UI

#### AI-agent-vs-human-work UI

- [ ] Add a second layer or panel attached to the existing HUD/map architecture
- [ ] Allow toggling between current adoption map and the new work-share layer
- [ ] Show job/task rollups, not just headline totals
- [ ] Make low-confidence or partial-coverage records visually distinct

#### App integration points

- [ ] Update `src/App.tsx` orchestration and state for new view modes
- [ ] Keep `WorldMap.tsx` performant when a second dataset/layer is added
- [ ] Ensure new components degrade gracefully when datasets are empty early in rollout

### Workstream F — typing, schema, and testing

Goal: make the rollout bulletproof before any UI polish.

#### Types and schema

- [ ] Add explicit TypeScript interfaces for every new JSON artifact
- [ ] Keep validation ranges/enums strict in `scripts/validate-data.ts`
- [ ] Add cross-reference validation where ids must match other datasets

#### Unit tests

- [ ] Add schema tests for every new artifact
- [ ] Add collector tests for deterministic parsing and fallback behavior
- [ ] Add tests for append-only historical writes
- [ ] Add tests for insufficient-evidence and low-confidence states

#### UI tests

- [ ] Add component tests for forecast-vs-actual rendering
- [ ] Add component tests for the AI-agent-vs-human-work layer
- [ ] Add e2e coverage for mode switching, tooltips, and empty-data handling

#### Required validation commands

- [ ] `npm run test:unit`
- [ ] `npm run build`
- [ ] `npm run test:e2e`
- [ ] `npm run verify-build`

## Suggested phased rollout

### Phase 1 — foundations

- [ ] Finalize schemas and interfaces for all new artifacts
- [ ] Add empty validated files and build verification coverage
- [ ] Add immutable forecast claim generation from current forecast output

### Phase 2 — evidence backbone

- [ ] Add evidence registry and observed outcomes pipeline
- [ ] Store only source-linked, auditable records
- [ ] Keep evaluation output disabled until evidence coverage is acceptable

### Phase 3 — AI-agent work pilot

- [ ] Launch a pilot occupation/task catalog
- [ ] Collect conservative work-share observations
- [ ] Produce initial job rollups with confidence flags

### Phase 4 — UI surfacing

- [ ] Expose forecast-vs-actual mode in the forecast UI
- [ ] Expose AI-agent-vs-human-work layer in the map/HUD
- [ ] Add empty/loading/insufficient-evidence states

### Phase 5 — hardening

- [ ] Expand test coverage
- [ ] Verify backward compatibility with current JSON consumers
- [ ] Audit CI behavior and build artifact integrity
- [ ] Re-check all anti-fabrication safeguards before broadening scope

## Acceptance criteria

- [ ] Every new stored metric is reproducible from stored source references or deterministic formulas
- [ ] Historical forecast claims remain immutable after first write
- [ ] "Actual" values are never fabricated from news-only wording
- [ ] New datasets fail CI if schema validation breaks
- [ ] The UI can render partial-history states safely
- [ ] The daily update process can collect, validate, build, and verify all new artifacts end-to-end

## Out of scope for the first implementation

- [ ] Full global occupation coverage
- [ ] Non-auditable vendor marketing claims as primary evidence
- [ ] Precision scoring when evidence quality is weak
- [ ] Retroactive rewriting of prior forecasts to make them fit later outcomes
