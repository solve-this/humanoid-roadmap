import { useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import WorldMap from './components/WorldMap'
import NewsFeed from './components/NewsFeed'
import CostBreakdown from './components/CostBreakdown'
import AdoptionForecast from './components/AdoptionForecast'
import AIJobsLayer from './components/AIJobsLayer'
import newsDataJson from './data/news.json'
import countriesDataJson from './data/countries.json'
import costModelDataJson from './data/cost-model.json'
import timelineSnapshotsJson from './data/timeline-snapshots.json'
import lastUpdatedJson from './data/last-updated.json'
import forecastClaimsJson from './data/forecast-claims.json'
import forecastEvaluationsJson from './data/forecast-evaluations.json'
import jobTaskCatalogJson from './data/job-task-catalog.json'
import jobRollupsJson from './data/job-rollups.json'

interface TimelineFrame {
  percent: number
  year: number
  hCost: number
  rCost: number
  status: string
  text: string
  boxColor: string
}

const timelineData: TimelineFrame[] = [
  {
    percent: 0.00,
    year: 2024,
    hCost: 300,
    rCost: 25,
    status: 'ANALYSE: STATUS QUO',
    text: 'Biologische Arbeitskraft dominiert durch Flexibilität. Maschinen haben hohe Entwicklungskosten. Time-to-Skill eines Menschen ist lang (Jahre), aber kognitiv unerreicht.',
    boxColor: 'border-gray-800',
  },
  {
    percent: 0.33,
    year: 2027,
    hCost: 315,
    rCost: 17,
    status: 'ANALYSE: INDUSTRIE WENDEPUNKT',
    text: "Robotische Massenfertigung skaliert. 'Zero-Shot Learning' ermöglicht Skill-Transfers in Stunden. ROI in Fabriken sinkt auf < 6 Monate. Physische Routinen kippen.",
    boxColor: 'border-orange-500/30',
  },
  {
    percent: 0.66,
    year: 2030,
    hCost: 330,
    rCost: 12,
    status: 'ANALYSE: GLOBALE SKALIERUNG',
    text: 'Hardware-Preise < 15.000€. Die TCO (Total Cost of Ownership) der Maschine unterbietet das menschliche Existenzminimum (Lebenshaltung) selbst in Schwellenländern.',
    boxColor: 'border-orange-500/70',
  },
  {
    percent: 1.00,
    year: 2035,
    hCost: 350,
    rCost: 4,
    status: 'ANALYSE: ABSOLUTE DOMINANZ',
    text: 'Verdrängung abgeschlossen. Erneuerbare Energien drücken Betriebskosten auf < 4€/Tag. Agrar- und Lohnkosten machen biologische Konkurrenz ökonomisch unmöglich.',
    boxColor: 'border-red-600 shadow-[0_0_20px_rgba(255,0,0,0.3)]',
  },
]

const humanSpecs = [
  { label: 'Energy Source', value: 'Nutrition · 120W' },
  { label: 'Time to Skill', value: '~18 years' },
  { label: 'Downtime', value: '33% · 8h/day' },
  { label: 'Cooling', value: '3.0 L water/day' },
]

const robotSpecs = [
  { label: 'Energy Source', value: 'Li-Ion · 287W' },
  { label: 'Time to Skill', value: '~2 hours' },
  { label: 'Downtime', value: '~5% hot-swap' },
  { label: 'Materials', value: 'Lithium · Silicon' },
]

const MOBILE_BREAKPOINT = 768

// ──────────────────────────────────────────────
// Human Hologram SVG
// ──────────────────────────────────────────────
function HumanHologram({ heartRef }: { heartRef: React.Ref<SVGCircleElement> }) {
  return (
    <svg
      id="holo-human"
      className="holo-character"
      viewBox="0 0 200 600"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <linearGradient id="humanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#003a4d" stopOpacity="0.1" />
        </linearGradient>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#00d4ff" strokeWidth="0.5" strokeOpacity="0.2" />
        </pattern>
      </defs>
      <g stroke="#00d4ff" strokeWidth="1.5" fill="url(#humanGrad)">
        {/* Head */}
        <path d="M 100 30 C 115 30, 120 45, 120 60 C 120 80, 105 90, 100 90 C 95 90, 80 80, 80 60 C 80 45, 85 30, 100 30 Z" />
        {/* Body & Legs */}
        <path
          d="M 100 100 C 140 100, 150 120, 150 160 C 150 250, 120 300, 120 300 C 120 300, 130 450, 130 550 L 110 550 L 105 320 L 95 320 L 90 550 L 70 550 C 70 450, 80 300, 80 300 C 80 300, 50 250, 50 160 C 50 120, 60 100, 100 100 Z"
          fill="url(#grid)"
        />
        {/* Left Arm */}
        <path d="M 55 130 C 30 150, 20 250, 20 300 L 40 300 C 40 250, 50 160, 65 150 Z" />
        {/* Right Arm */}
        <path d="M 145 130 C 170 150, 180 250, 180 300 L 160 300 C 160 250, 150 160, 135 150 Z" />
      </g>
      {/* Neural nodes */}
      <circle cx="100" cy="60" r="3" fill="#fff" className="animate-pulse" />
      <circle ref={heartRef} id="human-heart" cx="90" cy="150" r="4" fill="#fff" className="animate-pulse" />
      <circle cx="100" cy="220" r="3" fill="#fff" />
    </svg>
  )
}

// ──────────────────────────────────────────────
// Robot Hologram SVG
// ──────────────────────────────────────────────
function RobotHologram({ coreRef }: { coreRef: React.Ref<SVGCircleElement> }) {
  return (
    <svg
      id="holo-robot"
      className="holo-character"
      viewBox="0 0 200 600"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <linearGradient id="robotGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff8c00" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#663800" stopOpacity="0.1" />
        </linearGradient>
        <pattern id="hex" width="10" height="17.3" patternUnits="userSpaceOnUse">
          <path
            d="M5 0 L10 2.8 L10 8.6 L5 11.5 L0 8.6 L0 2.8 Z"
            fill="none"
            stroke="#ff8c00"
            strokeWidth="0.5"
            strokeOpacity="0.3"
          />
        </pattern>
      </defs>
      <g stroke="#ff8c00" strokeWidth="2" fill="url(#robotGrad)">
        {/* Head */}
        <polygon points="85,30 115,30 125,50 115,80 85,80 75,50" />
        {/* Visor */}
        <rect x="80" y="45" width="40" height="10" fill="#fff" opacity="0.8" />
        {/* Torso */}
        <polygon points="100,90 160,110 160,150 130,280 130,300 70,300 70,280 40,150 40,110" fill="url(#hex)" />
        {/* Legs base */}
        <polygon points="70,310 130,310 120,550 80,550" />
        {/* Arms */}
        <rect x="30" y="120" width="20" height="150" />
        <rect x="150" y="120" width="20" height="150" />
        {/* Leg detail */}
        <rect x="75" y="320" width="15" height="230" />
        <rect x="110" y="320" width="15" height="230" />
      </g>
      {/* CPU core */}
      <circle ref={coreRef} id="robot-core" cx="100" cy="150" r="8" fill="#fff" className="animate-pulse" />
    </svg>
  )
}

// ──────────────────────────────────────────────
// HUD Connection Lines SVG overlay
// ──────────────────────────────────────────────
interface HudLinesProps {
  humanPanelRef: React.RefObject<HTMLDivElement | null>
  robotPanelRef: React.RefObject<HTMLDivElement | null>
  humanHeartRef: React.RefObject<SVGCircleElement | null>
  robotCoreRef: React.RefObject<SVGCircleElement | null>
}

function HudLines({ humanPanelRef, robotPanelRef, humanHeartRef, robotCoreRef }: HudLinesProps) {
  const lineHumRef = useRef<SVGPolylineElement>(null)
  const pHSRef = useRef<SVGCircleElement>(null)
  const pHERef = useRef<SVGCircleElement>(null)
  const lineRobRef = useRef<SVGPolylineElement>(null)
  const pRSRef = useRef<SVGCircleElement>(null)
  const pRERef = useRef<SVGCircleElement>(null)

  const updateLines = useCallback(() => {
    if (
      !humanPanelRef.current || !robotPanelRef.current ||
      !humanHeartRef.current || !robotCoreRef.current ||
      !lineHumRef.current || !lineRobRef.current
    ) return

    const rectH = humanPanelRef.current.getBoundingClientRect()
    const rectR = robotPanelRef.current.getBoundingClientRect()

    const startHx = rectH.right + 20
    const startHy = rectH.top + rectH.height / 2
    const startRx = rectR.left - 20
    const startRy = rectR.top + rectR.height / 2

    const rectTargetH = humanHeartRef.current.getBoundingClientRect()
    const endHx = rectTargetH.left + rectTargetH.width / 2
    const endHy = rectTargetH.top + rectTargetH.height / 2

    const rectTargetR = robotCoreRef.current.getBoundingClientRect()
    const endRx = rectTargetR.left + rectTargetR.width / 2
    const endRy = rectTargetR.top + rectTargetR.height / 2

    const elbowHx = startHx + (endHx - startHx) * 0.4
    lineHumRef.current.setAttribute('points', `${startHx},${startHy} ${elbowHx},${startHy} ${endHx},${endHy}`)
    pHSRef.current?.setAttribute('cx', String(startHx))
    pHSRef.current?.setAttribute('cy', String(startHy))
    pHERef.current?.setAttribute('cx', String(endHx))
    pHERef.current?.setAttribute('cy', String(endHy))

    const elbowRx = startRx - (startRx - endRx) * 0.4
    lineRobRef.current.setAttribute('points', `${startRx},${startRy} ${elbowRx},${startRy} ${endRx},${endRy}`)
    pRSRef.current?.setAttribute('cx', String(startRx))
    pRSRef.current?.setAttribute('cy', String(startRy))
    pRERef.current?.setAttribute('cx', String(endRx))
    pRERef.current?.setAttribute('cy', String(endRy))
  }, [humanPanelRef, robotPanelRef, humanHeartRef, robotCoreRef])

  useEffect(() => {
    let animId: number
    const loop = () => {
      updateLines()
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [updateLines])

  return (
    <svg style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 10, pointerEvents: 'none' }}>
      <polyline
        ref={lineHumRef}
        className="hud-path"
        stroke="#00d4ff"
        points="0,0 0,0 0,0"
        style={{ filter: 'drop-shadow(0 0 4px #00d4ff)' }}
      />
      <circle ref={pHSRef} r="2" cx="0" cy="0" fill="#00d4ff" />
      <circle ref={pHERef} r="2" cx="0" cy="0" fill="#00d4ff" />
      <polyline
        ref={lineRobRef}
        className="hud-path"
        stroke="#ff8c00"
        points="0,0 0,0 0,0"
        style={{ filter: 'drop-shadow(0 0 4px #ff8c00)' }}
      />
      <circle ref={pRSRef} r="2" cx="0" cy="0" fill="#ff8c00" />
      <circle ref={pRERef} r="2" cx="0" cy="0" fill="#ff8c00" />
    </svg>
  )
}

// ──────────────────────────────────────────────
// 3D Globe Canvas (Three.js)
// ──────────────────────────────────────────────
function GlobeCanvas({ scrollPercent }: { scrollPercent: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeMatRef = useRef<THREE.MeshPhongMaterial | null>(null)
  const atmosMatRef = useRef<THREE.MeshBasicMaterial | null>(null)
  const animIdRef = useRef<number>(0)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x030303)

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 10

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 3, 5)
    scene.add(dirLight)

    const earthGroup = new THREE.Group()

    const textureLoader = new THREE.TextureLoader()
    textureLoader.setCrossOrigin('anonymous')
    const earthTexture = textureLoader.load(
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg'
    )

    const globeMat = new THREE.MeshPhongMaterial({
      map: earthTexture,
      color: 0x00d4ff,
      emissive: new THREE.Color(0x001122),
      specular: new THREE.Color(0x333333),
      shininess: 15,
    })
    globeMatRef.current = globeMat
    earthGroup.add(new THREE.Mesh(new THREE.SphereGeometry(3.2, 64, 64), globeMat))

    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    })
    atmosMatRef.current = atmosMat
    earthGroup.add(new THREE.Mesh(new THREE.SphereGeometry(3.3, 32, 32), atmosMat))

    scene.add(earthGroup)

    const clock = new THREE.Clock()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate)
      earthGroup.rotation.y = clock.getElapsedTime() * 0.05
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animIdRef.current)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      const el = renderer.domElement
      if (el.parentNode === containerRef.current) containerRef.current?.removeChild(el)
    }
  }, [])

  useEffect(() => {
    if (!globeMatRef.current || !atmosMatRef.current) return
    const cyan = new THREE.Color(0x00d4ff)
    const orange = new THREE.Color(0xff8c00)
    const emCyan = new THREE.Color(0x001122)
    const emOrange = new THREE.Color(0x330a00)
    globeMatRef.current.color.lerpColors(cyan, orange, scrollPercent)
    globeMatRef.current.emissive.lerpColors(emCyan, emOrange, scrollPercent)
    atmosMatRef.current.color.lerpColors(cyan, orange, scrollPercent)
  }, [scrollPercent])

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1 }}
    />
  )
}

