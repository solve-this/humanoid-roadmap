import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface JobTask {
  task_id: string
  task_type: string
  automatable: boolean
}

interface JobTaskEntry {
  job_id: string
  tasks: JobTask[]
}

interface AgentWorkObservation {
  obs_id: string
  date: string
  job_id: string
  task_id: string
  agent_output_units: number
  human_output_units: number
  mode: 'fully_agent' | 'agent_assisted'
  source_refs: string[]
  coverage: string
  method_version: string
}

interface WorkShareSnapshot {
  date: string
  job_id: string
  task_id: string
  agent_share: number
  human_share: number
  quality_adjusted_agent_share: number
  confidence: 'low' | 'medium' | 'high'
}

interface JobRollup {
  date: string
  job_id: string
  agent_work_share: number
  human_work_share: number
  jobs_exposed: number
  jobs_displaced_estimate_low: number
  jobs_displaced_estimate_high: number
  confidence: 'low' | 'medium' | 'high'
}

/**
 * Derives work-share snapshots and job-level rollups from agent-work-observations.
 * When no observations exist, emits no snapshots (does not fabricate data).
 * Snapshots are keyed by date + job_id + task_id; existing entries are not overwritten.
 */
export async function collectJobWork(): Promise<{ snapshots: number; rollups: number }> {
  const catalogPath = join(__dirname, '../src/data/job-task-catalog.json')
  const observationsPath = join(__dirname, '../src/data/agent-work-observations.json')
  const snapshotsPath = join(__dirname, '../src/data/work-share-snapshots.json')
  const rollupsPath = join(__dirname, '../src/data/job-rollups.json')

  const catalog: JobTaskEntry[] = JSON.parse(readFileSync(catalogPath, 'utf-8'))
  const observations: AgentWorkObservation[] = existsSync(observationsPath)
    ? JSON.parse(readFileSync(observationsPath, 'utf-8'))
    : []
  const existingSnapshots: WorkShareSnapshot[] = existsSync(snapshotsPath)
    ? JSON.parse(readFileSync(snapshotsPath, 'utf-8'))
    : []
  const existingRollups: JobRollup[] = existsSync(rollupsPath)
    ? JSON.parse(readFileSync(rollupsPath, 'utf-8'))
    : []

  if (observations.length === 0) {
    console.log('✓ job-work: no observations to process — snapshots unchanged')
    return { snapshots: 0, rollups: 0 }
  }

  const today = new Date().toISOString().split('T')[0]
  const existingSnapshotKeys = new Set(
    existingSnapshots.map(s => `${s.date}:${s.job_id}:${s.task_id}`)
  )
  const existingRollupKeys = new Set(existingRollups.map(r => `${r.date}:${r.job_id}`))

  // Group observations by job+task for today
  const grouped = new Map<string, AgentWorkObservation[]>()
  for (const obs of observations) {
    if (obs.date !== today) continue
    const key = `${obs.job_id}:${obs.task_id}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(obs)
  }

  const newSnapshots: WorkShareSnapshot[] = []

  for (const [key, obs] of grouped) {
    const snapshotKey = `${today}:${key}`
    if (existingSnapshotKeys.has(snapshotKey)) continue

    const [job_id, task_id] = key.split(':', 2)
    const totalAgent = obs.reduce((s, o) => s + o.agent_output_units, 0)
    const totalHuman = obs.reduce((s, o) => s + o.human_output_units, 0)
    const total = totalAgent + totalHuman
    if (total === 0) continue

    const agent_share = +(totalAgent / total).toFixed(4)
    const human_share = +(totalHuman / total).toFixed(4)
    // Quality-adjusted share: conservative — only count fully_agent observations
    const fullyAgentUnits = obs
      .filter(o => o.mode === 'fully_agent')
      .reduce((s, o) => s + o.agent_output_units, 0)
    const quality_adjusted_agent_share = +(fullyAgentUnits / total).toFixed(4)

    // Confidence based on how many independent sources back the observations
    const uniqueSources = new Set(obs.flatMap(o => o.source_refs))
    const confidence: 'low' | 'medium' | 'high' =
      uniqueSources.size >= 3 ? 'high' : uniqueSources.size >= 2 ? 'medium' : 'low'

    newSnapshots.push({
      date: today, job_id, task_id,
      agent_share, human_share, quality_adjusted_agent_share, confidence,
    })
  }

  // Compute rollups (job-level aggregate across tasks, for today)
  const newRollups: JobRollup[] = []
  const jobIds = new Set(newSnapshots.map(s => s.job_id))
  for (const job_id of jobIds) {
    const rollupKey = `${today}:${job_id}`
    if (existingRollupKeys.has(rollupKey)) continue

    const jobEntry = catalog.find(j => j.job_id === job_id)
    const taskCount = jobEntry?.tasks.length ?? 1
    const jobSnaps = newSnapshots.filter(s => s.job_id === job_id)
    const avgAgent = jobSnaps.reduce((s, sn) => s + sn.quality_adjusted_agent_share, 0) / jobSnaps.length
    const agent_work_share = +avgAgent.toFixed(4)
    const human_work_share = +(1 - agent_work_share).toFixed(4)

    const worstConfidence = jobSnaps.some(s => s.confidence === 'low')
      ? 'low'
      : jobSnaps.some(s => s.confidence === 'medium')
        ? 'medium'
        : 'high'

    newRollups.push({
      date: today,
      job_id,
      agent_work_share,
      human_work_share,
      jobs_exposed: taskCount,
      jobs_displaced_estimate_low: +(agent_work_share * 0.5).toFixed(4),
      jobs_displaced_estimate_high: +agent_work_share.toFixed(4),
      confidence: worstConfidence,
    })
  }

  if (newSnapshots.length > 0) {
    writeFileSync(snapshotsPath, JSON.stringify([...existingSnapshots, ...newSnapshots], null, 2))
    console.log(`✓ job-work: ${newSnapshots.length} new work-share snapshots written`)
  } else {
    console.log('✓ job-work: no new snapshots for today')
  }

  if (newRollups.length > 0) {
    writeFileSync(rollupsPath, JSON.stringify([...existingRollups, ...newRollups], null, 2))
    console.log(`✓ job-work: ${newRollups.length} new job rollups written`)
  } else {
    console.log('✓ job-work: no new rollups for today')
  }

  return { snapshots: newSnapshots.length, rollups: newRollups.length }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  collectJobWork()
    .then(() => { process.exit(0) })
    .catch(err => { console.error(err); process.exit(1) })
}
