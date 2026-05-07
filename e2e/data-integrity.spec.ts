import { test, expect } from '@playwright/test'

test('news.json is a valid non-empty array', async ({ page }) => {
  const response = await page.goto('/humanoid-roadmap/data/news.json')
  expect(response?.status()).toBe(200)
  const json = await response?.json() as unknown[]
  expect(Array.isArray(json)).toBe(true)
  expect(json.length).toBeGreaterThan(0)
})

test('countries.json is a valid non-empty array', async ({ page }) => {
  const response = await page.goto('/humanoid-roadmap/data/countries.json')
  expect(response?.status()).toBe(200)
  const json = await response?.json() as unknown[]
  expect(Array.isArray(json)).toBe(true)
  expect(json.length).toBeGreaterThan(0)
})

test('cost-model.json has global key', async ({ page }) => {
  const response = await page.goto('/humanoid-roadmap/data/cost-model.json')
  expect(response?.status()).toBe(200)
  const json = await response?.json() as Record<string, unknown>
  expect(json).toHaveProperty('global')
})
