import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Locale } from '../i18n'

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
interface CountryData { iso3: string; name: string; energyCostKWh: number; minWage: number }

function computeHumanBreakdown(model: HumanCosts, scale: number = 1) {
  const sub = (model.foodPerDay + model.waterPerDay + model.housingPerDay + model.healthcarePerDay + model.trainingPerDay) * scale
  return {
    food: +(model.foodPerDay * scale).toFixed(2),
    water: +(model.waterPerDay * scale).toFixed(2),
    housing: +(model.housingPerDay * scale).toFixed(2),
    healthcare: +(model.healthcarePerDay * scale).toFixed(2),
    training: +(model.trainingPerDay * scale).toFixed(2),
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

export default function CostBreakdown({
  countriesData,
  costModel,
  mobile = false,
  externalSelectedISO,
  onExternalSelect,
  locale = 'en',
}: {
  countriesData: CountryData[]
  costModel: CostModel
  mobile?: boolean
  externalSelectedISO?: string
  onExternalSelect?: (iso: string) => void
  locale?: Locale
}) {
  const [open, setOpen] = useState(false)
  const [localSelectedISO, setLocalSelectedISO] = useState('global')
  const isDe = locale === 'de'
  const labels = {
    title: isDe ? 'Kostenaufschlüsselung / Tag' : 'Cost Breakdown / Day',
    globalAverage: isDe ? 'Globaler Durchschnitt' : 'Global Average',
    humanTotal: isDe ? 'Mensch gesamt' : 'Human Total',
    robotTotal: isDe ? 'Roboter gesamt' : 'Robot Total',
    trigger: isDe ? 'KOSTEN\nDETAIL\nANSICHT' : 'COST\nDRILL\nDOWN',
    chartHuman: isDe ? 'MENSCH' : 'HUMAN',
    chartRobot: isDe ? 'ROBOTER' : 'ROBOT',
    food: isDe ? 'Essen' : 'Food',
    water: isDe ? 'Wasser' : 'Water',
    housing: isDe ? 'Wohnen' : 'Housing',
    healthcare: isDe ? 'Gesundheit' : 'Healthcare',
    training: isDe ? 'Ausbildung' : 'Training',
    overhead: isDe ? 'Overhead' : 'Overhead',
    amortization: isDe ? 'Abschreibung' : 'Amortization',
    electricity: isDe ? 'Strom' : 'Electricity',
    maintenance: isDe ? 'Wartung' : 'Maintenance',
    cloud: isDe ? 'Cloud/KI' : 'Cloud/AI',
  }

  const selectedISO = externalSelectedISO ?? localSelectedISO
  const setSelectedISO = onExternalSelect ?? setLocalSelectedISO

  const selectedCountry = selectedISO === 'global' ? null : countriesData.find(c => c.iso3 === selectedISO)
  const energyCost = selectedCountry ? selectedCountry.energyCostKWh : 0.15

  // Calculate scaling factor for human costs based on country minWage
  const baseHumanTotal = (costModel.global.human.foodPerDay + costModel.global.human.waterPerDay + costModel.global.human.housingPerDay + costModel.global.human.healthcarePerDay + costModel.global.human.trainingPerDay) * (1 + costModel.global.human.managementOverhead)
  const humanScale = selectedCountry ? (selectedCountry.minWage / baseHumanTotal) : 1

  const humanBreakdown = computeHumanBreakdown(costModel.global.human, humanScale)
  const robotBreakdown = computeRobotBreakdown(costModel.global.robot, energyCost)

  const humanTotal = Object.values(humanBreakdown).reduce((a, b) => a + b, 0)
  const robotTotal = Object.values(robotBreakdown).reduce((a, b) => a + b, 0)

  const chartData = [
    {
      name: labels.chartHuman,
      food: humanBreakdown.food,
      water: humanBreakdown.water,
      housing: humanBreakdown.housing,
      healthcare: humanBreakdown.healthcare,
      training: humanBreakdown.training,
      overhead: humanBreakdown.overhead,
    },
    {
      name: labels.chartRobot,
      amortization: robotBreakdown.amortization,
      electricity: robotBreakdown.electricity,
      maintenance: robotBreakdown.maintenance,
      cloud: robotBreakdown.cloud,
    },
  ]

  const content = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
        <span style={{ color: '#ff8c00', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {labels.title}
        </span>
        {!mobile && <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18 }}>✕</button>}
      </div>

      <select
        value={selectedISO}
        onChange={e => setSelectedISO(e.target.value)}
        style={{
          width: '100%', marginBottom: 16, background: '#0a0a1a', color: '#fff',
          border: '1px solid rgba(255,140,0,0.3)', padding: mobile ? '10px 12px' : '6px 8px',
          fontFamily: 'Roboto Mono, monospace', fontSize: mobile ? '12px' : '11px',
          borderRadius: mobile ? 12 : 0,
        }}
      >
        <option value="global">{labels.globalAverage}</option>
        {countriesData.map(c => <option key={c.iso3} value={c.iso3}>{c.name}</option>)}
      </select>

      <div style={{
        display: 'grid',
        gridTemplateColumns: mobile ? 'repeat(2, minmax(0, 1fr))' : '1fr',
        gap: 10,
        marginBottom: 12,
      }}>
        <div style={{ border: '1px solid rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.05)', borderRadius: mobile ? 16 : 0, padding: 12 }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>{labels.humanTotal}</div>
          <div style={{ color: '#00d4ff', fontSize: mobile ? 22 : 18, fontFamily: 'Orbitron, sans-serif' }}>${humanTotal.toFixed(2)}</div>
        </div>
        <div style={{ border: '1px solid rgba(255,140,0,0.22)', background: 'rgba(255,140,0,0.06)', borderRadius: mobile ? 16 : 0, padding: 12 }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>{labels.robotTotal}</div>
          <div style={{ color: '#ff8c00', fontSize: mobile ? 22 : 18, fontFamily: 'Orbitron, sans-serif' }}>${robotTotal.toFixed(2)}</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={mobile ? 250 : 280}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: mobile ? -20 : -10, bottom: 5 }}>
          <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} />
          <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid #ff8c00', fontSize: 10 }} />
          {!mobile && <Legend wrapperStyle={{ fontSize: 9 }} />}
          <Bar dataKey="food" stackId="cost" fill="#00d4ff" name={labels.food} />
          <Bar dataKey="water" stackId="cost" fill="#0099bb" name={labels.water} />
          <Bar dataKey="housing" stackId="cost" fill="#006688" name={labels.housing} />
          <Bar dataKey="healthcare" stackId="cost" fill="#004455" name={labels.healthcare} />
          <Bar dataKey="training" stackId="cost" fill="#002233" name={labels.training} />
          <Bar dataKey="overhead" stackId="cost" fill="#001122" name={labels.overhead} />
          <Bar dataKey="amortization" stackId="cost" fill="#ff8c00" name={labels.amortization} />
          <Bar dataKey="electricity" stackId="cost" fill="#cc7000" name={labels.electricity} />
          <Bar dataKey="maintenance" stackId="cost" fill="#994000" name={labels.maintenance} />
          <Bar dataKey="cloud" stackId="cost" fill="#662000" name={labels.cloud} />
        </BarChart>
      </ResponsiveContainer>
    </>
  )

  if (mobile) {
    return (
      <section style={{
        border: '1px solid rgba(255,140,0,0.22)',
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
        style={{
          position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)',
          zIndex: 30, background: 'rgba(0,0,0,0.7)', border: '1px solid #ff8c00',
          color: '#ff8c00', padding: '8px 12px', cursor: 'pointer',
          fontFamily: 'Orbitron, sans-serif', fontSize: '9px', letterSpacing: '0.15em',
          pointerEvents: 'auto', display: open ? 'none' : 'block',
          clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
        }}
      >
        {labels.trigger.split('\n')[0]}<br />{labels.trigger.split('\n')[1]}<br />{labels.trigger.split('\n')[2]}
      </button>

      <div style={{
        position: 'fixed', top: 0, right: open ? 0 : '-420px', width: 400, height: '100vh',
        background: 'rgba(3,3,3,0.95)', borderLeft: '1px solid rgba(255,140,0,0.4)',
        zIndex: 50, transition: 'right 0.3s ease', overflowY: 'auto',
        padding: '20px', pointerEvents: 'auto',
        fontFamily: 'Roboto Mono, monospace',
      }}>
        {content}
      </div>
    </>
  )
}
