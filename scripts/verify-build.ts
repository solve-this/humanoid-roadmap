import { existsSync, readdirSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '../dist')
let failed = false

function check(label: string, condition: boolean) {
  if (condition) { console.log(`✓ ${label}`) } else { console.error(`❌ ${label}`); failed = true }
}

check('dist/index.html exists', existsSync(join(distDir, 'index.html')))
const assets = existsSync(join(distDir, 'assets')) ? readdirSync(join(distDir, 'assets')) : []
check('dist/assets/ has .js file', assets.some(f => f.endsWith('.js')))
check('dist/assets/ has .css file', assets.some(f => f.endsWith('.css')))
check('dist/data/news.json exists', existsSync(join(distDir, 'data/news.json')))
check('dist/data/countries.json exists', existsSync(join(distDir, 'data/countries.json')))
check('dist/data/forecast-claims.json exists', existsSync(join(distDir, 'data/forecast-claims.json')))
check('dist/data/evidence-registry.json exists', existsSync(join(distDir, 'data/evidence-registry.json')))
check('dist/data/observed-outcomes.json exists', existsSync(join(distDir, 'data/observed-outcomes.json')))
check('dist/data/forecast-evaluations.json exists', existsSync(join(distDir, 'data/forecast-evaluations.json')))
check('dist/data/job-task-catalog.json exists', existsSync(join(distDir, 'data/job-task-catalog.json')))
check('dist/data/agent-work-observations.json exists', existsSync(join(distDir, 'data/agent-work-observations.json')))
check('dist/data/work-share-snapshots.json exists', existsSync(join(distDir, 'data/work-share-snapshots.json')))
check('dist/data/job-rollups.json exists', existsSync(join(distDir, 'data/job-rollups.json')))

try {
  const news = JSON.parse(readFileSync(join(distDir, 'data/news.json'), 'utf-8'))
  check('dist/data/news.json is non-empty array', Array.isArray(news) && news.length > 0)
} catch { check('dist/data/news.json is non-empty array', false) }

try {
  const countries = JSON.parse(readFileSync(join(distDir, 'data/countries.json'), 'utf-8'))
  check('dist/data/countries.json is non-empty array', Array.isArray(countries) && countries.length > 0)
} catch { check('dist/data/countries.json is non-empty array', false) }

if (failed) { console.error('Build verification failed!'); process.exit(1) }
console.log('All build verification checks passed!')
