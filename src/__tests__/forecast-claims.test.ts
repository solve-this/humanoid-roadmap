import { describe, it, expect } from 'vitest'
import forecastClaimsData from '../data/forecast-claims.json'
import evidenceRegistryData from '../data/evidence-registry.json'
import observedOutcomesData from '../data/observed-outcomes.json'
import forecastEvaluationsData from '../data/forecast-evaluations.json'
import type { ForecastClaim, EvidenceRecord, ObservedOutcome, ForecastEvaluation } from '../types/forecast-jobs'

const VALID_SCOPES = new Set(['global', 'country', 'industry', 'job-task'])
const VALID_HORIZONS = new Set([2027, 2030, 2035])
const VALID_DIRECTIONS = new Set(['increasing', 'decreasing', 'stable'])
const VALID_SOURCE_TYPES = new Set(['official_stats', 'company_filing', 'industry_report', 'news_article'])
const VALID_CONFIDENCES = new Set(['low', 'medium', 'high'])
const VALID_STATUSES = new Set(['ahead', 'on_track', 'missed', 'insufficient_evidence'])

describe('forecast-claims.json', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(forecastClaimsData)).toBe(true)
    expect(forecastClaimsData.length).toBeGreaterThan(0)
  })

  it('every claim has all required fields', () => {
    for (const raw of forecastClaimsData) {
      const c = raw as ForecastClaim
      expect(c).toHaveProperty('claim_id')
      expect(c).toHaveProperty('created_at')
      expect(c).toHaveProperty('scope')
      expect(c).toHaveProperty('subject_id')
      expect(c).toHaveProperty('forecast_horizon')
      expect(c).toHaveProperty('metric')
      expect(c).toHaveProperty('predicted_value')
      expect(c).toHaveProperty('unit')
      expect(c).toHaveProperty('direction')
      expect(c).toHaveProperty('baseline_value')
      expect(c).toHaveProperty('method_version')
      expect(c).toHaveProperty('rationale_refs')
    }
  })

  it('scope values are valid enum members', () => {
    for (const raw of forecastClaimsData) {
      const c = raw as ForecastClaim
      expect(VALID_SCOPES.has(c.scope)).toBe(true)
    }
  })

  it('forecast_horizon values are 2027, 2030, or 2035', () => {
    for (const raw of forecastClaimsData) {
      const c = raw as ForecastClaim
      expect(VALID_HORIZONS.has(c.forecast_horizon)).toBe(true)
    }
  })

  it('direction values are valid enum members', () => {
    for (const raw of forecastClaimsData) {
      const c = raw as ForecastClaim
      expect(VALID_DIRECTIONS.has(c.direction)).toBe(true)
    }
  })

  it('predicted_value is a non-negative number', () => {
    for (const raw of forecastClaimsData) {
      const c = raw as ForecastClaim
      expect(typeof c.predicted_value).toBe('number')
      expect(c.predicted_value).toBeGreaterThanOrEqual(0)
    }
  })

  it('claim_ids are unique', () => {
    const ids = (forecastClaimsData as ForecastClaim[]).map(c => c.claim_id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('covers all 15 tracked countries across all 3 horizons', () => {
    const claims = forecastClaimsData as ForecastClaim[]
    const countryClaims = claims.filter(c => c.scope === 'country')
    const countryHorizonKeys = new Set(countryClaims.map(c => `${c.subject_id}:${c.forecast_horizon}`))
    // At least 15 countries × 3 horizons = 45 unique keys
    expect(countryHorizonKeys.size).toBeGreaterThanOrEqual(45)
  })
})

describe('evidence-registry.json', () => {
  it('is an array', () => {
    expect(Array.isArray(evidenceRegistryData)).toBe(true)
  })

  it('every record has required fields when non-empty', () => {
    for (const raw of evidenceRegistryData) {
      const r = raw as EvidenceRecord
      expect(r).toHaveProperty('source_id')
      expect(r).toHaveProperty('publisher')
      expect(r).toHaveProperty('url')
      expect(r).toHaveProperty('published_at')
      expect(r).toHaveProperty('source_type')
      expect(r).toHaveProperty('accessed_at')
      expect(r).toHaveProperty('hash')
    }
  })

  it('source_type is a valid enum when records exist', () => {
    for (const raw of evidenceRegistryData) {
      const r = raw as EvidenceRecord
      expect(VALID_SOURCE_TYPES.has(r.source_type)).toBe(true)
    }
  })
})

describe('observed-outcomes.json', () => {
  it('is an array', () => {
    expect(Array.isArray(observedOutcomesData)).toBe(true)
  })

  it('every observation has required fields when non-empty', () => {
    for (const raw of observedOutcomesData) {
      const o = raw as ObservedOutcome
      expect(o).toHaveProperty('observation_id')
      expect(o).toHaveProperty('as_of_date')
      expect(o).toHaveProperty('scope')
      expect(o).toHaveProperty('metric')
      expect(o).toHaveProperty('observed_value')
      expect(o).toHaveProperty('source_refs')
      expect(o).toHaveProperty('source_confidence')
    }
  })

  it('confidence values are valid enums when records exist', () => {
    for (const raw of observedOutcomesData) {
      const o = raw as ObservedOutcome
      expect(VALID_CONFIDENCES.has(o.source_confidence)).toBe(true)
      expect(VALID_CONFIDENCES.has(o.extraction_confidence)).toBe(true)
      expect(VALID_CONFIDENCES.has(o.coverage_confidence)).toBe(true)
    }
  })

  it('source_refs is always an array', () => {
    for (const raw of observedOutcomesData) {
      const o = raw as ObservedOutcome
      expect(Array.isArray(o.source_refs)).toBe(true)
    }
  })
})

describe('forecast-evaluations.json', () => {
  it('is an array', () => {
    expect(Array.isArray(forecastEvaluationsData)).toBe(true)
  })

  it('every evaluation has required fields when non-empty', () => {
    for (const raw of forecastEvaluationsData) {
      const e = raw as ForecastEvaluation
      expect(e).toHaveProperty('claim_id')
      expect(e).toHaveProperty('evaluation_date')
      expect(e).toHaveProperty('status')
      expect(e).toHaveProperty('error_abs')
      expect(e).toHaveProperty('error_pct')
      expect(e).toHaveProperty('notes')
    }
  })

  it('status is a valid enum when records exist', () => {
    for (const raw of forecastEvaluationsData) {
      const e = raw as ForecastEvaluation
      expect(VALID_STATUSES.has(e.status)).toBe(true)
    }
  })

  it('error_abs and error_pct are number or null', () => {
    for (const raw of forecastEvaluationsData) {
      const e = raw as ForecastEvaluation
      expect(e.error_abs === null || typeof e.error_abs === 'number').toBe(true)
      expect(e.error_pct === null || typeof e.error_pct === 'number').toBe(true)
    }
  })
})
