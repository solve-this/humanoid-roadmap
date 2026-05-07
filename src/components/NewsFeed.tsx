import { useRef, useState } from 'react'

interface NewsArticle {
  id: string; title: string; url: string; source: string
  publishedAt: string; sentiment: 'positive' | 'negative' | 'neutral'
  aiSummary?: string; keyInsight?: string
}

interface LastUpdated { timestamp: string }

export default function NewsFeed({ articles, lastUpdated }: { articles: NewsArticle[]; lastUpdated: LastUpdated }) {
  const [paused, setPaused] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const tickerRef = useRef<HTMLDivElement>(null)

  const formattedDate = new Date(lastUpdated.timestamp).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  // duplicate for seamless loop
  const items = [...articles, ...articles]

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
        UPDATED {formattedDate}
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
              href={article.url}
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
