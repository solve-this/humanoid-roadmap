import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { callAgent, parseAgentJSON } from './agent-runtime.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface CountryData {
  iso3: string; name: string; lat: number; lng: number
  robotDensity: number; minWage: number; manufacturingShare: number; energyCostKWh: number
  adoptionScore: number; replacementPct2027: number; replacementPct2030: number; replacementPct2035: number
  forecastReasoning?: string; lastAIUpdate?: string
}

interface NewsArticle {
  title: string; source: string; keyInsight?: string
  countriesMentioned?: string[]; industriesAffected?: string[]; sentiment: string
}

interface AgentCountryForecast {
  adoptionScore: number; replacementPct2027: number; replacementPct2030: number; replacementPct2035: number; forecastReasoning: string
}

const ISO3_LIST = 'KOR;DEU;JPN;CHN;USA;SWE;SGP;DNK;BEL;TWN;CZE;SVK;HUN;AUT;FIN'
const HARDWARE_PRICE = 20000

export function computeAdoptionScore(c: CountryData): number {
  const densityScore = Math.min(c.robotDensity / 1000, 1) * 40
  const breakeven = 2027 + (HARDWARE_PRICE / (Math.max(c.minWage, 1) * 365)) * 0.5
  const breakevenScore = Math.max(0, Math.min(1, (2040 - breakeven) / 15)) * 25
  const mfgScore = Math.min(c.manufacturingShare / 35, 1) * 15
  const energyScore = Math.max(0, Math.min(1, (0.35 - c.energyCostKWh) / 0.35)) * 10
  const techScore = Math.min(c.robotDensity / 600, 1) * 10
  return Math.round(densityScore + breakevenScore + mfgScore + energyScore + techScore)
}

async function updateForecastsWithAgent(countries: CountryData[], recentNews: NewsArticle[]): Promise<CountryData[]> {
  const countryContext = countries.map(c =>
    `${c.iso3} (${c.name}): robotDensity=${c.robotDensity}, minWage=${c.minWage} USD/day, ` +
    `mfgShare=${c.manufacturingShare}%, energyCost=${c.energyCostKWh} USD/kWh, ` +
    `adoptionScore=${c.adoptionScore}, pct2027=${c.replacementPct2027}%, pct2030=${c.replacementPct2030}%, pct2035=${c.replacementPct2035}%`
  ).join('\n')
  const relevantNews = recentNews.filter(a => a.countriesMentioned && a.countriesMentioned.length > 0).slice(0, 15)
  const newsContext = relevantNews.length > 0
    ? relevantNews.map(a => `- [${a.sentiment}] ${a.source}: "${a.keyInsight ?? a.title}" (countries: ${(a.countriesMentioned ?? []).join(', ')})`).join('\n')
    : '(no country-specific news signals available this cycle)'
  const userContent = `Update humanoid adoption forecasts for these countries based on their economic data and recent news signals.\n\nCURRENT COUNTRY DATA:\n${countryContext}\n\nRECENT NEWS SIGNALS:\n${newsContext}\n\nReturn a JSON object mapping each ISO3 code to updated forecast values.`
  let result
  try {
    result = await callAgent({ agentFile: 'trend-forecaster.md', userContent, maxTokens: 4096 })
  } catch (err) {
    console.warn('[collect-countries] Agent call failed, using algorithmic fallback:', (err as Error).message)
    return countries.map(c => ({ ...c, adoptionScore: computeAdoptionScore(c) }))
  }
  if (!result) return countries.map(c => ({ ...c, adoptionScore: computeAdoptionScore(c) }))
  const forecasts = parseAgentJSON<Record<string, AgentCountryForecast>>(result)
  if (!forecasts) {
    console.warn('[collect-countries] Agent returned unparseable forecasts — using algorithmic fallback')
    return countries.map(c => ({ ...c, adoptionScore: computeAdoptionScore(c) }))
  }
  console.log(`[collect-countries] Agent (${result.provider}/${result.model}) updated ${Object.keys(forecasts).length} country forecasts`)
  const now = new Date().toISOString()
  return countries.map(c => {
    const f = forecasts[c.iso3]
    if (!f) return { ...c, adoptionScore: computeAdoptionScore(c) }
    return {
      ...c,
      adoptionScore: typeof f.adoptionScore === 'number' ? Math.max(0, Math.min(100, Math.round(f.adoptionScore))) : computeAdoptionScore(c),
      replacementPct2027: typeof f.replacementPct2027 === 'number' ? Math.max(0, Math.min(80, Math.round(f.replacementPct2027))) : c.replacementPct2027,
      replacementPct2030: typeof f.replacementPct2030 === 'number' ? Math.max(0, Math.min(80, Math.round(f.replacementPct2030))) : c.replacementPct2030,
      replacementPct2035: typeof f.replacementPct2035 === 'number' ? Math.max(0, Math.min(80, Math.round(f.replacementPct2035))) : c.replacementPct2035,
      forecastReasoning: typeof f.forecastReasoning === 'string' ? f.forecastReasoning : undefined,
      lastAIUpdate: now,
    }
  })
}

export async function collectCountries(): Promise<void> {
  const dataPath = join(__dirname, '../src/data/countries.json')
  const newsPath = join(__dirname, '../src/data/news.json')
  let countries: CountryData[] = []
  try { countries = JSON.parse(readFileSync(dataPath, 'utf-8')) } catch { console.warn('Could not read existing countries.json'); return }
  let recentNews: NewsArticle[] = []
  try { recentNews = JSON.parse(readFileSync(newsPath, 'utf-8')) } catch { console.warn('[collect-countries] Could not read news.json') }
  try {
    const mfgUrl = `https://api.worldbank.org/v2/country/${ISO3_LIST}/indicator/NV.IND.MANF.ZS?format=json&mrv=1`
    const res = await fetch(mfgUrl, { signal: AbortSignal.timeout(10000) })
    if (res.ok) {
      const data = await res.json() as [unknown, Array<{countryiso3code: string, value: number | null}>]
      for (const entry of data[1] ?? []) {
        if (entry.value == null) continue
        const country = countries.find(c => c.iso3 === entry.countryiso3code)
        if (country) country.manufacturingShare = entry.value
      }
    }
  } catch (err) { console.warn('Warning: World Bank API unavailable:', (err as Error).message) }
  const updated = await updateForecastsWithAgent(countries, recentNews)
  writeFileSync(dataPath, JSON.stringify(updated, null, 2))
  const aiUpdated = updated.filter(c => c.lastAIUpdate).length
  console.log(`collect-countries: updated ${updated.length} countries (${aiUpdated} AI-forecast)`)
}
