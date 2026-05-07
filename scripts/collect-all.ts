import { collectNews } from './collect-news.js'
import { collectCountries } from './collect-countries.js'
import { collectCostModel } from './collect-cost-model.js'
import { collectForecastClaims } from './collect-forecast-claims.js'
import { collectJobWork } from './collect-job-work.js'
import { validateData } from './validate-data.js'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const aiProvider = process.env.GITHUB_TOKEN ? 'github-models' : (process.env.OPENAI_API_KEY ? 'openai' : 'none')
  const hasAI = aiProvider !== 'none'
  console.log(`Starting data collection... [AI agent: ${aiProvider}]`)
  await collectNews()
  await collectCountries()
  await collectCostModel()
  await collectForecastClaims()
  const jobWorkResult = await collectJobWork()
  validateData()

  const costModel = JSON.parse(readFileSync(join(__dirname, '../src/data/cost-model.json'), 'utf-8'))
  const humanGlobal = (costModel.global.human.foodPerDay + costModel.global.human.waterPerDay + costModel.global.human.housingPerDay + costModel.global.human.healthcarePerDay + costModel.global.human.trainingPerDay) * (1 + costModel.global.human.managementOverhead)
  const robot = costModel.global.robot
  const robotGlobal = robot.hardwarePrice / (robot.amortizationYears * 365) + robot.kWhPerDay * 0.15 + (robot.hardwarePrice * robot.maintenancePctPerYear) / 365 + robot.cloudInferencePerDay

  const snapshotsPath = join(__dirname, '../src/data/timeline-snapshots.json')
  const snapshots = JSON.parse(readFileSync(snapshotsPath, 'utf-8'))
  const today = new Date().toISOString().split('T')[0]
  if (!snapshots.find((s: { date: string }) => s.date === today)) {
    const countriesData = JSON.parse(readFileSync(join(__dirname, '../src/data/countries.json'), 'utf-8'))
    const topAdopters = [...countriesData].sort((a: { adoptionScore: number }, b: { adoptionScore: number }) => b.adoptionScore - a.adoptionScore).slice(0, 3).map((c: { iso3: string }) => c.iso3)
    snapshots.push({ date: today, humanCostGlobal: Math.round(humanGlobal * 100) / 100, robotCostGlobal: Math.round(robotGlobal * 100) / 100, topAdopters, aiEnriched: hasAI })
    writeFileSync(snapshotsPath, JSON.stringify(snapshots, null, 2))
  }

  const newsData = JSON.parse(readFileSync(join(__dirname, '../src/data/news.json'), 'utf-8'))
  const countriesData = JSON.parse(readFileSync(join(__dirname, '../src/data/countries.json'), 'utf-8'))
  const prevBuild = (() => { try { return JSON.parse(readFileSync(join(__dirname, '../src/data/last-updated.json'), 'utf-8')) } catch { return { buildNumber: 0 } } })()
  writeFileSync(join(__dirname, '../src/data/last-updated.json'), JSON.stringify({
    timestamp: new Date().toISOString(),
    buildNumber: (prevBuild.buildNumber ?? 0) + 1,
    articlesCollected: newsData.length,
    countriesUpdated: countriesData.length,
    aiProvider,
    aiEnrichedArticles: 0,
    aiEnrichedCountries: 0,
    forecastClaimsTotal: JSON.parse(readFileSync(join(__dirname, '../src/data/forecast-claims.json'), 'utf-8')).length,
    jobWorkSnapshotsNew: jobWorkResult.snapshots,
    jobRollupsNew: jobWorkResult.rollups,
  }, null, 2))
  console.log(`Data collection complete!`)
}

main()
  .then(() => { process.exit(0) })
  .catch(err => { console.error(err); process.exit(1) })
