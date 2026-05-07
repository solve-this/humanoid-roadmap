import { describe, it, expect } from 'vitest'
import countriesData from '../data/countries.json'

describe('country adoption scores', () => {
  it('all adoptionScores are between 0 and 100', () => {
    for (const c of countriesData) {
      expect(c.adoptionScore).toBeGreaterThanOrEqual(0)
      expect(c.adoptionScore).toBeLessThanOrEqual(100)
    }
  })

  it('KOR has the highest or near-highest adoption score', () => {
    const kor = countriesData.find(c => c.iso3 === 'KOR')
    expect(kor).toBeDefined()
    if (kor) {
      const max = Math.max(...countriesData.map(c => c.adoptionScore))
      expect(kor.adoptionScore).toBeGreaterThanOrEqual(max * 0.85)
    }
  })

  it('all replacement percentages are non-negative', () => {
    for (const c of countriesData) {
      expect(c.replacementPct2027).toBeGreaterThanOrEqual(0)
      expect(c.replacementPct2030).toBeGreaterThanOrEqual(0)
      expect(c.replacementPct2035).toBeGreaterThanOrEqual(0)
    }
  })

  it('2035 replacement > 2030 > 2027 for each country', () => {
    for (const c of countriesData) {
      expect(c.replacementPct2035).toBeGreaterThanOrEqual(c.replacementPct2030)
      expect(c.replacementPct2030).toBeGreaterThanOrEqual(c.replacementPct2027)
    }
  })
})
