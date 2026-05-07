import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface HumanCosts {
  foodPerDay: number; waterPerDay: number; housingPerDay: number
  healthcarePerDay: number; trainingPerDay: number; managementOverhead: number
}
interface RobotCosts {
  hardwarePrice: number; amortizationYears: number; kWhPerDay: number
  maintenancePctPerYear: number; cloudInferencePerDay: number; solarOffsetPct: number
}
interface CostModel {
  global: { human: HumanCosts; robot: RobotCosts }
  countries: Record<string, { humanTotalPerDay?: number; robotTotalPerDay?: number }>
}
interface CountryData { iso3: string; name: string; energyCostKWh: number }

function computeHumanBreakdown(model: HumanCosts) {
  const sub = model.foodPerDay + model.waterPerDay + model.housingPerDay + model.healthcarePerDay + model.trainingPerDay
  return {
    food: +model.foodPerDay.toFixed(2),
    water: +model.waterPerDay.toFixed(2),
    housing: +model.housingPerDay.toFixed(2),
    healthcare: +model.healthcarePerDay.toFixed(2),
    training: +model.trainingPerDay.toFixed(2),
    overhead: +(sub * model.managementOverhead).toFixed(2),
  }
}

function computeRobotBreakdown(model: RobotCosts, energyCostKWh: number) {
  const amortization = model.hardwarePrice / (model.amortizationYears * 365)
  const electricity = model.kWhPerDay * energyCostKWh
  const maintenance = (model.hardwarePrice * model.maintenancePctPerYear) / 365
  const solar = electricity * model.solarOffsetPct
  return {
    amortization: +amortization.toFixed(2),
    electricity: +electricity.toFixed(2),
    maintenance: +maintenance.toFixed(2),
    cloud: +model.cloudInferencePerDay.toFixed(2),
    solarOffset: -(+solar.toFixed(2)),
  }
}

export default function CostBreakdown({ countriesData, costModel }: { countriesData: CountryData[]; costModel: CostModel }) {
  const [open, setOpen] = useState(false)
  const [selectedISO, setSelectedISO] = useState('global')

  const selectedCountry = selectedISO === 'global' ? null : countriesData.find(c => c.iso3 === selectedISO)
  const energyCost = selectedCountry ? selectedCountry.energyCostKWh : 0.15

  const humanBreakdown = computeHumanBreakdown(costModel.global.human)
  const robotBreakdown = computeRobotBreakdown(costModel.global.robot, energyCost)

  const humanTotal = Object.values(humanBreakdown).reduce((a, b) => a + b, 0)
  const robotTotal = Object.values(robotBreakdown).reduce((a, b) => a + b, 0)

  const chartData = [
    {
      name: 'HUMAN',
      food: humanBreakdown.food,
      water: humanBreakdown.water,
      housing: humanBreakdown.housing,
      healthcare: humanBreakdown.healthcare,
      training: humanBreakdown.training,
      overhead: humanBreakdown.overhead,
    },
    {
      name: 'ROBOT',
      amortization: robotBreakdown.amortization,
      electricity: robotBreakdown.electricity,
      maintenance: robotBreakdown.maintenance,
      cloud: robotBreakdown.cloud,
    },
  ]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)',
          zIndex: 30, background: 'rgba(0,0,0,0.7)', border: '1px solid #ff8c00',
          color: '#ff8c00', padding: '8px 12px', cursor: 'pointer',
          fontFamily: 'Orbitron, sans-serif', fontSize: '9px', letterSpacing: '0.15em',
          pointerEvents: 'auto', display: open ? 'none' : 'block',
          clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
        }}
      >
        COST<br />DRILL<br />DOWN
      </button>

      <div style={{
        position: 'fixed', top: 0, right: open ? 0 : '-420px', width: 400, height: '100vh',
        background: 'rgba(3,3,3,0.95)', borderLeft: '1px solid rgba(255,140,0,0.4)',
        zIndex: 50, transition: 'right 0.3s ease', overflowY: 'auto',
        padding: '20px', pointerEvents: 'auto',
        fontFamily: 'Roboto Mono, monospace',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ color: '#ff8c00', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Cost Breakdown / Day
          </span>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <select
          value={selectedISO}
          onChange={e => setSelectedISO(e.target.value)}
          style={{
            width: '100%', marginBottom: 20, background: '#0a0a1a', color: '#fff',
            border: '1px solid rgba(255,140,0,0.3)', padding: '6px 8px',
            fontFamily: 'Roboto Mono, monospace', fontSize: '11px',
          }}
        >
          <option value="global">Global Average</option>
          {countriesData.map(c => <option key={c.iso3} value={c.iso3}>{c.name}</option>)}
        </select>

        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          Total: Human ${humanTotal.toFixed(2)}/day vs Robot ${robotTotal.toFixed(2)}/day
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} />
            <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid #ff8c00', fontSize: 10 }} />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            <Bar dataKey="food" stackId="cost" fill="#00d4ff" name="Food" />
            <Bar dataKey="water" stackId="cost" fill="#0099bb" name="Water" />
            <Bar dataKey="housing" stackId="cost" fill="#006688" name="Housing" />
            <Bar dataKey="healthcare" stackId="cost" fill="#004455" name="Healthcare" />
            <Bar dataKey="training" stackId="cost" fill="#002233" name="Training" />
            <Bar dataKey="overhead" stackId="cost" fill="#001122" name="Overhead" />
            <Bar dataKey="amortization" stackId="cost" fill="#ff8c00" name="Amortization" />
            <Bar dataKey="electricity" stackId="cost" fill="#cc7000" name="Electricity" />
            <Bar dataKey="maintenance" stackId="cost" fill="#994000" name="Maintenance" />
            <Bar dataKey="cloud" stackId="cost" fill="#662000" name="Cloud/AI" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
