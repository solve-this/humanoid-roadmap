import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AdoptionForecast from '../../components/AdoptionForecast'
import type { ForecastClaim, ForecastEvaluation } from '../../types/forecast-jobs'

const mockCountries = [
  { iso3: 'KOR', name: 'South Korea', adoptionScore: 87, replacementPct2027: 12, replacementPct2030: 32, replacementPct2035: 58 },
  { iso3: 'CHN', name: 'China', adoptionScore: 79, replacementPct2027: 11, replacementPct2030: 29, replacementPct2035: 55 },
]

const mockSnapshots = [
  { date: '2026-05-07', humanCostGlobal: 34.59, robotCostGlobal: 18.47, topAdopters: ['KOR', 'CHN'] },
]

const mockClaims: ForecastClaim[] = [
  {
    claim_id: 'KOR-2027-replacementPct-2026-05-07',
    created_at: '2026-05-07',
    scope: 'country',
    subject_id: 'KOR',
    forecast_horizon: 2027,
    metric: 'physicalLaborReplacementPct',
    predicted_value: 12,
    unit: 'percent',
    direction: 'increasing',
    baseline_value: 0,
    method_version: 'v1',
    rationale_refs: ['countries.json@v1'],
  },
]

const mockEvaluations: ForecastEvaluation[] = [
  {
    claim_id: 'KOR-2027-replacementPct-2026-05-07',
    evaluation_date: '2027-12-31',
    status: 'on_track',
    error_abs: 1.2,
    error_pct: 10,
    confidence: 'medium',
    notes: 'IFR robot density data confirms trajectory',
  },
]

describe('AdoptionForecast', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <AdoptionForecast countriesData={mockCountries} snapshots={mockSnapshots} />
    )
    expect(container).toBeTruthy()
  })

  it('renders the FORECAST trigger button', () => {
    render(<AdoptionForecast countriesData={mockCountries} snapshots={mockSnapshots} />)
    expect(screen.getByText('CAST').closest('button')).toBeTruthy()
  })

  it('opens the drawer when trigger is clicked', () => {
    render(<AdoptionForecast countriesData={mockCountries} snapshots={mockSnapshots} />)
    const triggerBtn = screen.getByText('CAST').closest('button')!
    fireEvent.click(triggerBtn)
    expect(screen.getByText(/Physical Labor Replacement/i)).toBeTruthy()
  })

  it('shows mode toggle buttons when open', () => {
    render(<AdoptionForecast countriesData={mockCountries} snapshots={mockSnapshots} />)
    // Click the trigger (button containing "CAST" text node)
    const triggerBtn = screen.getByText('CAST').closest('button')!
    fireEvent.click(triggerBtn)
    // Both mode tabs should be present
    const forecastTab = screen.getByRole('button', { name: /^Forecast$/i })
    const vsActualTab = screen.getByRole('button', { name: /^vs Actual$/i })
    expect(forecastTab).toBeTruthy()
    expect(vsActualTab).toBeTruthy()
  })

  it('defaults to forecast mode and shows chart', () => {
    render(<AdoptionForecast countriesData={mockCountries} snapshots={mockSnapshots} />)
    const triggerBtn = screen.getByText('CAST').closest('button')!
    fireEvent.click(triggerBtn)
    // In forecast mode the recharts line chart renders; South Korea appears in legend
    expect(screen.getByText(/South Korea/i)).toBeTruthy()
  })

  it('switches to vs-actual mode and shows tracking-in-progress state when no evaluations', () => {
    render(
      <AdoptionForecast
        countriesData={mockCountries}
        snapshots={mockSnapshots}
        forecastClaims={mockClaims}
        forecastEvaluations={[]}
      />
    )
    const triggerBtn = screen.getByText('CAST').closest('button')!
    fireEvent.click(triggerBtn)
    fireEvent.click(screen.getByRole('button', { name: /^vs Actual$/i }))
    expect(screen.getByText(/TRACKING IN PROGRESS/i)).toBeTruthy()
  })

  it('shows claim count summary in tracking-in-progress state', () => {
    render(
      <AdoptionForecast
        countriesData={mockCountries}
        snapshots={mockSnapshots}
        forecastClaims={mockClaims}
        forecastEvaluations={[]}
      />
    )
    const triggerBtn = screen.getByText('CAST').closest('button')!
    fireEvent.click(triggerBtn)
    fireEvent.click(screen.getByRole('button', { name: /^vs Actual$/i }))
    expect(screen.getByText(/1 forecast claims logged/i)).toBeTruthy()
  })

  it('shows evaluation rows when evaluations are provided', () => {
    render(
      <AdoptionForecast
        countriesData={mockCountries}
        snapshots={mockSnapshots}
        forecastClaims={mockClaims}
        forecastEvaluations={mockEvaluations}
      />
    )
    const triggerBtn = screen.getByText('CAST').closest('button')!
    fireEvent.click(triggerBtn)
    fireEvent.click(screen.getByRole('button', { name: /^vs Actual$/i }))
    expect(screen.getByText(/on.track/i)).toBeTruthy()
  })

  it('closes when the X button is clicked', () => {
    render(<AdoptionForecast countriesData={mockCountries} snapshots={mockSnapshots} />)
    const triggerBtn = screen.getByText('CAST').closest('button')!
    fireEvent.click(triggerBtn)
    const closeBtn = screen.getByText('✕')
    fireEvent.click(closeBtn)
    // Trigger button is visible again
    expect(screen.getByText('CAST').closest('button')).toBeTruthy()
  })
})
