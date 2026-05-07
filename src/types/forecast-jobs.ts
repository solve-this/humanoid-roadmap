// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript interfaces for the forecast-vs-actual and
// AI-agent-vs-human-work feature layer.
// ─────────────────────────────────────────────────────────────────────────────

/** Immutable forecast claim snapshotted at collection time. Never overwrite. */
export interface ForecastClaim {
  claim_id: string
  created_at: string // ISO date YYYY-MM-DD
  scope: 'global' | 'country' | 'industry' | 'job-task'
  subject_id: string // ISO3 for country scope, job_id for job-task scope, "global" otherwise
  forecast_horizon: 2027 | 2030 | 2035
  metric: string
  predicted_value: number
  unit: string
  direction: 'increasing' | 'decreasing' | 'stable'
  baseline_value: number
  method_version: string
  rationale_refs: string[]
}

/** Canonical source record. Required for every observed outcome. */
export interface EvidenceRecord {
  source_id: string
  publisher: string
  url: string
  published_at: string // ISO date
  source_type: 'official_stats' | 'company_filing' | 'industry_report' | 'news_article'
  accessed_at: string // ISO date
  hash: string // sha256 of content for auditability
}

/** Real-world observation linked to one or more evidence records. */
export interface ObservedOutcome {
  observation_id: string
  as_of_date: string // ISO date
  scope: 'global' | 'country' | 'industry' | 'job-task'
  subject_id: string
  metric: string
  observed_value: number
  unit: string
  source_refs: string[] // source_ids from evidence-registry
  measurement_method: string
  coverage: string
  source_confidence: 'low' | 'medium' | 'high'
  extraction_confidence: 'low' | 'medium' | 'high'
  coverage_confidence: 'low' | 'medium' | 'high'
}

/** Evaluation scoring a forecast claim against real-world observations. */
export interface ForecastEvaluation {
  claim_id: string
  evaluation_date: string // ISO date
  status: 'ahead' | 'on_track' | 'missed' | 'insufficient_evidence'
  error_abs: number | null
  error_pct: number | null
  confidence: 'low' | 'medium' | 'high' | null
  notes: string
}

// ─────────────────────────────────────────────────────────────────────────────
// AI-agent vs human work layer
// ─────────────────────────────────────────────────────────────────────────────

export type TaskType = 'physical' | 'digital' | 'coordination' | 'judgment'
export type ExecutionMode = 'fully_agent' | 'agent_assisted'
export type ConfidenceLevel = 'low' | 'medium' | 'high'

export interface JobTask {
  task_id: string
  task_name: string
  task_type: TaskType
  task_unit: string // tickets, calls, documents, picks, etc.
  automatable: boolean
}

export interface JobTaskEntry {
  job_id: string
  job_title: string
  industry: string
  tasks: JobTask[]
}

/** Atomic observation of agent and human output for a specific task. */
export interface AgentWorkObservation {
  obs_id: string
  date: string // ISO date
  employer_or_system: string
  job_id: string
  task_id: string
  agent_output_units: number
  human_output_units: number
  unit: string
  mode: ExecutionMode
  quality_metric: number | null
  sla_metric: number | null
  source_refs: string[]
  coverage: string
  method_version: string
}

/** Daily computed work-share snapshot for a job/task pair. */
export interface WorkShareSnapshot {
  date: string // ISO date
  job_id: string
  task_id: string
  agent_share: number // 0–1
  human_share: number // 0–1
  quality_adjusted_agent_share: number // 0–1
  confidence: ConfidenceLevel
}

/** Rolled-up daily summary per job across all tasks. */
export interface JobRollup {
  date: string // ISO date
  job_id: string
  agent_work_share: number // 0–1
  human_work_share: number // 0–1
  jobs_exposed: number
  jobs_displaced_estimate_low: number
  jobs_displaced_estimate_high: number
  confidence: ConfidenceLevel
}
