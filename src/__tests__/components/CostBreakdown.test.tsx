import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import CostBreakdown from '../../components/CostBreakdown'

const mockCountries = [{ iso3: 'KOR', name: 'South Korea', energyCostKWh: 0.11 }]
const mockCostModel = {
  global: {
    human: { foodPerDay: 8.5, waterPerDay: 0.5, housingPerDay: 15, healthcarePerDay: 4, trainingPerDay: 2, managementOverhead: 0.15 },
    robot: { hardwarePrice: 20000, amortizationYears: 5, kWhPerDay: 6.88, maintenancePctPerYear: 0.08, cloudInferencePerDay: 1.5, solarOffsetPct: 0 }
  },
  countries: {}
}

describe('CostBreakdown', () => {
  it('renders without crashing', () => {
    const { container } = render(<CostBreakdown countriesData={mockCountries} costModel={mockCostModel} />)
    expect(container).toBeTruthy()
  })

  it('renders the COST DRILL DOWN trigger button', () => {
    const { getByRole } = render(<CostBreakdown countriesData={mockCountries} costModel={mockCostModel} />)
    const buttons = getByRole('button', { name: /COST/i })
    expect(buttons).toBeTruthy()
  })

  it('opens the drawer when button is clicked', () => {
    const { getAllByRole, getByText } = render(<CostBreakdown countriesData={mockCountries} costModel={mockCostModel} />)
    const buttons = getAllByRole('button')
    const triggerBtn = buttons.find(b => b.textContent?.includes('DRILL'))
    expect(triggerBtn).toBeDefined()
    if (triggerBtn) fireEvent.click(triggerBtn)
    expect(getByText('Cost Breakdown / Day')).toBeTruthy()
  })
})
