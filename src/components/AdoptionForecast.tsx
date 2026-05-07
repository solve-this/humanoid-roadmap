import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts'

interface CountryData {
  iso3: string; name: string; adoptionScore: number
  replacementPct2027: number; replacementPct2030: number; replacementPct2035: number
}

interface TimelineSnapshot {
  date: string; humanCostGlobal: number; robotCostGlobal: number; topAdopters: string[]
}

const COLORS = ['#ff8c00', '#00d4ff', '#ff4444', '#44ff88', '#ff44ff', '#44ffff', '#ffff44', '#ff8844', '#88ff44', '#4488ff']

export default function AdoptionForecast({ countriesData, snapshots }: { countriesData: CountryData[]; snapshots: TimelineSnapshot[] }) {
  const [open, setOpen] = useState(false)

  const top10 = [...countriesData].sort((a, b) => b.adoptionScore - a.adoptionScore).slice(0, 10)

  type ChartRow = { year: string; [k: string]: string | number }

  const chartData: ChartRow[] = [
    { year: '2024', ...Object.fromEntries(top10.map(c => [c.iso3, 0])) },
    { year: '2027', ...Object.fromEntries(top10.map(c => [c.iso3, c.replacementPct2027])) },
    { year: '2030', ...Object.fromEntries(top10.map(c => [c.iso3, c.replacementPct2030])) },
    { year: '2035', ...Object.fromEntries(top10.map(c => [c.iso3, c.replacementPct2035])) },
  ]

  // suppress unused warning - snapshots may be used in future for historical chart
  void snapshots

  return (
    <>
      <button
        onClick={() => setOpen(true)}
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
        position: 'fixed', bottom: open ? 36 : -520, left: 0, right: 0, height: 500,
        background: 'rgba(3,3,3,0.95)', borderTop: '1px solid rgba(0,212,255,0.4)',
        zIndex: 45, transition: 'bottom 0.3s ease', padding: '16px 24px',
        pointerEvents: 'auto', fontFamily: 'Roboto Mono, monospace',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ color: '#00d4ff', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Physical Labor Replacement Forecast (% by Country)
          </span>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <XAxis dataKey="year" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
            <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} domain={[0, 80]} />
            <Tooltip formatter={(v) => typeof v === 'number' ? `${v}%` : String(v)} contentStyle={{ background: '#0a0a1a', border: '1px solid #00d4ff', fontSize: 10 }} />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            <ReferenceLine y={50} stroke="rgba(255,0,0,0.3)" strokeDasharray="4 4" label={{ value: '50% threshold', fill: 'rgba(255,0,0,0.5)', fontSize: 9 }} />
            {top10.map((c, i) => (
              <Line key={c.iso3} type="monotone" dataKey={c.iso3} name={c.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
