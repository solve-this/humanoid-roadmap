import RSSParser from 'rss-parser'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { callAgent, parseAgentJSON } from './agent-runtime.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface NewsArticle {
  id: string
  title: string
  url: string
  source: string
  publishedAt: string
  keywords: string[]
  relevanceScore: number
  sentiment: 'positive' | 'negative' | 'neutral'
  aiSummary?: string
  keyInsight?: string
  countriesMentioned?: string[]
  industriesAffected?: string[]
  aiEnriched?: boolean
}

interface AgentArticleResult {
  relevanceScore: number
  sentiment: 'positive' | 'negative' | 'neutral'
  countriesMentioned: string[]
  industriesAffected: string[]
  keyInsight: string
  aiSummary: string
}

const FEEDS = [
  { url: 'https://therobotreport.com/feed/', source: 'The Robot Report' },
  { url: 'https://spectrum.ieee.org/rss/robotics', source: 'IEEE Spectrum' },
  { url: 'https://techcrunch.com/feed/', source: 'TechCrunch' },
]

const KEYWORDS = ['humanoid', 'robot', 'automation', 'labor replacement', 'job replacement', 'workforce']

export function scoreRelevance(title: string, content: string): number {
  const text = (title + ' ' + content).toLowerCase()
  let hits = 0
  for (const kw of KEYWORDS) { if (text.includes(kw)) hits++ }
  return Math.min(hits / KEYWORDS.length, 1.0)
}

export function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase()
  const negativeTerms = ['replace', 'displace', 'job loss', 'unemployment', 'displac']
  const positiveTerms = ['opportunity', 'growth', 'benefit', 'create']
  for (const t of negativeTerms) { if (lower.includes(t)) return 'negative' }
  for (const t of positiveTerms) { if (lower.includes(t)) return 'positive' }
  return 'neutral'
}

export function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>()
  return articles.filter(a => { if (seen.has(a.url)) return false; seen.add(a.url); return true })
}

async function enrichArticlesWithAgent(articles: NewsArticle[]): Promise<NewsArticle[]> {
  if (articles.length === 0) return articles
  const articleList = articles.map((a, i) => `[${i}] SOURCE: ${a.source}\nTITLE: ${a.title}`).join('\n\n')
  const userContent = `Analyze these ${articles.length} robotics/automation news articles and return a JSON array with one enrichment object per article (same order as input):\n\n${articleList}`
  let result
  try {
    result = await callAgent({ agentFile: 'news-analyst.md', userContent, maxTokens: 3072 })
  } catch (err) {
    console.warn('[collect-news] Agent call failed, using rule-based fallback:', (err as Error).message)
    return articles
  }
  if (!result) return articles
  const enrichments = parseAgentJSON<AgentArticleResult[]>(result)
  if (!enrichments) {
    console.warn('[collect-news] Agent response could not be parsed as JSON — skipping enrichment')
    return articles
  }
  if (enrichments.length !== articles.length) {
    console.warn(`[collect-news] Agent returned ${enrichments.length} items but expected ${articles.length} — skipping enrichment`)
    return articles
  }
  console.log(`[collect-news] Agent (${result.provider}/${result.model}) enriched ${articles.length} articles`)
  const validSentiments = ['positive', 'negative', 'neutral'] as const
  return articles.map((article, i) => {
    const e = enrichments[i]
    if (!e) return article
    return {
      ...article,
      relevanceScore: typeof e.relevanceScore === 'number' ? e.relevanceScore : article.relevanceScore,
      sentiment: validSentiments.includes(e.sentiment) ? e.sentiment : article.sentiment,
      countriesMentioned: Array.isArray(e.countriesMentioned) ? e.countriesMentioned : [],
      industriesAffected: Array.isArray(e.industriesAffected) ? e.industriesAffected : [],
      keyInsight: typeof e.keyInsight === 'string' ? e.keyInsight : undefined,
      aiSummary: typeof e.aiSummary === 'string' ? e.aiSummary : undefined,
      aiEnriched: true,
    }
  })
}

export async function collectNews(): Promise<void> {
  const dataPath = join(__dirname, '../src/data/news.json')
  let existing: NewsArticle[] = []
  try { existing = JSON.parse(readFileSync(dataPath, 'utf-8')) } catch { console.warn('Could not read existing news.json, starting fresh') }
  const parser = new RSSParser()
  const rawArticles: NewsArticle[] = []
  for (const feed of FEEDS) {
    try {
      const result = await parser.parseURL(feed.url)
      for (const item of result.items ?? []) {
        const title = item.title ?? ''
        const content = item.contentSnippet ?? item.content ?? ''
        const combined = (title + ' ' + content).toLowerCase()
        if (!KEYWORDS.some(kw => combined.includes(kw))) continue
        const url = item.link ?? item.guid ?? ''
        if (!url) continue
        rawArticles.push({
          id: Buffer.from(url).toString('base64').slice(0, 16),
          title, url,
          source: feed.source,
          publishedAt: item.isoDate ?? new Date().toISOString(),
          keywords: KEYWORDS.filter(kw => combined.includes(kw)),
          relevanceScore: scoreRelevance(title, content),
          sentiment: detectSentiment(title + ' ' + content),
        })
      }
    } catch (err) { console.warn(`Warning: Could not fetch feed ${feed.url}:`, (err as Error).message) }
  }
  const enrichedArticles = await enrichArticlesWithAgent(rawArticles)
  const RETENTION_DAYS = 90
  const ninetyDaysAgo = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
  const merged = deduplicateArticles([...enrichedArticles, ...existing])
    .filter(a => new Date(a.publishedAt).getTime() > ninetyDaysAgo)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 30)
  writeFileSync(dataPath, JSON.stringify(merged, null, 2))
  const enrichedCount = merged.filter(a => a.aiEnriched).length
  console.log(`collect-news: wrote ${merged.length} articles (${enrichedCount} AI-enriched)`)
}
