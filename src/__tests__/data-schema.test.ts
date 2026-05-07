import { describe, it, expect } from 'vitest'
import newsData from '../data/news.json'
import countriesData from '../data/countries.json'
import costModelData from '../data/cost-model.json'

describe('JSON data files', () => {
  it('news.json is a non-empty array with required fields', () => {
    expect(Array.isArray(newsData)).toBe(true)
    expect(newsData.length).toBeGreaterThan(0)
    for (const a of newsData) {
      expect(a).toHaveProperty('id')
      expect(a).toHaveProperty('title')
      expect(a).toHaveProperty('url')
      expect(a).toHaveProperty('source')
      expect(a).toHaveProperty('publishedAt')
      expect(a).toHaveProperty('sentiment')
    }
  })

  it('countries.json is a non-empty array with required fields', () => {
    expect(Array.isArray(countriesData)).toBe(true)
    expect(countriesData.length).toBeGreaterThan(0)
    for (const c of countriesData) {
      expect(c).toHaveProperty('iso3')
      expect(c).toHaveProperty('name')
      expect(c).toHaveProperty('lat')
      expect(c).toHaveProperty('lng')
      expect(c).toHaveProperty('adoptionScore')
    }
  })

  it('cost-model.json has global.human and global.robot keys', () => {
    expect(costModelData).toHaveProperty('global')
    expect(costModelData.global).toHaveProperty('human')
    expect(costModelData.global).toHaveProperty('robot')
  })

  it('news sentiments are valid enum values', () => {
    const valid = new Set(['positive', 'negative', 'neutral'])
    for (const a of newsData) {
      expect(valid.has(a.sentiment)).toBe(true)
    }
  })

  it('countries have valid iso3 codes (3 letters)', () => {
    for (const c of countriesData) {
      expect(c.iso3).toMatch(/^[A-Z]{3}$/)
    }
  })
})
