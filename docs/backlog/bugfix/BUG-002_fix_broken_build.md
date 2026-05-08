# BUG-002 – Fix Broken TypeScript Build

| Field | Value |
|-------|-------|
| **ID** | BUG-002 |
| **Title** | Fix broken TypeScript build |
| **Status** | Done |
| **Plan-Version** | 1 |
| **Skill** | null |
| **Deps** | none |

## Problem

`npm run build` (tsc -b && vite build) fails with multiple TypeScript errors after upgrading to TypeScript 6.x and Vite 8.x. Tests still pass but the production build is broken.

## Root Causes

1. **TypeScript 6 + `moduleResolution: "bundler"`** no longer auto-includes `@types/node`, causing `fs`, `path`, `process`, `Buffer`, `url` to be unknown in scripts and test files that transitively import scripts.
2. **TypeScript 5.8+ TS2882** – side-effect CSS imports (`import './index.css'`) now require type declarations.
3. **`countries.json` null entries** – AUS, KEN, ETH are missing `energyCostKWh`, TypeScript infers the field as `number | undefined`, causing type mismatch with component `CountryData` interfaces that require `number`.
4. **`App.tsx:427`** – `selectedCountry.energyCostKWh` is possibly `undefined` (derives from the null JSON values).
5. **`CostBreakdown.test.tsx`** – mock `CountryData` objects are missing required `minWage: number` field.

## Acceptance Criteria

- [ ] AC-1: `npm run build` exits with code 0 (no TypeScript errors, Vite build succeeds).
- [ ] AC-2: `npm run test:unit` exits with code 0 (all existing tests pass, none removed).
- [ ] AC-3: No new `noUnusedLocals` / `noUnusedParameters` TypeScript errors introduced.
- [ ] AC-4: The three previously null `energyCostKWh` entries in `countries.json` have real numeric values.

## Affected Files

- `tsconfig.json` – add `"types": ["node"]`
- `src/vite-env.d.ts` – create with `/// <reference types="vite/client" />`
- `src/data/countries.json` – fill AUS / KEN / ETH `energyCostKWh`
- `src/App.tsx` – nullish-coalesce `energyCostKWh ?? 0.15` at line 427
- `src/__tests__/components/CostBreakdown.test.tsx` – add `minWage` to mock objects

## Implementation Steps

1. Add `"types": ["node"]` to `tsconfig.json` `compilerOptions`.
2. Create `src/vite-env.d.ts` with `/// <reference types="vite/client" />`.
3. In `src/data/countries.json`, set `"energyCostKWh"` for AUS (0.22), KEN (0.18), ETH (0.07).
4. In `src/App.tsx` line 427, change to `(selectedCountry.energyCostKWh ?? 0.15) / 0.15`.
5. In `src/__tests__/components/CostBreakdown.test.tsx`, add `minWage: 15` (or appropriate) to all mock country objects.
6. Run `npm run build` and `npm run test:unit` to verify.

## Edge Cases

1. Adding `"types": ["node"]` in browser tsconfig may shadow browser globals – verify no conflicts.
2. `energyCostKWh` values for AUS/KEN/ETH should be realistic to not skew cost visualisations.
3. The `CostBreakdown` mock needs `minWage` because the component computes human cost scale from it.

## Test Specification

- Black-box: run `npm run build` → exit 0.
- Black-box: run `npm run test:unit` → 96 tests pass, 0 fail.
- Spot-check: `src/main.tsx` no longer produces TS2882.
- Spot-check: `scripts/agent-runtime.ts` no longer produces TS2591.
