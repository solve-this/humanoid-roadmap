import { describe, it, expect, beforeEach } from 'vitest'
import { scoreRelevance, detectSentiment, deduplicateArticles } from '../../scripts/collect-news.js'
import type { NewsArticle } from '../../scripts/collect-news.js'

describe('scoreRelevance', () => {
  it('scores articles with multiple keyword hits higher', () => {
    const high = scoreRelevance('humanoid robot automation labor replacement', '')
    const low = scoreRelevance('humanoid', '')
    expect(high).toBeGreaterThan(low)
  })

  it('returns 0 for off-topic articles', () => {
    expect(scoreRelevance('stock market rally', 'finance quarterly results')).toBe(0)
  })

  it('never exceeds 1.0', () => {
    expect(scoreRelevance('humanoid robot automation labor replacement job replacement workforce', 'humanoid robot')).toBeLessThanOrEqual(1.0)
  })
})

describe('detectSentiment', () => {
  it('detects negative sentiment from displacement language', () => {
    expect(detectSentiment('robots will replace workers and cause job loss')).toBe('negative')
  })

  it('detects positive sentiment', () => {
    expect(detectSentiment('robots create opportunity and growth in manufacturing')).toBe('positive')
  })

  it('returns neutral when no strong signal', () => {
    expect(detectSentiment('new robot model announced with updated specs')).toBe('neutral')
  })
})

describe('deduplicateArticles', () => {
  it('removes duplicate URLs', () => {
    const articles: NewsArticle[] = [
      { id: '1', title: 'A', url: 'http://example.com/1', source: 'Test', publishedAt: new Date().toISOString(), keywords: [], relevanceScore: 0.8, sentiment: 'neutral' },
      { id: '2', title: 'B', url: 'http://example.com/1', source: 'Test', publishedAt: new Date().toISOString(), keywords: [], relevanceScore: 0.7, sentiment: 'neutral' },
      { id: '3', title: 'C', url: 'http://example.com/2', source: 'Test', publishedAt: new Date().toISOString(), keywords: [], relevanceScore: 0.6, sentiment: 'neutral' },
    ]
    expect(deduplicateArticles(articles)).toHaveLength(2)
  })

  it('keeps first occurrence on duplicate', () => {
    const articles: NewsArticle[] = [
      { id: '1', title: 'First', url: 'http://example.com/dup', source: 'Test', publishedAt: new Date().toISOString(), keywords: [], relevanceScore: 0.9, sentiment: 'neutral' },
      { id: '2', title: 'Second', url: 'http://example.com/dup', source: 'Test', publishedAt: new Date().toISOString(), keywords: [], relevanceScore: 0.5, sentiment: 'neutral' },
    ]
    const result = deduplicateArticles(articles)
    expect(result[0].title).toBe('First')
  })
})

describe('callAgent without API keys', () => {
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENAI_API_KEY
  })

  it('returns null when no API key is configured', async () => {
    const { callAgent } = await import('../../scripts/agent-runtime.js')
    const result = await callAgent({ agentFile: 'news-analyst.md', userContent: 'test' })
    expect(result).toBeNull()
  })
})
