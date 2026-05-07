import Ajv from 'ajv'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ajv = new Ajv()

const newsSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['id', 'title', 'url', 'source', 'publishedAt', 'keywords', 'relevanceScore', 'sentiment'],
    properties: {
      id: { type: 'string' }, title: { type: 'string' }, url: { type: 'string' },
      source: { type: 'string' }, publishedAt: { type: 'string' },
      keywords: { type: 'array', items: { type: 'string' } },
      relevanceScore: { type: 'number', minimum: 0, maximum: 1 },
      sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
    },
  },
}

const countriesSchema = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['iso3', 'name', 'lat', 'lng', 'robotDensity', 'minWage', 'manufacturingShare', 'energyCostKWh', 'adoptionScore'],
    properties: {
      iso3: { type: 'string', minLength: 3, maxLength: 3 }, name: { type: 'string' },
      lat: { type: 'number' }, lng: { type: 'number' },
      robotDensity: { type: 'number', minimum: 0 }, minWage: { type: 'number', minimum: 0 },
      manufacturingShare: { type: 'number', minimum: 0 }, energyCostKWh: { type: 'number', minimum: 0 },
      adoptionScore: { type: 'number', minimum: 0, maximum: 100 },
    },
  },
}

const costModelSchema = {
  type: 'object',
  required: ['global', 'countries'],
  properties: {
    global: {
      type: 'object', required: ['human', 'robot'],
      properties: {
        human: { type: 'object', required: ['foodPerDay', 'waterPerDay', 'housingPerDay', 'healthcarePerDay', 'trainingPerDay', 'managementOverhead'] },
        robot: { type: 'object', required: ['hardwarePrice', 'amortizationYears', 'kWhPerDay', 'maintenancePctPerYear', 'cloudInferencePerDay', 'solarOffsetPct'] },
      },
    },
    countries: { type: 'object' },
  },
}

const forecastClaimsSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['claim_id', 'created_at', 'scope', 'subject_id', 'forecast_horizon', 'metric', 'predicted_value', 'unit', 'direction', 'baseline_value', 'method_version', 'rationale_refs'],
    properties: {
      claim_id: { type: 'string' },
      created_at: { type: 'string' },
      scope: { type: 'string', enum: ['global', 'country', 'industry', 'job-task'] },
      subject_id: { type: 'string' },
      forecast_horizon: { type: 'number', enum: [2027, 2030, 2035] },
      metric: { type: 'string' },
      predicted_value: { type: 'number' },
      unit: { type: 'string' },
      direction: { type: 'string', enum: ['increasing', 'decreasing', 'stable'] },
      baseline_value: { type: 'number' },
      method_version: { type: 'string' },
      rationale_refs: { type: 'array', items: { type: 'string' } },
    },
  },
}

const evidenceRegistrySchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['source_id', 'publisher', 'url', 'published_at', 'source_type', 'accessed_at', 'hash'],
    properties: {
      source_id: { type: 'string' },
      publisher: { type: 'string' },
      url: { type: 'string' },
      published_at: { type: 'string' },
      source_type: { type: 'string', enum: ['official_stats', 'company_filing', 'industry_report', 'news_article'] },
      accessed_at: { type: 'string' },
      hash: { type: 'string' },
    },
  },
}

const observedOutcomesSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['observation_id', 'as_of_date', 'scope', 'subject_id', 'metric', 'observed_value', 'unit', 'source_refs', 'measurement_method', 'coverage', 'source_confidence', 'extraction_confidence', 'coverage_confidence'],
    properties: {
      observation_id: { type: 'string' },
      as_of_date: { type: 'string' },
      scope: { type: 'string', enum: ['global', 'country', 'industry', 'job-task'] },
      subject_id: { type: 'string' },
      metric: { type: 'string' },
      observed_value: { type: 'number' },
      unit: { type: 'string' },
      source_refs: { type: 'array', items: { type: 'string' } },
      measurement_method: { type: 'string' },
      coverage: { type: 'string' },
      source_confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
      extraction_confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
      coverage_confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    },
  },
}

const forecastEvaluationsSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['claim_id', 'evaluation_date', 'status', 'error_abs', 'error_pct', 'confidence', 'notes'],
    properties: {
      claim_id: { type: 'string' },
      evaluation_date: { type: 'string' },
      status: { type: 'string', enum: ['ahead', 'on_track', 'missed', 'insufficient_evidence'] },
      error_abs: { type: ['number', 'null'] },
      error_pct: { type: ['number', 'null'] },
      confidence: { type: ['string', 'null'], enum: ['low', 'medium', 'high', null] },
      notes: { type: 'string' },
    },
  },
}

