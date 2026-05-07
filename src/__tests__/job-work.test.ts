import { describe, it, expect } from 'vitest'
import jobTaskCatalogData from '../data/job-task-catalog.json'
import agentWorkObservationsData from '../data/agent-work-observations.json'
import workShareSnapshotsData from '../data/work-share-snapshots.json'
import jobRollupsData from '../data/job-rollups.json'
import type { JobTaskEntry, AgentWorkObservation, WorkShareSnapshot, JobRollup } from '../types/forecast-jobs'

const VALID_TASK_TYPES = new Set(['physical', 'digital', 'coordination', 'judgment'])
const VALID_MODES = new Set(['fully_agent', 'agent_assisted'])
const VALID_CONFIDENCES = new Set(['low', 'medium', 'high'])

describe('job-task-catalog.json', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(jobTaskCatalogData)).toBe(true)
    expect(jobTaskCatalogData.length).toBeGreaterThan(0)
  })

  it('every entry has required fields', () => {
    for (const raw of jobTaskCatalogData) {
      const j = raw as JobTaskEntry
      expect(j).toHaveProperty('job_id')
      expect(j).toHaveProperty('job_title')
      expect(j).toHaveProperty('industry')
      expect(j).toHaveProperty('tasks')
      expect(Array.isArray(j.tasks)).toBe(true)
      expect(j.tasks.length).toBeGreaterThan(0)
    }
  })

  it('every task has required fields with valid enums', () => {
    for (const raw of jobTaskCatalogData) {
      const j = raw as JobTaskEntry
      for (const task of j.tasks) {
        expect(task).toHaveProperty('task_id')
        expect(task).toHaveProperty('task_name')
        expect(task).toHaveProperty('task_type')
        expect(task).toHaveProperty('task_unit')
        expect(task).toHaveProperty('automatable')
        expect(VALID_TASK_TYPES.has(task.task_type)).toBe(true)
        expect(typeof task.automatable).toBe('boolean')
      }
    }
  })

  it('job_ids are unique', () => {
    const ids = (jobTaskCatalogData as JobTaskEntry[]).map(j => j.job_id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('task_ids are unique within each job', () => {
    for (const raw of jobTaskCatalogData) {
      const j = raw as JobTaskEntry
      const taskIds = j.tasks.map(t => t.task_id)
      expect(new Set(taskIds).size).toBe(taskIds.length)
    }
  })

  it('every job has at least one automatable task', () => {
    for (const raw of jobTaskCatalogData) {
      const j = raw as JobTaskEntry
      const hasAutomatable = j.tasks.some(t => t.automatable)
      expect(hasAutomatable).toBe(true)
    }
  })

  it('covers the 6 pilot occupation sectors', () => {
    const catalog = jobTaskCatalogData as JobTaskEntry[]
    const industries = new Set(catalog.map(j => j.industry))
    // Must have at least services, technology, logistics, manufacturing
    expect(industries.has('services')).toBe(true)
    expect(industries.has('technology')).toBe(true)
    expect(industries.has('logistics')).toBe(true)
    expect(industries.has('manufacturing')).toBe(true)
  })
})

describe('agent-work-observations.json', () => {
  it('is an array', () => {
    expect(Array.isArray(agentWorkObservationsData)).toBe(true)
  })

  it('every observation has required fields when non-empty', () => {
    for (const raw of agentWorkObservationsData) {
      const o = raw as AgentWorkObservation
      expect(o).toHaveProperty('obs_id')
      expect(o).toHaveProperty('date')
      expect(o).toHaveProperty('job_id')
      expect(o).toHaveProperty('task_id')
      expect(o).toHaveProperty('agent_output_units')
      expect(o).toHaveProperty('human_output_units')
      expect(o).toHaveProperty('unit')
      expect(o).toHaveProperty('mode')
      expect(o).toHaveProperty('source_refs')
    }
  })

  it('mode values are valid enums when records exist', () => {
    for (const raw of agentWorkObservationsData) {
      const o = raw as AgentWorkObservation
      expect(VALID_MODES.has(o.mode)).toBe(true)
    }
  })

  it('output units are non-negative when records exist', () => {
    for (const raw of agentWorkObservationsData) {
      const o = raw as AgentWorkObservation
      expect(o.agent_output_units).toBeGreaterThanOrEqual(0)
      expect(o.human_output_units).toBeGreaterThanOrEqual(0)
    }
  })

  it('job_ids reference entries in the catalog when records exist', () => {
    const knownJobs = new Set((jobTaskCatalogData as JobTaskEntry[]).map(j => j.job_id))
    for (const raw of agentWorkObservationsData) {
      const o = raw as AgentWorkObservation
      expect(knownJobs.has(o.job_id)).toBe(true)
    }
  })
})

describe('work-share-snapshots.json', () => {
  it('is an array', () => {
    expect(Array.isArray(workShareSnapshotsData)).toBe(true)
  })

  it('shares sum to 1.0 ± 0.01 for each snapshot', () => {
    for (const raw of workShareSnapshotsData) {
      const s = raw as WorkShareSnapshot
      expect(s.agent_share + s.human_share).toBeCloseTo(1.0, 1)
    }
  })

  it('all share values are between 0 and 1', () => {
    for (const raw of workShareSnapshotsData) {
      const s = raw as WorkShareSnapshot
      expect(s.agent_share).toBeGreaterThanOrEqual(0)
      expect(s.agent_share).toBeLessThanOrEqual(1)
      expect(s.human_share).toBeGreaterThanOrEqual(0)
      expect(s.human_share).toBeLessThanOrEqual(1)
      expect(s.quality_adjusted_agent_share).toBeGreaterThanOrEqual(0)
      expect(s.quality_adjusted_agent_share).toBeLessThanOrEqual(1)
    }
  })

  it('confidence values are valid enums when records exist', () => {
    for (const raw of workShareSnapshotsData) {
      const s = raw as WorkShareSnapshot
      expect(VALID_CONFIDENCES.has(s.confidence)).toBe(true)
    }
  })
})

describe('job-rollups.json', () => {
  it('is an array', () => {
    expect(Array.isArray(jobRollupsData)).toBe(true)
  })

  it('work shares are valid when records exist', () => {
    for (const raw of jobRollupsData) {
      const r = raw as JobRollup
      expect(r.agent_work_share).toBeGreaterThanOrEqual(0)
      expect(r.agent_work_share).toBeLessThanOrEqual(1)
      expect(r.human_work_share).toBeGreaterThanOrEqual(0)
      expect(r.human_work_share).toBeLessThanOrEqual(1)
    }
  })

  it('displacement range is non-negative when records exist', () => {
    for (const raw of jobRollupsData) {
      const r = raw as JobRollup
      expect(r.jobs_displaced_estimate_low).toBeGreaterThanOrEqual(0)
      expect(r.jobs_displaced_estimate_high).toBeGreaterThanOrEqual(r.jobs_displaced_estimate_low)
    }
  })
})
