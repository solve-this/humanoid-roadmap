import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts'
import type { ForecastClaim, ForecastEvaluation } from '../types/forecast-jobs'

interface CountryData {
  iso3: string; name: string; adoptionScore: number
  replacementPct2027: number; replacementPct2030: number; replacementPct2035: number
}

interface TimelineSnapshot {
  date: string; humanCostGlobal: number; robotCostGlobal: number; topAdopters: string[]
}

const COLORS = ['#ff8c00', '#00d4ff', '#ff4444', '#44ff88', '#ff44ff', '#44ffff', '#ffff44', '#ff8844', '#88ff44', '#4488ff']
const MOBILE_MAX_COUNTRIES = 6

type ViewMode = 'forecast' | 'vs-actual'

const STATUS_COLOR: Record<string, string> = {
  ahead: '#44ff88',
  on_track: '#00d4ff',
  missed: '#ff4444',
  insufficient_evidence: 'rgba(255,255,255,0.3)',
}

export default function AdoptionForecast({
  countriesData, snapshots, forecastClaims = [], forecastEvaluations = [], mobile = false,
}: {
  countriesData: CountryData[]
  snapshots: TimelineSnapshot[]
  forecastClaims?: ForecastClaim[]
  forecastEvaluations?: ForecastEvaluation[]
  mobile?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ViewMode>('forecast')

  const topCountries = [...countriesData].sort((a, b) => b.adoptionScore - a.adoptionScore).slice(0, 10)
  const chartCountries = mobile ? topCountries.slice(0, MOBILE_MAX_COUNTRIES) : topCountries

  type ChartRow = { year: string; [k: string]: string | number }

  const chartData: ChartRow[] = [
    { year: '2024', ...Object.fromEntries(chartCountries.map(c => [c.iso3, 0])) },
    { year: '2027', ...Object.fromEntries(chartCountries.map(c => [c.iso3, c.replacementPct2027])) },
    { year: '2030', ...Object.fromEntries(chartCountries.map(c => [c.iso3, c.replacementPct2030])) },
    { year: '2035', ...Object.fromEntries(chartCountries.map(c => [c.iso3, c.replacementPct2035])) },
  ]

  // suppress unused warning - snapshots used for future historical chart
  void snapshots

  const hasEvaluations = forecastEvaluations.length > 0
  const claimCount = forecastClaims.length
  const evaluationsByHorizon = [2027, 2030, 2035].map(horizon => {
    const evals = forecastEvaluations.filter(e => {
      const claim = forecastClaims.find(c => c.claim_id === e.claim_id)
      return claim?.forecast_horizon === horizon
    })
    return { horizon, count: evals.length }
  })

  const content = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 }}>
        <span style={{ color: '#00d4ff', fontSize: mobile ? '10px' : '11px', letterSpacing: '0.15em', textTransform: 'uppercase', lineHeight: 1.4 }}>
          Physical Labor Replacement Forecast (% by Country)
        </span>
        {!mobile && (
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {(['forecast', 'vs-actual'] as ViewMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              background: mode === m ? 'rgba(0,212,255,0.15)' : 'transparent',
              border: `1px solid ${mode === m ? '#00d4ff' : 'rgba(0,212,255,0.25)'}`,
              color: mode === m ? '#00d4ff' : 'rgba(255,255,255,0.35)',
              padding: mobile ? '6px 10px' : '3px 10px',
              cursor: 'pointer',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: mobile ? '9px' : '8px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              borderRadius: mobile ? 999 : 0,
            }}
          >
            {m === 'forecast' ? 'Forecast' : 'vs Actual'}
          </button>
        ))}
      </div>

      {mode === 'forecast' ? (
        <>
          <ResponsiveContainer width="100%" height={mobile ? 300 : 390}>
            <LineChart data={chartData} margin={{ top: 5, right: mobile ? 10 : 30, left: mobile ? -18 : 0, bottom: 5 }}>
              <XAxis dataKey="year" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: mobile ? 10 : 11 }} />
              <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: mobile ? 9 : 10 }} domain={[0, 80]} />
              <Tooltip formatter={(v) => typeof v === 'number' ? `${v}%` : String(v)} contentStyle={{ background: '#0a0a1a', border: '1px solid #00d4ff', fontSize: 10 }} />
              {!mobile && <Legend wrapperStyle={{ fontSize: 9 }} />}
              <ReferenceLine y={50} stroke="rgba(255,0,0,0.3)" strokeDasharray="4 4" label={mobile ? undefined : { value: '50% threshold', fill: 'rgba(255,0,0,0.5)', fontSize: 9 }} />
              {chartCountries.map((c, i) => (
                <Line key={c.iso3} type="monotone" dataKey={c.iso3} name={c.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: mobile ? 3 : 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {mobile && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {chartCountries.map((country, index) => (
                <span
                  key={country.iso3}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 9px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 10,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: COLORS[index % COLORS.length] }} />
                  {country.iso3}
                </span>
              ))}
            </div>
          )}
        </>
      ) : hasEvaluations ? (
        <div style={{ overflowY: 'auto', height: mobile ? 'auto' : 390, maxHeight: mobile ? 340 : undefined }}>
          {forecastEvaluations.slice(0, 30).map(ev => {
            const claim = forecastClaims.find(c => c.claim_id === ev.claim_id)
            if (!claim) return null
            const color = STATUS_COLOR[ev.status] ?? 'rgba(255,255,255,0.3)'
            return (
              <div
                key={ev.claim_id}
                style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '8px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: mobile ? '11px' : '10px',
                  gap: 12,
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.5)', minWidth: 50 }}>{claim.subject_id}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', minWidth: 40 }}>{claim.forecast_horizon}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', flex: 1 }}>
                  {claim.predicted_value}{claim.unit === 'percent' ? '%' : ` ${claim.unit}`}
                  {ev.error_pct !== null && (
                    <span style={{ color: ev.error_pct > 0 ? '#44ff88' : '#ff4444', marginLeft: 8 }}>
                      {ev.error_pct > 0 ? '+' : ''}{ev.error_pct?.toFixed(1)}%
                    </span>
                  )}
                </span>
                <span style={{ color, fontSize: mobile ? '10px' : '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {ev.status.replace(/_/g, ' ')}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ padding: mobile ? '8px 0 0' : '20px 0' }}>
          <div style={{
            textAlign: 'center', color: 'rgba(0,212,255,0.5)',
            fontSize: '10px', letterSpacing: '0.15em', marginBottom: 12,
          }}>
            TRACKING IN PROGRESS
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: mobile ? '10px' : '9px', lineHeight: '1.7', marginBottom: 20, textAlign: 'center' }}>
            {claimCount} forecast claims logged since {forecastClaims[0]?.created_at ?? '—'}.
            <br />
            Observed outcomes will be populated as source-linked evidence is collected.
            <br />
            Evaluations appear only when primary/official sources confirm a metric.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {evaluationsByHorizon.map(({ horizon }) => {
              const count = forecastClaims.filter(c => c.forecast_horizon === horizon).length
              return (
                <div
                  key={horizon}
                  style={{
                    textAlign: 'center', padding: '10px 16px',
                    border: '1px solid rgba(0,212,255,0.2)',
                    background: 'rgba(0,212,255,0.05)',
                    minWidth: mobile ? 86 : undefined,
                  }}
                >
                  <div style={{ color: '#00d4ff', fontSize: '14px', fontFamily: 'Orbitron, sans-serif' }}>{count}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '8px', marginTop: 2 }}>claims logged</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', marginTop: 1 }}>{horizon}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )

  if (mobile) {
    return (
      <section style={{
        border: '1px solid rgba(0,212,255,0.22)',
        borderRadius: 24,
        background: 'rgba(8,8,8,0.9)',
        padding: 16,
        fontFamily: 'Roboto Mono, monospace',
      }}>
        {content}
      </section>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Forecast"
        style={{
          position: 'fixed', left: '20px', top: '50%', transform: 'translateY(-50%)',
          zIndex: 30, background: 'rgba(0,0,0,0.7)', border: '1px solid #00d4ff',
          color: '#00d4ff', padding: '8px 12px', cursor: 'pointer',
          fontFamily: 'Orbitron, sans-serif', fontSize: '9px', letterSpacing: '0.15em',
          pointerEvents: 'auto', display: open ? 'none' : 'block',
          clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
        }}
      >
        FORE<br />CAST
      </button>

      <div style={{
        position: 'fixed', bottom: open ? 36 : -540, left: 0, right: 0, height: 520,
        background: 'rgba(3,3,3,0.95)', borderTop: '1px solid rgba(0,212,255,0.4)',
        zIndex: 45, transition: 'bottom 0.3s ease', padding: '16px 24px',
        pointerEvents: 'auto', fontFamily: 'Roboto Mono, monospace',
      }}>
        {content}
      </div>
    </>
  )
}
