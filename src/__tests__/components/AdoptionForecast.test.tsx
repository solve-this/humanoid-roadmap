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
    expect(screen.getByLabelText('Forecast')).toBeTruthy()
  })

  it('opens the drawer when trigger is clicked', () => {
    render(<AdoptionForecast countriesData={mockCountries} snapshots={mockSnapshots} />)
    fireEvent.click(screen.getByLabelText('Forecast'))
    expect(screen.getByText(/Physical Labor Replacement/i)).toBeTruthy()
  })

  it('shows mode toggle buttons when open', () => {
    render(<AdoptionForecast countriesData={mockCountries} snapshots={mockSnapshots} />)
    fireEvent.click(screen.getByLabelText('Forecast'))
    expect(screen.getByRole('button', { name: /^Forecast$/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^vs Actual$/i })).toBeTruthy()
  })

  it('defaults to forecast mode and shows chart', () => {
    const { container } = render(
      <AdoptionForecast countriesData={mockCountries} snapshots={mockSnapshots} />
    )
    fireEvent.click(screen.getByLabelText('Forecast'))
    // In forecast mode the recharts responsive container is rendered
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy()
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
    fireEvent.click(screen.getByLabelText('Forecast'))
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
    fireEvent.click(screen.getByLabelText('Forecast'))
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
    fireEvent.click(screen.getByLabelText('Forecast'))
    fireEvent.click(screen.getByRole('button', { name: /^vs Actual$/i }))
    expect(screen.getByText(/on.track/i)).toBeTruthy()
  })

  it('closes when the X button is clicked', () => {
    render(<AdoptionForecast countriesData={mockCountries} snapshots={mockSnapshots} />)
    fireEvent.click(screen.getByLabelText('Forecast'))
    fireEvent.click(screen.getByText('✕'))
    // Trigger button is visible again
    expect(screen.getByLabelText('Forecast')).toBeTruthy()
  })
})
