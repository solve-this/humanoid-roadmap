import { test, expect } from '@playwright/test'

test('page loads and has canvas', async ({ page }) => {
  await page.goto('/humanoid-roadmap/')
  await expect(page.locator('canvas')).toBeVisible()
})

test('news ticker is visible at page bottom', async ({ page }) => {
  await page.goto('/humanoid-roadmap/')
  // The news ticker is a fixed element at the bottom
  const ticker = page.locator('div').filter({ hasText: /UPDATED/ }).first()
  await expect(ticker).toBeVisible()
})

test('page title is present', async ({ page }) => {
  await page.goto('/humanoid-roadmap/')
  await expect(page).toHaveTitle(/humanoid/i)
})
