# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> page title is present
- Location: e2e/smoke.spec.ts:15:1

# Error details

```
Error: expect(page).toHaveTitle(expected) failed

Expected pattern: /humanoid/i
Received string:  "Nexus HUD: Erweiterte Analyse"
Timeout: 5000ms

Call log:
  - Expect "toHaveTitle" with timeout 5000ms
    8 × unexpected value "Nexus HUD: Erweiterte Analyse"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic:
      - img
      - generic:
        - generic: Adoption Score
        - generic:
          - generic: Low
          - generic: High
    - img
    - img
    - img
    - generic:
      - banner:
        - generic:
          - generic: BIOLOGISCHER SEKTOR
          - generic: "UNIT: HUMAN_01"
        - generic:
          - generic: PLANETARY DOMINANCE TIMELINE
          - generic: "2024"
        - generic:
          - generic: SYNTHETISCHER SEKTOR
          - generic: "UNIT: OPTIMUS_G2"
      - main:
        - generic:
          - generic:
            - generic: ENERGIEQUELLE & EFFIZIENZ
            - generic: Nahrung (120W)
          - generic:
            - generic: TIME-TO-SKILL (AUSBILDUNG)
            - generic: ~18 Jahre
          - generic:
            - generic: SYSTEM DOWNTIME (SCHLAF)
            - generic: 33% (8h / Tag)
          - generic:
            - generic: RESSOURCEN (KÜHLUNG)
            - generic: 3.0 L Wasser / Tag
          - generic:
            - generic: TOTAL COST OF OWNERSHIP (24H)
            - generic:
              - generic: "300"
              - generic: €
        - generic:
          - generic:
            - generic: ENERGIEQUELLE & EFFIZIENZ
            - generic: Li-Ion Akku (287W)
          - generic:
            - generic: TIME-TO-SKILL (UPLOAD)
            - generic: ~2 Stunden
          - generic:
            - generic: SYSTEM DOWNTIME (CHARGE)
            - generic: ~5% Hot-Swap
          - generic:
            - generic: RESSOURCEN (HARDWARE)
            - generic: Lithium / Silizium
          - generic:
            - generic: TOTAL COST OF OWNERSHIP (24H)
            - generic:
              - generic: "25"
              - generic: €
      - contentinfo:
        - generic:
          - generic: "ANALYSE: STATUS QUO"
          - generic: Biologische Arbeitskraft dominiert durch Flexibilität. Maschinen haben hohe Entwicklungskosten. Time-to-Skill eines Menschen ist lang (Jahre), aber kognitiv unerreicht.
    - generic [ref=e6]: "[ SYSTEM SCROLL INITIATE ]"
    - button "COST DRILL DOWN" [ref=e7] [cursor=pointer]:
      - text: COST
      - text: DRILL
      - text: DOWN
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]: Cost Breakdown / Day
        - button "✕" [ref=e11] [cursor=pointer]
      - combobox [ref=e12]:
        - option "Global Average" [selected]
        - option "South Korea"
        - option "Singapore"
        - option "Germany"
        - option "Japan"
        - option "Sweden"
        - option "Denmark"
        - option "Belgium"
        - option "United States"
        - option "China"
        - option "Taiwan"
        - option "Czech Republic"
        - option "Slovakia"
        - option "Hungary"
        - option "Austria"
        - option "Finland"
      - generic [ref=e13]: "Total: Human $34.50/day vs Robot $17.87/day"
      - generic [ref=e15]:
        - list [ref=e17]:
          - listitem [ref=e18]:
            - img "Amortization legend icon" [ref=e19]
            - text: Amortization
          - listitem [ref=e21]:
            - img "Cloud/AI legend icon" [ref=e22]
            - text: Cloud/AI
          - listitem [ref=e24]:
            - img "Electricity legend icon" [ref=e25]
            - text: Electricity
          - listitem [ref=e27]:
            - img "Food legend icon" [ref=e28]
            - text: Food
          - listitem [ref=e30]:
            - img "Healthcare legend icon" [ref=e31]
            - text: Healthcare
          - listitem [ref=e33]:
            - img "Housing legend icon" [ref=e34]
            - text: Housing
          - listitem [ref=e36]:
            - img "Maintenance legend icon" [ref=e37]
            - text: Maintenance
          - listitem [ref=e39]:
            - img "Overhead legend icon" [ref=e40]
            - text: Overhead
          - listitem [ref=e42]:
            - img "Training legend icon" [ref=e43]
            - text: Training
          - listitem [ref=e45]:
            - img "Water legend icon" [ref=e46]
            - text: Water
        - application [ref=e48]:
          - generic [ref=e117]:
            - generic [ref=e118]:
              - generic [ref=e120]: HUMAN
              - generic [ref=e122]: ROBOT
            - generic [ref=e123]:
              - generic [ref=e125]: "0"
              - generic [ref=e127]: "9"
              - generic [ref=e129]: "18"
              - generic [ref=e131]: "27"
              - generic [ref=e133]: "36"
    - button "FORE CAST" [ref=e134] [cursor=pointer]:
      - text: FORE
      - text: CAST
    - generic [ref=e135]:
      - generic [ref=e136]:
        - generic [ref=e137]: Physical Labor Replacement Forecast (% by Country)
        - button "✕" [ref=e138] [cursor=pointer]
      - generic [ref=e140]:
        - list [ref=e142]:
          - listitem [ref=e143]:
            - img "Austria legend icon" [ref=e144]
            - text: Austria
          - listitem [ref=e146]:
            - img "China legend icon" [ref=e147]
            - text: China
          - listitem [ref=e149]:
            - img "Denmark legend icon" [ref=e150]
            - text: Denmark
          - listitem [ref=e152]:
            - img "Germany legend icon" [ref=e153]
            - text: Germany
          - listitem [ref=e155]:
            - img "Japan legend icon" [ref=e156]
            - text: Japan
          - listitem [ref=e158]:
            - img "Singapore legend icon" [ref=e159]
            - text: Singapore
          - listitem [ref=e161]:
            - img "South Korea legend icon" [ref=e162]
            - text: South Korea
          - listitem [ref=e164]:
            - img "Sweden legend icon" [ref=e165]
            - text: Sweden
          - listitem [ref=e167]:
            - img "Taiwan legend icon" [ref=e168]
            - text: Taiwan
          - listitem [ref=e170]:
            - img "United States legend icon" [ref=e171]
            - text: United States
        - application [ref=e173]:
          - generic [ref=e263]:
            - generic [ref=e264]:
              - generic [ref=e266]: "2024"
              - generic [ref=e268]: "2027"
              - generic [ref=e270]: "2030"
              - generic [ref=e272]: "2035"
            - generic [ref=e273]:
              - generic [ref=e275]: 0%
              - generic [ref=e277]: 20%
              - generic [ref=e279]: 40%
              - generic [ref=e281]: 60%
              - generic [ref=e283]: 80%
            - generic [ref=e284]: 50% threshold
    - generic [ref=e285]:
      - generic [ref=e286]: UPDATED May 6, 2026, 04:00 AM
      - generic [ref=e288]:
        - link "▸ Tesla Optimus Reaches 1000 Units Deployed in Factory" [ref=e289] [cursor=pointer]:
          - /url: https://example.com/tesla-optimus-1000
        - link "▸ South Korea Announces National Robotics Strategy 2030" [ref=e290] [cursor=pointer]:
          - /url: https://example.com/korea-robotics-2030
        - link "▸ Figure AI Raises $675M to Scale Robot Workforce" [ref=e291] [cursor=pointer]:
          - /url: https://example.com/figure-ai-funding
        - link "▸ Germany's IG Metall Warns of 2M Manufacturing Jobs at Risk" [ref=e292] [cursor=pointer]:
          - /url: https://example.com/ig-metall-warning
        - link "▸ Japan's Fanuc Unveils Solar-Powered Humanoid for Agriculture" [ref=e293] [cursor=pointer]:
          - /url: https://example.com/fanuc-solar-humanoid
        - link "▸ China Deploys 50,000 Humanoid Units in Shenzhen Electronics Factories" [ref=e294] [cursor=pointer]:
          - /url: https://example.com/china-shenzhen-deployment
        - link "▸ Singapore Pilots Humanoid Robot Healthcare Assistants" [ref=e295] [cursor=pointer]:
          - /url: https://example.com/singapore-healthcare-robots
        - 'link "▸ ILO Report: 300M Jobs Face Automation Displacement by 2035" [ref=e296] [cursor=pointer]':
          - /url: https://example.com/ilo-300m-jobs
        - link "▸ Tesla Optimus Reaches 1000 Units Deployed in Factory" [ref=e297] [cursor=pointer]:
          - /url: https://example.com/tesla-optimus-1000
        - link "▸ South Korea Announces National Robotics Strategy 2030" [ref=e298] [cursor=pointer]:
          - /url: https://example.com/korea-robotics-2030
        - link "▸ Figure AI Raises $675M to Scale Robot Workforce" [ref=e299] [cursor=pointer]:
          - /url: https://example.com/figure-ai-funding
        - link "▸ Germany's IG Metall Warns of 2M Manufacturing Jobs at Risk" [ref=e300] [cursor=pointer]:
          - /url: https://example.com/ig-metall-warning
        - link "▸ Japan's Fanuc Unveils Solar-Powered Humanoid for Agriculture" [ref=e301] [cursor=pointer]:
          - /url: https://example.com/fanuc-solar-humanoid
        - link "▸ China Deploys 50,000 Humanoid Units in Shenzhen Electronics Factories" [ref=e302] [cursor=pointer]:
          - /url: https://example.com/china-shenzhen-deployment
        - link "▸ Singapore Pilots Humanoid Robot Healthcare Assistants" [ref=e303] [cursor=pointer]:
          - /url: https://example.com/singapore-healthcare-robots
        - 'link "▸ ILO Report: 300M Jobs Face Automation Displacement by 2035" [ref=e304] [cursor=pointer]':
          - /url: https://example.com/ilo-300m-jobs
  - generic [ref=e305]: 0%
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test('page loads and has canvas', async ({ page }) => {
  4  |   await page.goto('/humanoid-roadmap/')
  5  |   await expect(page.locator('canvas')).toBeVisible()
  6  | })
  7  | 
  8  | test('news ticker is visible at page bottom', async ({ page }) => {
  9  |   await page.goto('/humanoid-roadmap/')
  10 |   // The news ticker is a fixed element at the bottom
  11 |   const ticker = page.locator('div').filter({ hasText: /UPDATED/ }).first()
  12 |   await expect(ticker).toBeVisible()
  13 | })
  14 | 
  15 | test('page title is present', async ({ page }) => {
  16 |   await page.goto('/humanoid-roadmap/')
> 17 |   await expect(page).toHaveTitle(/humanoid/i)
     |                      ^ Error: expect(page).toHaveTitle(expected) failed
  18 | })
  19 | 
```