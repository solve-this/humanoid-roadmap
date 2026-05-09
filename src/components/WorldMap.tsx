import { useState, useEffect } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from '@vnedyalk0v/react19-simple-maps'
import geoData from '../data/countries-110m.json'
import type { Locale } from '../i18n'

interface CountryData {
  iso3: string; name: string; lat: number; lng: number
  adoptionScore: number; replacementPct2027: number; replacementPct2030: number; replacementPct2035: number
  robotDensity?: number; energyCostKWh?: number; minWage?: number
}


function interpolateColor(score: number): string {
  const t = Math.max(0, Math.min(1, score / 100))
  const r = Math.round(26 + t * (255 - 26))
  const g = Math.round(26 + t * (140 - 26))
  const b = Math.round(46 + t * (0 - 46))
  return `rgb(${r},${g},${b})`
}

// ISO 3166-1 numeric to ISO3 mapping for tracked countries
const numericToISO3: Record<string, string> = {
  '410': 'KOR', '276': 'DEU', '392': 'JPN', '156': 'CHN', '840': 'USA',
  '752': 'SWE', '702': 'SGP', '208': 'DNK', '056': 'BEL', '158': 'TWN',
  '203': 'CZE', '703': 'SVK', '348': 'HUN', '040': 'AUT', '246': 'FIN',
  '710': 'ZAF', '566': 'NGA', '818': 'EGY', '504': 'MAR', '404': 'KEN', '231': 'ETH',
  '076': 'BRA', '032': 'ARG', '152': 'CHL', '170': 'COL', '604': 'PER',
  '124': 'CAN', '484': 'MEX', '826': 'GBR', '250': 'FRA', '380': 'ITA', '724': 'ESP', '616': 'POL',
  '036': 'AUS', '356': 'IND', '704': 'VNM', '764': 'THA', '360': 'IDN'
}

export default function WorldMap({ scrollPercent, countriesData, locale = 'en' }: { scrollPercent: number; countriesData: CountryData[]; locale?: Locale }) {
  const [tooltip, setTooltip] = useState<{ country: CountryData; x: number; y: number } | null>(null)
  const [pulse, setPulse] = useState(false)
  const isDe = locale === 'de'
  const labels = {
    adoptionScore: isDe ? 'Adoptions-Score' : 'Adoption Score',
    laborDisplaced: isDe ? 'Arbeit ersetzt' : 'Labor displaced',
    robotDensity: isDe ? 'Roboterdichte' : 'Robot density',
    workers: isDe ? 'Arbeiter' : 'workers',
    low: isDe ? 'Niedrig' : 'Low',
    high: isDe ? 'Hoch' : 'High',
  }

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 1200)
    return () => clearInterval(interval)
  }, [])

  const yearKey = scrollPercent < 0.33 ? 'replacementPct2027' : scrollPercent < 0.66 ? 'replacementPct2030' : 'replacementPct2035'
  const yearLabel = scrollPercent < 0.33 ? '2027' : scrollPercent < 0.66 ? '2030' : '2035'
  const top5 = [...countriesData].sort((a, b) => b.adoptionScore - a.adoptionScore).slice(0, 5)
  const countryMap = new Map(countriesData.map(c => [c.iso3, c]))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2, opacity: 0.72, pointerEvents: 'none' }}>
      <ComposableMap
        projectionConfig={{ scale: 147 }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <Geographies geography={geoData}>
          {({ geographies }: { geographies: Array<{ rsmKey: string; id: string; properties: Record<string, unknown> }> }) =>
            geographies.map(geo => {
              const numericId = geo.id?.toString().padStart(3, '0')
              const iso3 = numericToISO3[numericId] ?? null
              const country = iso3 ? countryMap.get(iso3) : null
              const fillColor = country ? interpolateColor(country.adoptionScore) : '#1a1a2e'
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fillColor}
                  stroke="#0a0a1a"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none', cursor: country ? 'pointer' : 'default' },
                    hover: { fill: country ? '#ff8c00' : '#2a2a3e', outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                  onMouseEnter={(e: React.MouseEvent) => {
                    if (country) setTooltip({ country, x: e.clientX, y: e.clientY })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })
          }
        </Geographies>
        {top5.map(c => (
          <Marker key={c.iso3} coordinates={[c.lng, c.lat]}>
            <circle
              r={pulse ? 6 : 4}
              fill="#ff8c00"
              stroke="#fff"
              strokeWidth={1}
              style={{ transition: 'r 0.6s ease-in-out', pointerEvents: 'none' }}
            />
          </Marker>
        ))}
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed', left: tooltip.x + 12, top: tooltip.y - 10,
            background: 'rgba(0,0,0,0.85)', border: '1px solid #ff8c00',
            padding: '8px 12px', pointerEvents: 'none', zIndex: 50,
            fontFamily: 'Roboto Mono, monospace', fontSize: '11px', color: '#fff',
          }}
        >
          <div style={{ color: '#ff8c00', fontWeight: 'bold', marginBottom: 4 }}>{tooltip.country.name}</div>
          <div>{labels.adoptionScore}: {tooltip.country.adoptionScore}/100</div>
          <div>{labels.laborDisplaced} {yearLabel}: {tooltip.country[yearKey as keyof CountryData]}%</div>
          {tooltip.country.robotDensity !== undefined && <div>{labels.robotDensity}: {tooltip.country.robotDensity}/10k {labels.workers}</div>}
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: '80px', left: '20px',
        background: 'rgba(0,0,0,0.7)', padding: '8px 12px',
        border: '1px solid rgba(255,140,0,0.3)', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontFamily: 'Roboto Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {labels.adoptionScore}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontFamily: 'Roboto Mono, monospace' }}>{labels.low}</span>
          <div style={{ width: 80, height: 8, background: 'linear-gradient(to right, #1a1a2e, #ff8c00)', borderRadius: 2 }} />
          <span style={{ fontSize: '9px', color: '#ff8c00', fontFamily: 'Roboto Mono, monospace' }}>{labels.high}</span>
        </div>
      </div>
    </div>
  )
}
