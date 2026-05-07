import Ajv from 'ajv'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ajv = new Ajv()

const newsSchema = {
  type: 'array',
  items: {
    type: 'object',
    required: ['id', 'title', 'url', 'source', 'publishedAt', 'keywords', 'relevanceScore', 'sentiment'],
    properties: {
      id: { type: 'string' }, title: { type: 'string' }, url: { type: 'string' },
      source: { type: 'string' }, publishedAt: { type: 'string' },
      keywords: { type: 'array', items: { type: 'string' } },
      relevanceScore: { type: 'number', minimum: 0, maximum: 1 },
      sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
    },
  },
}

const countriesSchema = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['iso3', 'name', 'lat', 'lng', 'robotDensity', 'minWage', 'manufacturingShare', 'energyCostKWh', 'adoptionScore'],
    properties: {
      iso3: { type: 'string', minLength: 3, maxLength: 3 }, name: { type: 'string' },
      lat: { type: 'number' }, lng: { type: 'number' },
      robotDensity: { type: 'number', minimum: 0 }, minWage: { type: 'number', minimum: 0 },
      manufacturingShare: { type: 'number', minimum: 0 }, energyCostKWh: { type: 'number', minimum: 0 },
      adoptionScore: { type: 'number', minimum: 0, maximum: 100 },
    },
  },
}

const costModelSchema = {
  type: 'object',
  required: ['global', 'countries'],
  properties: {
    global: {
      type: 'object', required: ['human', 'robot'],
      properties: {
        human: { type: 'object', required: ['foodPerDay', 'waterPerDay', 'housingPerDay', 'healthcarePerDay', 'trainingPerDay', 'managementOverhead'] },
        robot: { type: 'object', required: ['hardwarePrice', 'amortizationYears', 'kWhPerDay', 'maintenancePctPerYear', 'cloudInferencePerDay', 'solarOffsetPct'] },
      },
    },
    countries: { type: 'object' },
  },
}

export function validateData(): void {
  const DATA_DIR = join(__dirname, '../src/data')
  const files = [
    { file: 'news.json', schema: newsSchema },
    { file: 'countries.json', schema: countriesSchema },
    { file: 'cost-model.json', schema: costModelSchema },
  ]
  let hasErrors = false
  for (const { file, schema } of files) {
    try {
      const data = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8'))
      const validate = ajv.compile(schema)
      if (!validate(data)) {
        console.error(`❌ ${file} validation failed:`, ajv.errorsText(validate.errors))
        hasErrors = true
      } else {
        console.log(`✓ ${file} is valid`)
      }
    } catch (err) { console.error(`❌ ${file} could not be read/parsed:`, (err as Error).message); hasErrors = true }
  }
  if (hasErrors) { console.error('Validation failed — aborting'); process.exit(1) }
  console.log('All data files are valid ✓')
}

if (import.meta.url === `file://${process.argv[1]}`) validateData()