const jobTaskCatalogSchema = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['job_id', 'job_title', 'industry', 'tasks'],
    properties: {
      job_id: { type: 'string' },
      job_title: { type: 'string' },
      industry: { type: 'string' },
      tasks: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['task_id', 'task_name', 'task_type', 'task_unit', 'automatable'],
          properties: {
            task_id: { type: 'string' },
            task_name: { type: 'string' },
            task_type: { type: 'string', enum: ['physical', 'digital', 'coordination', 'judgment'] },
            task_unit: { type: 'string' },
            automatable: { type: 'boolean' },
          },
        },
      },
    },
  },
}

const agentWorkObservationsSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['obs_id', 'date', 'employer_or_system', 'job_id', 'task_id', 'agent_output_units', 'human_output_units', 'unit', 'mode', 'quality_metric', 'sla_metric', 'source_refs', 'coverage', 'method_version'],
    properties: {
      obs_id: { type: 'string' },
      date: { type: 'string' },
      employer_or_system: { type: 'string' },
      job_id: { type: 'string' },
      task_id: { type: 'string' },
      agent_output_units: { type: 'number', minimum: 0 },
      human_output_units: { type: 'number', minimum: 0 },
      unit: { type: 'string' },
      mode: { type: 'string', enum: ['fully_agent', 'agent_assisted'] },
      quality_metric: { type: ['number', 'null'] },
      sla_metric: { type: ['number', 'null'] },
      source_refs: { type: 'array', items: { type: 'string' } },
      coverage: { type: 'string' },
      method_version: { type: 'string' },
    },
  },
}

const workShareSnapshotsSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['date', 'job_id', 'task_id', 'agent_share', 'human_share', 'quality_adjusted_agent_share', 'confidence'],
    properties: {
      date: { type: 'string' },
      job_id: { type: 'string' },
      task_id: { type: 'string' },
      agent_share: { type: 'number', minimum: 0, maximum: 1 },
      human_share: { type: 'number', minimum: 0, maximum: 1 },
      quality_adjusted_agent_share: { type: 'number', minimum: 0, maximum: 1 },
      confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    },
  },
}

const jobRollupsSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['date', 'job_id', 'agent_work_share', 'human_work_share', 'jobs_exposed', 'jobs_displaced_estimate_low', 'jobs_displaced_estimate_high', 'confidence'],
    properties: {
      date: { type: 'string' },
      job_id: { type: 'string' },
      agent_work_share: { type: 'number', minimum: 0, maximum: 1 },
      human_work_share: { type: 'number', minimum: 0, maximum: 1 },
      jobs_exposed: { type: 'number', minimum: 0 },
      jobs_displaced_estimate_low: { type: 'number', minimum: 0 },
      jobs_displaced_estimate_high: { type: 'number', minimum: 0 },
      confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    },
  },
}

export function validateData(): void {
  const DATA_DIR = join(__dirname, '../src/data')
  const files = [
    { file: 'news.json', schema: newsSchema },
    { file: 'countries.json', schema: countriesSchema },
    { file: 'cost-model.json', schema: costModelSchema },
    { file: 'forecast-claims.json', schema: forecastClaimsSchema },
    { file: 'evidence-registry.json', schema: evidenceRegistrySchema },
    { file: 'observed-outcomes.json', schema: observedOutcomesSchema },
    { file: 'forecast-evaluations.json', schema: forecastEvaluationsSchema },
    { file: 'job-task-catalog.json', schema: jobTaskCatalogSchema },
    { file: 'agent-work-observations.json', schema: agentWorkObservationsSchema },
    { file: 'work-share-snapshots.json', schema: workShareSnapshotsSchema },
    { file: 'job-rollups.json', schema: jobRollupsSchema },
  ]
  let hasErrors = false
  for (const { file, schema } of files) {
    try {
      const data = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8'))
      const validate = ajv.compile(schema)
      if (!validate(data)) {
        console.error(`❌ ${file} validation failed:`, ajv.errorsText(validate.errors))
        hasErrors = true
      } else {
        console.log(`✓ ${file} is valid`)
      }
    } catch (err) { console.error(`❌ ${file} could not be read/parsed:`, (err as Error).message); hasErrors = true }
  }
  if (hasErrors) { console.error('Validation failed — aborting'); process.exit(1) }
  console.log('All data files are valid ✓')
}

if (import.meta.url === `file://${process.argv[1]}`) validateData()