// ──────────────────────────────────────────────
// Main App
// ──────────────────────────────────────────────
export default function App() {
  const [year, setYear] = useState(2024)
  const [hCost, setHCost] = useState(300)
  const [rCost, setRCost] = useState(25)
  const [scrollPercent, setScrollPercent] = useState(0)
  const [snapFrame, setSnapFrame] = useState<TimelineFrame>(timelineData[0])
  const [showScrollHint, setShowScrollHint] = useState(true)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false)

  const humanPanelRef = useRef<HTMLDivElement>(null)
  const robotPanelRef = useRef<HTMLDivElement>(null)
  const humanHeartRef = useRef<SVGCircleElement>(null)
  const robotCoreRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      let pct = maxScroll > 0 ? window.scrollY / maxScroll : 0

      setShowScrollHint(pct <= 0.02)
      setScrollPercent(pct)

      let currentFrame = timelineData[0]
      let nextFrame = timelineData[timelineData.length - 1]

      for (let i = 0; i < timelineData.length - 1; i++) {
        if (pct >= timelineData[i].percent && pct <= timelineData[i + 1].percent) {
          currentFrame = timelineData[i]
          nextFrame = timelineData[i + 1]
          break
        }
      }

      const range = nextFrame.percent - currentFrame.percent
      const localPercent = range > 0 ? (pct - currentFrame.percent) / range : 0

      setYear(Math.round(currentFrame.year + (nextFrame.year - currentFrame.year) * localPercent))
      setHCost(Math.round(currentFrame.hCost + (nextFrame.hCost - currentFrame.hCost) * localPercent))
      setRCost(Math.round(currentFrame.rCost + (nextFrame.rCost - currentFrame.rCost) * localPercent))
      setSnapFrame(localPercent > 0.5 ? nextFrame : currentFrame)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const yearColorStyle = snapFrame.year >= 2030
    ? { color: '#ff8c00', textShadow: '0 0 20px rgba(255,140,0,0.5)' }
    : { color: 'white', textShadow: '0 0 20px rgba(255,255,255,0.5)' }

  const barColor = snapFrame.year >= 2030 ? '#ff8c00' : 'white'

  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#030303] text-white">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/12 blur-3xl" />
          <div className="absolute top-48 -left-12 h-52 w-52 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute bottom-24 right-0 h-56 w-56 rounded-full bg-orange-400/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_40%)]" />
        </div>

        <div className="relative z-10">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-black/75 px-4 py-4 backdrop-blur-xl">
            <div className="text-center">
              <div className="text-[9px] tracking-[0.28em] text-gray-400">PLANETARY DOMINANCE TIMELINE</div>
              <div
                className="mt-1 text-5xl font-black transition-colors duration-500"
                style={{ fontFamily: 'Orbitron, sans-serif', ...yearColorStyle }}
              >
                {year}
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full transition-all duration-150" style={{ width: `${scrollPercent * 100}%`, backgroundColor: barColor }} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/5 p-3">
                <div className="text-[9px] uppercase tracking-[0.16em] text-cyan-300/70">Human TCO / 24h</div>
                <div className="mt-1 flex items-end gap-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  <span className="text-3xl font-black text-white">{hCost}</span>
                  <span className="pb-1 text-sm text-cyan-300">€</span>
                </div>
              </div>
              <div className="rounded-2xl border border-orange-400/25 bg-orange-400/5 p-3">
                <div className="text-[9px] uppercase tracking-[0.16em] text-orange-300/70">Robot TCO / 24h</div>
                <div className="mt-1 flex items-end gap-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  <span className="text-3xl font-black text-white">{rCost}</span>
                  <span className="pb-1 text-sm text-orange-300">€</span>
                </div>
              </div>
            </div>
          </header>

          <main className="space-y-4 px-4 py-4">
            <section className={`rounded-[28px] border bg-black/55 p-4 backdrop-blur-md transition-colors duration-500 ${snapFrame.boxColor}`}>
              <div className="text-[10px] tracking-[0.2em] text-gray-400 uppercase">{snapFrame.status}</div>
              <p className="mt-3 text-sm leading-7 text-white/85">{snapFrame.text}</p>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300">Biological Sector</div>
                  <div className="mt-3 grid gap-2">
                    {humanSpecs.map(item => (
                      <div key={item.label} className="flex items-start justify-between gap-3 border-b border-white/5 pb-2 text-sm last:border-b-0 last:pb-0">
                        <span className="text-white/45">{item.label}</span>
                        <span className="text-right text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-400/20 bg-orange-400/5 p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-orange-300">Synthetic Sector</div>
                  <div className="mt-3 grid gap-2">
                    {robotSpecs.map(item => (
                      <div key={item.label} className="flex items-start justify-between gap-3 border-b border-white/5 pb-2 text-sm last:border-b-0 last:pb-0">
                        <span className="text-white/45">{item.label}</span>
                        <span className="text-right text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              {timelineData.map(frame => {
                const active = snapFrame.year === frame.year
                return (
                  <article
                    key={frame.year}
                    className={`min-h-[62vh] rounded-[28px] border p-5 backdrop-blur-md transition-all ${active ? 'border-orange-400/40 bg-white/6 shadow-[0_0_24px_rgba(255,140,0,0.14)]' : 'border-white/10 bg-white/[0.03]'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Milestone</div>
                        <div className="mt-1 text-4xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>{frame.year}</div>
                      </div>
                      <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                        {(frame.percent * 100).toFixed(0)}% of roadmap
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-cyan-400/20 bg-black/35 p-3">
                        <div className="text-[9px] uppercase tracking-[0.16em] text-cyan-300/70">Human cost</div>
                        <div className="mt-2 text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>{frame.hCost}€</div>
                      </div>
                      <div className="rounded-2xl border border-orange-400/20 bg-black/35 p-3">
                        <div className="text-[9px] uppercase tracking-[0.16em] text-orange-300/70">Robot cost</div>
                        <div className="mt-2 text-2xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>{frame.rCost}€</div>
                      </div>
                    </div>

                    <div className="mt-5 text-[10px] uppercase tracking-[0.2em] text-white/35">{frame.status}</div>
                    <p className="mt-3 text-base leading-7 text-white/82">{frame.text}</p>
                  </article>
                )
              })}
            </section>

            <AdoptionForecast
              mobile
              countriesData={countriesDataJson}
              snapshots={timelineSnapshotsJson}
              forecastClaims={forecastClaimsJson as import('./types/forecast-jobs').ForecastClaim[]}
              forecastEvaluations={forecastEvaluationsJson as import('./types/forecast-jobs').ForecastEvaluation[]}
            />
            <CostBreakdown mobile countriesData={countriesDataJson} costModel={costModelDataJson} />
            <AIJobsLayer
              mobile
              jobTaskCatalog={jobTaskCatalogJson as import('./types/forecast-jobs').JobTaskEntry[]}
              jobRollups={jobRollupsJson as import('./types/forecast-jobs').JobRollup[]}
            />
            <NewsFeed articles={newsDataJson as Array<{ id: string; title: string; url: string; source: string; publishedAt: string; sentiment: 'positive' | 'negative' | 'neutral'; aiSummary?: string; keyInsight?: string }>} lastUpdated={lastUpdatedJson} mobile />
          </main>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Scroll track — gives the page height to scroll against */}
      <div style={{ height: '500vh' }} />

      <GlobeCanvas scrollPercent={scrollPercent} />
      <WorldMap scrollPercent={scrollPercent} countriesData={countriesDataJson} />
      <HumanHologram heartRef={humanHeartRef} />
      <RobotHologram coreRef={robotCoreRef} />
      <HudLines
        humanPanelRef={humanPanelRef}
        robotPanelRef={robotPanelRef}
        humanHeartRef={humanHeartRef}
        robotCoreRef={robotCoreRef}
      />
      <div className="scanlines" />

      {/* Fixed UI layer */}
      <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between p-6 md:p-10">

        {/* ── Header ── */}
        <header className="flex justify-between items-start w-full">
          <div style={{ color: '#00d4ff', fontFamily: 'Orbitron, sans-serif' }} className="hidden md:block">
            <div className="text-[10px] tracking-[0.2em] opacity-70">BIOLOGISCHER SEKTOR</div>
            <div className="text-2xl font-bold glow-t">UNIT: HUMAN_01</div>
          </div>

          <div className="text-center flex flex-col items-center w-full md:w-auto">
            <div className="text-[9px] tracking-[0.3em] text-gray-400 mb-1">PLANETARY DOMINANCE TIMELINE</div>
            <div
              className="text-5xl md:text-6xl font-black transition-colors duration-500"
              style={{ fontFamily: 'Orbitron, sans-serif', ...yearColorStyle }}
            >
              {year}
            </div>
            <div className="mt-2 h-1 w-full max-w-[250px] bg-gray-900 rounded-full overflow-hidden relative">
              <div
                className="absolute top-0 left-0 h-full transition-all duration-75"
                style={{ width: `${scrollPercent * 100}%`, backgroundColor: barColor }}
              />
            </div>
          </div>

          <div style={{ color: '#ff8c00', fontFamily: 'Orbitron, sans-serif' }} className="text-right hidden md:block">
            <div className="text-[10px] tracking-[0.2em] opacity-70">SYNTHETISCHER SEKTOR</div>
            <div className="text-2xl font-bold glow-p">UNIT: OPTIMUS_G2</div>
          </div>
        </header>

        {/* ── Main HUD Panels ── */}
        <main className="flex justify-between items-center flex-1 w-full mt-4">

          {/* Human panel */}
          <div ref={humanPanelRef} className="inline-panel ml-0 md:ml-12" style={{ color: '#00d4ff' }}>
            <div>
              <div className="value-label">ENERGIEQUELLE &amp; EFFIZIENZ</div>
              <div className="value-data text-white glow-t">Nahrung (120W)</div>
            </div>
            <div>
              <div className="value-label">TIME-TO-SKILL (AUSBILDUNG)</div>
              <div className="value-data text-white glow-t">~18 Jahre</div>
            </div>
            <div>
              <div className="value-label">SYSTEM DOWNTIME (SCHLAF)</div>
              <div className="value-data text-white glow-t">33% (8h / Tag)</div>
            </div>
            <div>
              <div className="value-label">RESSOURCEN (KÜHLUNG)</div>
              <div className="value-data text-white glow-t">3.0 L Wasser / Tag</div>
            </div>
            <div className="mt-4">
              <div className="value-label animate-pulse" style={{ color: '#00d4ff' }}>
                TOTAL COST OF OWNERSHIP (24H)
              </div>
              <div
                className="text-5xl md:text-6xl font-black text-white glow-t mt-1 flex items-baseline"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                <span>{hCost}</span>
                <span className="text-2xl ml-1" style={{ color: '#00d4ff' }}>€</span>
              </div>
            </div>
          </div>

          {/* Robot panel */}
          <div ref={robotPanelRef} className="inline-panel text-right mr-0 md:mr-12" style={{ color: '#ff8c00' }}>
            <div>
              <div className="value-label" style={{ color: '#ff8c00' }}>ENERGIEQUELLE &amp; EFFIZIENZ</div>
              <div className="value-data text-white glow-p">Li-Ion Akku (287W)</div>
            </div>
            <div>
              <div className="value-label" style={{ color: '#ff8c00' }}>TIME-TO-SKILL (UPLOAD)</div>
              <div className="value-data text-white glow-p">~2 Stunden</div>
            </div>
            <div>
              <div className="value-label" style={{ color: '#ff8c00' }}>SYSTEM DOWNTIME (CHARGE)</div>
              <div className="value-data text-white glow-p">~5% Hot-Swap</div>
            </div>
            <div>
              <div className="value-label" style={{ color: '#ff8c00' }}>RESSOURCEN (HARDWARE)</div>
              <div className="value-data text-white glow-p">Lithium / Silizium</div>
            </div>
            <div className="mt-4">
              <div className="value-label animate-pulse" style={{ color: '#ff8c00' }}>
                TOTAL COST OF OWNERSHIP (24H)
              </div>
              <div
                className="text-5xl md:text-6xl font-black text-white glow-p mt-1 flex items-baseline justify-end"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                <span>{rCost}</span>
                <span className="text-2xl ml-1" style={{ color: '#ff8c00' }}>€</span>
              </div>
            </div>
          </div>
        </main>

        {/* ── Footer Briefing ── */}
        <footer className="w-full flex justify-center pb-2">
          <div
            className={`max-w-4xl bg-black/80 border-t border-b clip-box p-4 md:p-6 backdrop-blur-md text-center transition-colors duration-500 ${snapFrame.boxColor}`}
          >
            <div className="text-[10px] font-mono text-gray-400 tracking-[0.2em] mb-2 uppercase">
              {snapFrame.status}
            </div>
            <div className="text-base md:text-lg font-sans text-white leading-relaxed">
              {snapFrame.text}
            </div>
          </div>
        </footer>
      </div>

      {/* Scroll hint */}
      <div
        className="fixed bottom-12 left-1/2 -translate-x-1/2 text-white font-mono text-[10px] animate-pulse z-40 tracking-widest uppercase transition-opacity duration-300"
        style={{ opacity: showScrollHint ? 0.5 : 0 }}
      >
        [ SYSTEM SCROLL INITIATE ]
      </div>

      <CostBreakdown countriesData={countriesDataJson} costModel={costModelDataJson} />
      <AdoptionForecast
        countriesData={countriesDataJson}
        snapshots={timelineSnapshotsJson}
        forecastClaims={forecastClaimsJson as import('./types/forecast-jobs').ForecastClaim[]}
        forecastEvaluations={forecastEvaluationsJson as import('./types/forecast-jobs').ForecastEvaluation[]}
      />
      <AIJobsLayer
        jobTaskCatalog={jobTaskCatalogJson as import('./types/forecast-jobs').JobTaskEntry[]}
        jobRollups={jobRollupsJson as import('./types/forecast-jobs').JobRollup[]}
      />
      <NewsFeed articles={newsDataJson as Array<{ id: string; title: string; url: string; source: string; publishedAt: string; sentiment: 'positive' | 'negative' | 'neutral'; aiSummary?: string; keyInsight?: string }>} lastUpdated={lastUpdatedJson} />
    </>
  )
}
