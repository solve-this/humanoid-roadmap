import { test, expect } from '@playwright/test'

test('year counter shows 2024 initially', async ({ page }) => {
  await page.goto('/humanoid-roadmap/')
  await expect(page.locator('text=2024').first()).toBeVisible()
})

test('cost drill down button is visible', async ({ page }) => {
  await page.goto('/humanoid-roadmap/')
  await expect(page.locator('button', { hasText: /DOWN/ }).first()).toBeVisible()
})

test('forecast button is visible', async ({ page }) => {
  await page.goto('/humanoid-roadmap/')
  await expect(page.locator('button', { hasText: /FORE/ }).first()).toBeVisible()
})
