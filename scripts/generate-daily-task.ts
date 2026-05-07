import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const dateStr = new Date().toISOString().split('T')[0]
  const newsData = JSON.parse(readFileSync(join(__dirname, '../src/data/news.json'), 'utf-8'))
  
  // Get top 3 latest enriched news
  const recentNews = newsData.slice(0, 3)
  const insights = recentNews.map((n: any) => `- [${n.sentiment.toUpperCase()}] ${n.title} (Source: ${n.source})`).join('\n')

  const taskId = `FEAT-${dateStr.replace(/-/g, '')}`
  const filename = join(__dirname, `../docs/backlog/features/${taskId}_daily_evolution.md`)

  const planContent = `# ${taskId}: Daily UI Evolution based on ${dateStr} Data

## Context
The daily data collection has fetched new articles and potential trends:
${insights}

## Acceptance Criteria
1. Analyze the new insights from the latest news data.
2. Update the frontend (e.g., \`src/App.tsx\` or a relevant component in \`src/components/\`) to feature a new "Breaking Trend" UI widget if the news indicates a major shift.
3. If no major shift is present, refine an existing component's styling (e.g., color scheme, micro-interactions) slightly to represent continuous development.
4. Ensure the React build does not break (\`npm run build\`).
5. Update \`src/data/timeline-snapshots.json\` logic in UI if necessary.

## Edge Cases
- Missing data fields in \`news.json\`.
- Build failures after UI modification.
- Component overflow on mobile devices.

## Public Interface
- Exported React components must remain standard default exports.

## Test Specification
- Verify the new UI elements render correctly.
- Run \`npm run test:unit\` to ensure nothing is broken.

## Plan-Version: 1
`

  writeFileSync(filename, planContent, 'utf-8')
  console.log(`Generated daily task plan: ${filename}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
