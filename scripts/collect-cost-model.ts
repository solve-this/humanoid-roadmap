import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface HumanCosts { foodPerDay: number; waterPerDay: number; housingPerDay: number; healthcarePerDay: number; trainingPerDay: number; managementOverhead: number }
interface RobotCosts { hardwarePrice: number; amortizationYears: number; kWhPerDay: number; maintenancePctPerYear: number; cloudInferencePerDay: number; solarOffsetPct: number }
interface CostModel {
  global: { human: HumanCosts; robot: RobotCosts }
  countries: Record<string, { human?: Partial<HumanCosts>; robot?: Partial<RobotCosts>; humanTotalPerDay?: number; robotTotalPerDay?: number }>
}
interface CountryData { iso3: string; energyCostKWh: number; minWage: number }

export function computeHumanCost(h: HumanCosts): number {
  return (h.foodPerDay + h.waterPerDay + h.housingPerDay + h.healthcarePerDay + h.trainingPerDay) * (1 + h.managementOverhead)
}

export function computeRobotCost(r: RobotCosts, energyCostKWh: number): number {
  const amortization = r.hardwarePrice / (r.amortizationYears * 365)
  const electricity = r.kWhPerDay * energyCostKWh
  const maintenance = (r.hardwarePrice * r.maintenancePctPerYear) / 365
  const solar = electricity * r.solarOffsetPct
  return amortization + electricity + maintenance + r.cloudInferencePerDay - solar
}

export async function collectCostModel(): Promise<void> {
  const costPath = join(__dirname, '../src/data/cost-model.json')
  const countriesPath = join(__dirname, '../src/data/countries.json')
  const costModel: CostModel = JSON.parse(readFileSync(costPath, 'utf-8'))
  const countries: CountryData[] = JSON.parse(readFileSync(countriesPath, 'utf-8'))
  for (const country of countries) {
    const override = costModel.countries[country.iso3] ?? {}
    const human = { ...costModel.global.human, ...(override.human ?? {}) }
    const robot = { ...costModel.global.robot, ...(override.robot ?? {}) }
    costModel.countries[country.iso3] = {
      ...override,
      humanTotalPerDay: Math.round(computeHumanCost(human) * 100) / 100,
      robotTotalPerDay: Math.round(computeRobotCost(robot, country.energyCostKWh) * 100) / 100,
    }
  }
  writeFileSync(costPath, JSON.stringify(costModel, null, 2))
  console.log('collect-cost-model: updated cost model')
}
