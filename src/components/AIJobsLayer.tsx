import { useState } from 'react'
import type { JobTaskEntry, JobRollup } from '../types/forecast-jobs'
import type { Locale } from '../i18n'

interface AIJobsLayerProps {
  jobTaskCatalog: JobTaskEntry[]
  jobRollups: JobRollup[]
  mobile?: boolean
  locale?: Locale
}

const SECTOR_COLORS: Record<string, string> = {
  services: '#00d4ff',
  technology: '#44ff88',
  logistics: '#ff8c00',
  legal_financial: '#ff44ff',
  manufacturing: '#ffff44',
}
const PREVIEW_JOB_COUNT = 6

function sectorColor(industry: string): string {
  return SECTOR_COLORS[industry] ?? '#888'
}

export default function AIJobsLayer({ jobTaskCatalog, jobRollups, mobile = false, locale = 'en' }: AIJobsLayerProps) {
  const [open, setOpen] = useState(false)
  const isDe = locale === 'de'
  const labels = {
    triggerAria: isDe ? 'KI vs Menschen Jobs' : 'AI vs Human Jobs',
    triggerLines: isDe ? ['KI', 'JOBS'] : ['AI', 'JOBS'],
    headerTitle: isDe ? 'KI-Agenten-Arbeit vs menschliche Jobs' : 'AI-Agent Work vs Human Jobs',
    headerSub: isDe ? 'Arbeitsanteil nach Beruf • Evidenzbasiert' : 'Work share by occupation • Evidence-based',
    tracked: isDe ? 'erfasst' : 'tracked',
    queued: isDe ? 'in Warteschlange' : 'queued',
    close: isDe ? 'Schließen' : 'Close',
    methodology1: isDe ? 'Misst den Arbeitsanteil auf Aufgabenebene, nicht binäre Ersetzung.' : 'Measures task-level work share, not binary replacement.',
    methodology2: isDe ? 'Zählt Agenten-Arbeit nur bei quellenverknüpfter Evidenz.' : 'Only counts agent work where source-linked evidence exists.',
    methodology3: isDe ? 'Confidence spiegelt die Quellenabdeckung wider.' : 'Confidence reflects source coverage.',
    aiAgent: isDe ? 'KI-Agent' : 'AI Agent',
    human: isDe ? 'Mensch' : 'Human',
    tasksDisplaced: isDe ? 'Aufgaben verdrängt' : 'tasks displaced',
    evidenceCollection: isDe ? 'EVIDENZSAMMLUNG LÄUFT' : 'EVIDENCE COLLECTION IN PROGRESS',
    trackingOccupations: isDe ? 'Erfasse' : 'Tracking',
    occupations: isDe ? 'Berufe' : 'occupations',
    tasksTracked: isDe ? 'Aufgaben erfasst' : 'tasks tracked',
    automatable: isDe ? 'automatisierbar' : 'automatable',
  }

  // Latest rollup per job (most recent date)
  const latestRollupByJob = new Map<string, JobRollup>()
  for (const rollup of jobRollups) {
    const prev = latestRollupByJob.get(rollup.job_id)
    if (!prev || rollup.date > prev.date) latestRollupByJob.set(rollup.job_id, rollup)
  }

  const hasData = latestRollupByJob.size > 0
  const previewJobs = jobTaskCatalog.slice(0, PREVIEW_JOB_COUNT)

  const jobCards = hasData ? (
    jobTaskCatalog.map(job => {
      const rollup = latestRollupByJob.get(job.job_id)
      if (!rollup) return null
      const agentPct = Math.round(rollup.agent_work_share * 100)
      const humanPct = Math.round(rollup.human_work_share * 100)
      const color = sectorColor(job.industry)
      const confidenceColor = rollup.confidence === 'high' ? '#44ff88' : rollup.confidence === 'medium' ? '#ff8c00' : '#ff4444'

      return (
        <div
          key={job.job_id}
          style={{
            marginBottom: 14, padding: '12px', border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, gap: 10 }}>
            <div>
              <span style={{ color, fontSize: '10px', fontWeight: 'bold' }}>{job.job_title}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '8px', marginLeft: 6 }}>{job.industry}</span>
            </div>
            <span style={{ color: confidenceColor, fontSize: '8px' }}>{rollup.confidence.toUpperCase()} CONF</span>
          </div>

          <div style={{ display: 'flex', height: 10, borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ width: `${agentPct}%`, background: color, transition: 'width 0.5s ease' }} />
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
            <span style={{ color }}>{labels.aiAgent}: {agentPct}%</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{labels.human}: {humanPct}%</span>
          </div>

          <div style={{ marginTop: 6, fontSize: '8px', color: 'rgba(255,255,255,0.25)' }}>
            {rollup.jobs_displaced_estimate_low}–{rollup.jobs_displaced_estimate_high} {labels.tasksDisplaced}
            {rollup.date && <span> • {rollup.date}</span>}
          </div>
        </div>
      )
    })
  ) : (
    <div>
      <div style={{
        textAlign: 'center', padding: '20px 0 12px',
        color: 'rgba(68,255,136,0.5)', fontSize: '10px', letterSpacing: '0.1em',
      }}>
        {labels.evidenceCollection}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', lineHeight: '1.6', marginBottom: 16 }}>
        {labels.trackingOccupations} {jobTaskCatalog.length} {labels.occupations}. Work-share data appears once
        source-linked task observations are collected.
      </div>

      {previewJobs.map(job => {
        const color = sectorColor(job.industry)
        const automatableTasks = job.tasks.filter(t => t.automatable).length
        return (
          <div
            key={job.job_id}
            style={{
              marginBottom: 10, padding: '10px 12px',
              border: '1px solid rgba(68,255,136,0.12)',
              background: 'rgba(68,255,136,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 10 }}>
              <span style={{ color, fontSize: '10px' }}>{job.job_title}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '8px' }}>{job.industry}</span>
            </div>
            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)' }}>
              {job.tasks.length} {labels.tasksTracked} &nbsp;·&nbsp;
              {automatableTasks} {labels.automatable}
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {job.tasks.map(task => (
                <span
                  key={task.task_id}
                  style={{
                    fontSize: '7px', padding: '1px 5px',
                    background: task.automatable ? 'rgba(68,255,136,0.12)' : 'rgba(255,255,255,0.05)',
                    color: task.automatable ? 'rgba(68,255,136,0.7)' : 'rgba(255,255,255,0.2)',
                    borderRadius: 2,
                  }}
                >
                  {task.task_name}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div>
        <div style={{ color: '#44ff88', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {labels.headerTitle}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', marginTop: 2 }}>
          {labels.headerSub}
        </div>
      </div>
      {mobile ? (
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>{hasData ? `${latestRollupByJob.size} ${labels.tracked}` : `${jobTaskCatalog.length} ${labels.queued}`}</span>
      ) : (
        <button
          onClick={() => setOpen(false)}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18 }}
          aria-label={labels.close}
        >✕</button>
      )}
    </div>
  )

  const methodology = (
    <div style={{
      background: 'rgba(68,255,136,0.06)', border: '1px solid rgba(68,255,136,0.2)',
      padding: '8px 10px', marginBottom: 16, fontSize: '9px',
      color: 'rgba(255,255,255,0.4)', lineHeight: '1.5',
    }}>
      {labels.methodology1}
      {' '}
      {labels.methodology2}
      {' '}
      {labels.methodology3}
    </div>
  )

  if (mobile) {
    return (
      <section style={{
        border: '1px solid rgba(68,255,136,0.22)',
        borderRadius: 24,
        background: 'rgba(8,8,8,0.9)',
        padding: 16,
        fontFamily: 'Roboto Mono, monospace',
      }}>
        {header}
        {methodology}
        {jobCards}
      </section>
    )
  }

  return (
    <>
      {/* Trigger button — left side, below the FORECAST button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', left: '20px', top: '62%', transform: 'translateY(-50%)',
          zIndex: 30, background: 'rgba(0,0,0,0.7)', border: '1px solid #44ff88',
          color: '#44ff88', padding: '8px 12px', cursor: 'pointer',
          fontFamily: 'Orbitron, sans-serif', fontSize: '9px', letterSpacing: '0.15em',
          pointerEvents: 'auto', display: open ? 'none' : 'block',
          clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
        }}
        aria-label={labels.triggerAria}
      >
        {labels.triggerLines[0]}<br />{labels.triggerLines[1]}
      </button>

      {/* Drawer panel — slides in from the left */}
      <div style={{
        position: 'fixed', top: 0, left: open ? 0 : '-440px', width: 420, height: '100vh',
        background: 'rgba(3,3,3,0.97)', borderRight: '1px solid rgba(68,255,136,0.4)',
        zIndex: 50, transition: 'left 0.3s ease', overflowY: 'auto',
        padding: '20px', pointerEvents: 'auto',
        fontFamily: 'Roboto Mono, monospace',
      }}>
        {header}
        {methodology}
        {jobCards}
      </div>
    </>
  )
}
