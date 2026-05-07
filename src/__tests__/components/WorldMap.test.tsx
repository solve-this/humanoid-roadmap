import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import WorldMap from '../../components/WorldMap'

const mockCountries = [
  { iso3: 'KOR', name: 'South Korea', lat: 37.5, lng: 127.0, adoptionScore: 87, replacementPct2027: 12, replacementPct2030: 32, replacementPct2035: 58 },
  { iso3: 'DEU', name: 'Germany', lat: 51.17, lng: 10.45, adoptionScore: 74, replacementPct2027: 8, replacementPct2030: 24, replacementPct2035: 47 },
]

describe('WorldMap', () => {
  it('renders without crashing', () => {
    const { container } = render(<WorldMap scrollPercent={0} countriesData={mockCountries} />)
    expect(container).toBeTruthy()
  })

  it('renders the adoption score legend', () => {
    const { getByText } = render(<WorldMap scrollPercent={0} countriesData={mockCountries} />)
    expect(getByText('High')).toBeTruthy()
    expect(getByText('Low')).toBeTruthy()
    expect(getByText('Adoption Score')).toBeTruthy()
  })

  it('renders with different scroll percentages without crashing', () => {
    for (const pct of [0, 0.33, 0.66, 1.0]) {
      const { container } = render(<WorldMap scrollPercent={pct} countriesData={mockCountries} />)
      expect(container).toBeTruthy()
    }
  })
})
