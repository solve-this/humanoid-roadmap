import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface CountryData {
  iso3: string
  replacementPct2027: number
  replacementPct2030: number
  replacementPct2035: number
}

interface ForecastClaim {
  claim_id: string
  created_at: string
  scope: 'global' | 'country' | 'industry' | 'job-task'
  subject_id: string
  forecast_horizon: 2027 | 2030 | 2035
  metric: string
  predicted_value: number
  unit: string
  direction: 'increasing' | 'decreasing' | 'stable'
  baseline_value: number
  method_version: string
  rationale_refs: string[]
}

/**
 * Appends immutable forecast claims derived from the current countries.json
 * forecast values. Claims are keyed by subject_id + horizon + metric to ensure
 * idempotency across daily runs — an existing claim is never overwritten.
 */
export async function collectForecastClaims(): Promise<number> {
  const countriesPath = join(__dirname, '../src/data/countries.json')
  const claimsPath = join(__dirname, '../src/data/forecast-claims.json')

  const countries: CountryData[] = JSON.parse(readFileSync(countriesPath, 'utf-8'))
  const existing: ForecastClaim[] = existsSync(claimsPath)
    ? JSON.parse(readFileSync(claimsPath, 'utf-8'))
    : []

  const today = new Date().toISOString().split('T')[0]
  // Deduplicate by the natural key: subject + horizon + metric (claim is immutable once written)
  const existingKeys = new Set(
    existing.map(c => `${c.subject_id}:${c.forecast_horizon}:${c.metric}`)
  )

  const newClaims: ForecastClaim[] = []

  for (const country of countries) {
    const horizons: { year: 2027 | 2030 | 2035; value: number }[] = [
      { year: 2027, value: country.replacementPct2027 },
      { year: 2030, value: country.replacementPct2030 },
      { year: 2035, value: country.replacementPct2035 },
    ]
    for (const { year, value } of horizons) {
      const key = `${country.iso3}:${year}:physicalLaborReplacementPct`
      if (!existingKeys.has(key)) {
        newClaims.push({
          claim_id: `${country.iso3}-${year}-replacementPct-${today}`,
          created_at: today,
          scope: 'country',
          subject_id: country.iso3,
          forecast_horizon: year,
          metric: 'physicalLaborReplacementPct',
          predicted_value: value,
          unit: 'percent',
          direction: 'increasing',
          baseline_value: 0,
          method_version: 'v1',
          rationale_refs: ['countries.json@v1', 'timeline-snapshots.json'],
        })
        existingKeys.add(key)
      }
    }
  }

  if (newClaims.length > 0) {
    writeFileSync(claimsPath, JSON.stringify([...existing, ...newClaims], null, 2))
    console.log(`✓ forecast-claims: ${newClaims.length} new claims appended (total: ${existing.length + newClaims.length})`)
  } else {
    console.log(`✓ forecast-claims: all claims up to date (${existing.length} total)`)
  }

  return newClaims.length
}

if (import.meta.url === `file://${process.argv[1]}`) {
  collectForecastClaims()
    .then(() => { process.exit(0) })
    .catch(err => { console.error(err); process.exit(1) })
}
