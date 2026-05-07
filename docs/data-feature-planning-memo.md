# Planning memo: deterministic data roadmap for 2035 retrospective + agent-vs-human work layer

## Working assumptions from the current repo
- Keep the existing **deterministic / no-external-AI** collection rule: only ingest reproducible primary or structured sources; never use LLM summaries as evidence.
- Extend the current pattern of **dated snapshots** (`timeline-snapshots.json`) and **schema-validated JSON artifacts**.
- Treat the daily news scan as a **signal index**, not as truth by itself; conclusions require source-backed evidence records.

## Capability A — 2035 page/view: “forecast made then” vs “what actually happened”

### Goal
Show, for each forecast claim logged today, how later real-world evidence did or did not match it by 2035 (or the latest available date before 2035).

### Recommended data model
1. `forecast_claims.json`
   - `claim_id`, `created_at`, `scope` (global/country/industry/job-task), `subject_id`
   - `forecast_horizon` (2027/2030/2035), `metric`
   - `predicted_value`, `unit`, `direction`, `baseline_value`, `method_version`
   - `rationale_refs[]` (ids of deterministic inputs used when claim was created)
2. `observed_outcomes.json`
   - `observation_id`, `as_of_date`, `scope`, `subject_id`, `metric`
   - `observed_value`, `unit`, `source_refs[]`, `measurement_method`, `coverage`
3. `forecast_evaluations.json`
   - `claim_id`, `evaluation_date`, `status` (`ahead`, `on_track`, `missed`, `insufficient_evidence`)
   - `error_abs`, `error_pct`, `confidence`, `notes`
4. `evidence_registry.json`
   - canonical source metadata: `source_id`, `publisher`, `url`, `published_at`, `source_type`, `accessed_at`, `hash`

### Collection strategy
- On each collection run, snapshot any displayed forecast into `forecast_claims.json`; never overwrite prior predictions.
- Parse daily news into **candidate events** only when an article links to or clearly cites a primary source (earnings call, company release, regulator filing, labor report, plant deployment, layoffs/hiring notice, government stats).
- Require a second pass that converts candidate events into `observed_outcomes` only if metric extraction is deterministic and source-linked.
- Prefer structured sources for final outcome metrics: company fleet counts, IFR/ILO/BLS/OECD/statistical agencies, public filings, wage/employment tables.

### Evidence requirements
- A forecast-vs-actual comparison must cite **at least one primary/official source**.
- News-only evidence may create a `candidate_event`, but cannot finalize an `observed_outcome`.
- Every numeric observation must store exact quoted figure, unit, date, and source URL.
- If evidence is qualitative only, encode status as milestone/event, not a fabricated numeric proxy.

### Confidence / uncertainty
- Keep separate fields for:
  - `source_confidence` (credibility of source type)
  - `extraction_confidence` (how directly the metric was stated)
  - `coverage_confidence` (how representative the source is)
- Show uncertainty bands or categorical states when data is partial; never imply precision beyond the source.
- Default evaluation state: `insufficient_evidence` unless enough evidence exists to score the claim.

### Backfill strategy
- Seed `forecast_claims.json` from the current 2027/2030/2035 forecast outputs and timeline snapshots.
- Backfill `observed_outcomes` from existing news history only where linked primary sources can still be retrieved.
- Do not infer historical “actuals” from article wording alone; unresolved items remain unscored.

## Capability B — new data layer: AI-agent work done in human jobs vs human jobs

### Goal
Measure **work share by task**, not “jobs replaced” as a binary. Compare how much economically relevant work is performed by AI agents versus humans inside existing occupations.

### Recommended data model
1. `job_task_catalog.json`
   - `job_id`, `job_title`, `industry`, `task_id`, `task_name`, `task_type` (`physical`, `digital`, `coordination`, `judgment`)
   - `task_unit` (tickets, calls, documents, hours, orders, lines inspected, etc.)
2. `agent_work_observations.json`
   - `obs_id`, `date`, `employer_or_system`, `job_id`, `task_id`
   - `agent_output_units`, `human_output_units`, `unit`
   - `quality_metric`, `sla_metric`, `source_refs[]`, `coverage`, `method_version`
3. `work_share_snapshots.json`
   - `date`, `job_id`, `task_id`, `agent_share`, `human_share`, `quality_adjusted_agent_share`, `confidence`
4. `job_rollups.json`
   - `date`, `job_id`, `agent_work_share`, `human_work_share`, `jobs_exposed`, `jobs_displaced_estimate_range`

### Collection strategy
- Start with a small deterministic universe of occupations where public operational metrics exist (customer support, software QA, document review, warehouse picking, inspection, scheduling).
- Measure **task output units** from reproducible evidence: company disclosures, benchmark results tied to real tasks, service volume reports, regulator data, public case studies with exact counts.
- Normalize work into task-native units first; only then aggregate to job-level share using explicit task weights.
- Separate **agent-assisted human work** from **fully agent-executed work** with a required mode flag.

### Evidence requirements
- Count agent work only when the source states a concrete quantity or a derivable numerator/denominator.
- Require quality guardrails: if the source reports throughput without quality/error/SLA context, mark as low confidence and exclude from headline rollups.
- Do not convert seat reductions, layoffs, or vendor marketing claims directly into “agent work done” without task-output evidence.

### Confidence / uncertainty
- Publish ranges when task weights are approximate.
- Keep three distinct unknowns: missing task weights, missing output counts, and missing quality adjustment.
- Headline metric should be conservative: `quality_adjusted_agent_share`.

### Backfill strategy
- Build the catalog first, then backfill observations by occupation from public archives and existing news records.
- Backfill only where task definitions and units are stable across time; otherwise start a fresh series from the first clean observation date.

## Anti-fabrication rules (apply to both capabilities)
- No LLM-generated facts, summaries, estimates, or labels in stored datasets.
- No numeric interpolation unless the formula is explicit, versioned, and reproducible from stored inputs.
- No “actual” value without a cited source record.
- No silent overwrites of prior forecasts or observations; append versioned records.
- Preserve raw quotes/snippets used for extraction so every metric is auditable.
- If evidence is ambiguous, store the ambiguity; do not resolve it by guesswork.

## Suggested rollout order
1. Add schemas + empty artifacts for `forecast_claims`, `observed_outcomes`, `evidence_registry`.
2. Start appending immutable forecast claims from current outputs.
3. Add deterministic event/evidence extraction from the daily news pipeline.
4. Launch one pilot occupation set for agent-vs-human work share.
5. Only after 2–3 months of clean history, build the 2035 comparison view and headline work-share rollups.
