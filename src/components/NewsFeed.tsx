import { useRef, useState } from 'react'
import type { Locale } from '../i18n'
import { localeTag } from '../i18n'

interface NewsArticle {
  id: string; title: string; url: string; source: string
  publishedAt: string; sentiment: 'positive' | 'negative' | 'neutral'
  aiSummary?: string; keyInsight?: string
}

interface LastUpdated { timestamp: string }

const SOURCE_FALLBACK_URLS: Record<string, string> = {
  'The Robot Report': 'https://www.therobotreport.com/',
  'IEEE Spectrum': 'https://spectrum.ieee.org/robotics/',
  TechCrunch: 'https://techcrunch.com/tag/robotics/',
}
const PLACEHOLDER_DOMAINS = ['example.com']

function isPlaceholderUrl(hostname: string): boolean {
  return PLACEHOLDER_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))
}

function fallbackArticleUrl(article: NewsArticle): string {
  const fallbackUrl = SOURCE_FALLBACK_URLS[article.source]
  if (!fallbackUrl) {
    console.warn(`[news-feed] Missing fallback URL for source "${article.source}"`)
    return '#'
  }
  return fallbackUrl
}

function resolveArticleUrl(article: NewsArticle): string {
  try {
    const parsed = new URL(article.url)
    if (isPlaceholderUrl(parsed.hostname)) return fallbackArticleUrl(article)
    return article.url
  } catch {
    console.warn(`[news-feed] Invalid article URL for source "${article.source}": ${article.url}`)
    return fallbackArticleUrl(article)
  }
}

function articleDomain(article: NewsArticle): string {
  try {
    return new URL(resolveArticleUrl(article)).hostname.replace(/^www\./, '')
  } catch {
    return article.source
  }
}

export default function NewsFeed({
  articles,
  lastUpdated,
  mobile = false,
  locale = 'en',
}: {
  articles: NewsArticle[]
  lastUpdated: LastUpdated
  mobile?: boolean
  locale?: Locale
}) {
  const [paused, setPaused] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const tickerRef = useRef<HTMLDivElement>(null)
  const isDe = locale === 'de'
  const labels = {
    title: isDe ? 'News-Feed' : 'News Feed',
    subtitle: isDe ? 'Neueste Signale zu humanoiden Einsätzen und Arbeitswandel.' : 'Latest humanoid deployment and labor-shift signals.',
    updated: isDe ? 'Aktualisiert' : 'Updated',
    updatedUpper: isDe ? 'AKTUALISIERT' : 'UPDATED',
  }
  const localeValue = localeTag(locale)

  const formattedDate = new Date(lastUpdated.timestamp).toLocaleDateString(localeValue, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  // duplicate for seamless loop
  const items = [...articles, ...articles]

  if (mobile) {
    return (
      <section style={{
        border: '1px solid rgba(255,140,0,0.22)',
        borderRadius: 24,
        background: 'rgba(8,8,8,0.9)',
        padding: 16,
        fontFamily: 'Roboto Mono, monospace',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ color: '#ff8c00', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{labels.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 4 }}>{labels.subtitle}</div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, textAlign: 'right', lineHeight: 1.5 }}>
            {labels.updated}
            <br />
            {formattedDate}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {articles.slice(0, 5).map(article => {
            const resolvedUrl = resolveArticleUrl(article)
            return (
              <a
                key={article.id}
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  padding: '12px 14px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${article.sentiment === 'negative' ? 'rgba(255,140,0,0.25)' : 'rgba(0,212,255,0.22)'}`,
                }}
              >
                <div style={{ color: '#fff', fontSize: 13, lineHeight: 1.5 }}>{article.title}</div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 8,
                  color: article.sentiment === 'negative' ? '#ff8c00' : '#00d4ff',
                  fontSize: 10,
                }}>
                  <span>{article.source}</span>
                  <span style={{ color: 'rgba(255,255,255,0.32)' }}>{articleDomain(article)}</span>
                  <span style={{ color: 'rgba(255,255,255,0.32)' }}>
                    {new Date(article.publishedAt).toLocaleDateString(localeValue, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      background: 'rgba(0,0,0,0.88)', borderTop: '1px solid rgba(255,140,0,0.4)',
      height: 36, display: 'flex', alignItems: 'center', overflow: 'hidden',
    }}>
      {/* Last updated badge */}
      <div style={{
        flexShrink: 0, padding: '0 12px', borderRight: '1px solid rgba(255,140,0,0.3)',
        fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Roboto Mono, monospace',
        textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap',
      }}>
        {labels.updatedUpper} {formattedDate}
      </div>

      {/* Ticker */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div
          ref={tickerRef}
          style={{
            display: 'flex', alignItems: 'center', gap: 40,
            animation: paused ? 'none' : 'ticker-scroll 60s linear infinite',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => { setPaused(false); setHoveredId(null) }}
        >
          {items.map((article, idx) => (
            <a
              key={`${article.id}-${idx}`}
              href={resolveArticleUrl(article)}
              target="_blank"
              rel="noopener noreferrer"
              title={hoveredId === article.id ? `${article.title} — ${article.source}` : article.title}
              style={{
                color: article.sentiment === 'negative' ? '#ff8c00' : '#00d4ff',
                textDecoration: 'none', fontSize: '11px',
                fontFamily: 'Roboto Mono, monospace', cursor: 'pointer',
                padding: '0 8px', borderLeft: '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseEnter={() => setHoveredId(article.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              ▸ {article.title}
              {hoveredId === article.id && (
                <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
                  [{article.source}]
                </span>
              )}
            </a>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
