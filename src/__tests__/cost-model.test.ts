import { describe, it, expect } from 'vitest'
import { computeHumanCost, computeRobotCost } from '../../scripts/collect-cost-model.js'

const defaultHuman = {
  foodPerDay: 8.5, waterPerDay: 0.5, housingPerDay: 15,
  healthcarePerDay: 4, trainingPerDay: 2, managementOverhead: 0.15,
}
const defaultRobot = {
  hardwarePrice: 20000, amortizationYears: 5, kWhPerDay: 6.88,
  maintenancePctPerYear: 0.08, cloudInferencePerDay: 1.5, solarOffsetPct: 0,
}

describe('cost model calculations', () => {
  it('human cost is greater than zero', () => {
    expect(computeHumanCost(defaultHuman)).toBeGreaterThan(0)
  })

  it('robot cost is less than human cost', () => {
    const human = computeHumanCost(defaultHuman)
    const robot = computeRobotCost(defaultRobot, 0.15)
    expect(robot).toBeLessThan(human)
  })

  it('solar offset reduces robot cost', () => {
    const base = computeRobotCost(defaultRobot, 0.15)
    const withSolar = computeRobotCost({ ...defaultRobot, solarOffsetPct: 0.5 }, 0.15)
    expect(withSolar).toBeLessThan(base)
  })

  it('higher energy cost increases robot cost', () => {
    const cheap = computeRobotCost(defaultRobot, 0.08)
    const expensive = computeRobotCost(defaultRobot, 0.40)
    expect(expensive).toBeGreaterThan(cheap)
  })

  it('management overhead is included in human cost', () => {
    const noOverhead = computeHumanCost({ ...defaultHuman, managementOverhead: 0 })
    const withOverhead = computeHumanCost(defaultHuman)
    expect(withOverhead).toBeGreaterThan(noOverhead)
  })
})
