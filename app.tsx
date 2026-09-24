import { useState, useRef, useContext, createContext } from 'react'

// ── Theme palettes ────────────────────────────────────────────────────────
const DARK_C = {
  bg:        '#080A0F',
  surface:   '#111318',
  surface2:  '#181B22',
  border:    'rgba(255,255,255,0.07)',
  coral:     '#E8856A',
  coralDim:  'rgba(232,133,106,0.18)',
  text:      '#F2F2F7',
  muted:     'rgba(242,242,247,0.45)',
  dim:       'rgba(242,242,247,0.22)',
  blue:      '#5B8AF0',
  blueDim:   'rgba(91,138,240,0.15)',
  green:     '#34C98A',
  greenDim:  'rgba(52,201,138,0.14)',
  purple:    '#9B7FEA',
  purpleDim: 'rgba(155,127,234,0.15)',
  amber:     '#F5A623',
  amberDim:  'rgba(245,166,35,0.15)',
  navBg:     'rgba(8,10,15,0.94)',
}

const LIGHT_C = {
  bg:        '#EFF1F8',
  surface:   '#FFFFFF',
  surface2:  '#E4E7F2',
  border:    'rgba(0,0,0,0.08)',
  coral:     '#D4674E',
  coralDim:  'rgba(212,103,78,0.12)',
  text:      '#0D0F14',
  muted:     'rgba(13,15,20,0.55)',
  dim:       'rgba(13,15,20,0.32)',
  blue:      '#3060D8',
  blueDim:   'rgba(48,96,216,0.10)',
  green:     '#1A9E62',
  greenDim:  'rgba(26,158,98,0.10)',
  purple:    '#6845C4',
  purpleDim: 'rgba(104,69,196,0.10)',
  amber:     '#B87800',
  amberDim:  'rgba(184,120,0,0.10)',
  navBg:     'rgba(239,241,248,0.94)',
}

// Mutable palette — root App writes to this before each render subtree
const C: typeof DARK_C = { ...DARK_C }

type ThemeType = 'dark' | 'light'
const ThemeCtx = createContext<{ theme: ThemeType; toggle: () => void }>({ theme: 'dark', toggle: () => {} })

// ─────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────

function SoundwaveMark({ size = 28, color = C.coral }: { size?: number; color?: string }) {
  const bars = [3, 5, 8, 11, 14, 11, 8, 5, 3]
  const w = size, h = size
  const barW = w / (bars.length * 1.8)
  const gap = (w - barW * bars.length) / (bars.length - 1)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      {bars.map((v, i) => {
        const bh = (v / 14) * h * 0.85
        const x = i * (barW + gap)
        const y = (h - bh) / 2
        return <rect key={i} x={x} y={y} width={barW} height={bh} rx={barW / 2} fill={color} opacity={0.85 + (i === 4 ? 0.15 : 0)} />
      })}
    </svg>
  )
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <div style={{ position: 'relative' }}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2.5C7.96 2.5 5.5 4.96 5.5 8v4.5L4 14h14l-1.5-1.5V8c0-3.04-2.46-5.5-5.5-5.5z"
          stroke={active ? C.coral : C.muted} strokeWidth="1.5" strokeLinecap="round"
          fill={active ? C.coralDim : 'none'} />
        <path d="M9 14.5c0 1.1.9 2 2 2s2-.9 2-2" stroke={active ? C.coral : C.muted} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      {active && <div style={{ position: 'absolute', top: 0, right: 0, width: 7, height: 7, borderRadius: '50%', background: C.coral, border: `1.5px solid ${C.bg}`, animation: 'notification-dot 2s ease infinite' }} />}
    </div>
  )
}

function ProgressRing({ pct, label, sublabel }: { pct: number; label: string; sublabel: string }) {
  const R = 72, stroke = 7
  const circ = 2 * Math.PI * R
  const offset = circ * (1 - pct / 100)
  return (
    <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', background: `radial-gradient(circle, ${C.coralDim} 0%, transparent 70%)`, animation: 'pulse-ring 3s ease infinite' }} />
      <svg width="180" height="180" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="90" cy="90" r={R} fill="none" stroke={C.border} strokeWidth={stroke} />
        <circle cx="90" cy="90" r={R} fill="none" stroke="url(#ringGrad)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F0A882" /><stop offset="100%" stopColor={C.coral} />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, color: C.text, lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 500, letterSpacing: 0.3 }}>{label}</span>
        <span style={{ fontSize: 9, color: C.dim, marginTop: 2, letterSpacing: 0.5, textTransform: 'uppercase' }}>{sublabel}</span>
      </div>
    </div>
  )
}

function AudioWaveform({ active }: { active: boolean }) {
  const BARS = 38
  const durations = Array.from({ length: BARS }, (_, i) => 0.5 + Math.sin(i * 0.7) * 0.3 + (i % 3) * 0.1)
  const heights = Array.from({ length: BARS }, (_, i) => 20 + Math.abs(Math.sin(i * 0.9 + 1)) * 60)
  return (
    <div style={{ flex: 1, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
      {Array.from({ length: BARS }).map((_, i) => {
        const isCenter = Math.abs(i - BARS / 2) < 4
        const opacity = active ? (isCenter ? 1 : 0.4 + Math.abs(Math.sin(i * 0.5)) * 0.4) : 0.12
        return (
          <div key={i} className={active ? 'wave-bar' : ''} style={{
            width: 3, height: `${heights[i]}%`, maxHeight: '100%',
            background: isCenter ? C.coral : `rgba(232,133,106,${opacity})`,
            borderRadius: 2, transformOrigin: 'center',
            '--dur': `${durations[i].toFixed(2)}s`,
            animationDelay: `${(i * 0.04).toFixed(2)}s`,
            transition: 'opacity 0.4s',
          } as React.CSSProperties} />
        )
      })}
    </div>
  )
}

type Mode = 'transparent' | 'balanced' | 'deep'
const MODES: { id: Mode; label: string; sub: string }[] = [
  { id: 'transparent', label: 'Transparent', sub: 'Full ambient' },
  { id: 'balanced',    label: 'Balanced',    sub: 'Optimal blend' },
  { id: 'deep',        label: 'Deep Quiet',  sub: 'Max ANC' },
]

const LOG_ENTRIES = [
  { time: '9:14 AM',  label: 'Deep Quiet activated',   context: 'Focus session detected',  icon: '🎯', color: '#5B8AF0' },
  { time: '8:52 AM',  label: 'Switched to Balanced',    context: 'Meeting ended',            icon: '⚖️', color: '#E8856A' },
  { time: '8:30 AM',  label: 'Transparent mode',        context: 'Morning commute',          icon: '🚇', color: '#34C98A' },
  { time: '7:45 AM',  label: 'Device wake detected',    context: 'SensorySync connected',    icon: '✦',  color: '#6B7280' },
]

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 20, ...style }}>
      {children}
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: C.dim }}>{children}</p>
}

function NavTab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 0 6px', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', color: active ? C.coral : C.dim, transition: 'color 0.2s' }}>
      <div style={{ transition: 'transform 0.2s', transform: active ? 'translateY(-1px)' : 'none' }}>{icon}</div>
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: 0.3 }}>{label}</span>
      {active && <div style={{ width: 18, height: 2, borderRadius: 1, background: C.coral, marginTop: 1 }} />}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Dashboard screen
// ─────────────────────────────────────────────────────────────────────────
function DashboardScreen() {
  const { theme, toggle: toggleTheme } = useContext(ThemeCtx)
  const [mode, setMode] = useState<Mode>('balanced')
  const [intensity, setIntensity] = useState(68)
  const [notifOpen, setNotifOpen] = useState(false)
  const [hasNotif, setHasNotif] = useState(true)
  const sliderRef = useRef<HTMLInputElement>(null)

  const displayPct = mode === 'deep' ? 98 : mode === 'transparent' ? 12 : 84

  return (
    <>
      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 4px 6px', color: C.muted, fontSize: 12, fontWeight: 500 }}>
        <span>9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width="16" height="10" viewBox="0 0 16 10" fill={C.muted}><rect x="0" y="5" width="3" height="5" rx="1"/><rect x="4.5" y="3" width="3" height="7" rx="1"/><rect x="9" y="1" width="3" height="9" rx="1"/><rect x="13.5" y="0" width="2.5" height="10" rx="1" opacity="0.3"/></svg>
          <div style={{ display: 'flex', gap: 1 }}>
            <div style={{ width: 22, height: 11, border: `1.5px solid ${C.muted}`, borderRadius: 3, padding: '1.5px 2px', display: 'flex', gap: 1 }}>
              <div style={{ flex: 1, background: C.green, borderRadius: 1 }} />
              <div style={{ flex: 1, background: C.green, borderRadius: 1 }} />
              <div style={{ flex: 0.5, background: C.muted, borderRadius: 1, opacity: 0.4 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Brand header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, #1A1D24 0%, #1E2230 100%)`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SoundwaveMark size={22} color={C.coral} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.4, color: C.text, lineHeight: 1.1 }}>SensorySync</div>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 400, letterSpacing: 0.4, marginTop: 1 }}>Adaptive audio · Active</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* ── Theme toggle ── */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ width: 40, height: 40, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', transition: 'all 0.2s' }}
          >
            {theme === 'dark' ? (
              /* Sun icon — click to go light */
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="3.5" stroke={C.amber} strokeWidth="1.5"/>
                <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.41 1.41M13.37 13.37l1.41 1.41M3.22 14.78l1.41-1.41M13.37 4.63l1.41-1.41" stroke={C.amber} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              /* Moon icon — click to go dark */
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M15 10.5A6.5 6.5 0 017.5 3a6.5 6.5 0 000 12A6.5 6.5 0 0015 10.5z" stroke={C.blue} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* ── Notification bell ── */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setNotifOpen(o => !o); setHasNotif(false) }} style={{ width: 40, height: 40, borderRadius: 12, background: notifOpen ? C.coralDim : C.surface, border: `1px solid ${notifOpen ? C.coral + '40' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', transition: 'all 0.2s' }}>
            <BellIcon active={hasNotif} />
          </button>
          {notifOpen && (
            <div className="slide-up" style={{ position: 'absolute', right: 0, top: 48, zIndex: 50, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 0', width: 240, boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
              <p style={{ margin: '0 0 8px 14px', fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.dim }}>Notifications</p>
              {[{ msg: 'Auto-switched to Deep Quiet', time: '2m ago', dot: C.blue }, { msg: 'Safety event: Siren detected', time: '14m ago', dot: C.amber }, { msg: 'Preset "Focus" applied', time: '1h ago', dot: C.coral }].map((n, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 14px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: n.dot, marginTop: 4, flexShrink: 0 }} />
                  <div><p style={{ margin: 0, fontSize: 12, color: C.text, fontWeight: 500 }}>{n.msg}</p><p style={{ margin: 0, fontSize: 10, color: C.dim, marginTop: 2 }}>{n.time}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>  {/* end flex gap-8 wrapper */}
      </div>

      {/* Focus status meter */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <ProgressRing pct={displayPct} label="Sensory Quiet" sublabel="acoustic isolation" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: C.dim, fontWeight: 500, letterSpacing: 0.4 }}>Active filter</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: mode === 'balanced' ? C.coral : mode === 'deep' ? C.blue : C.green }}>
                {mode === 'balanced' ? 'Balanced ANC' : mode === 'deep' ? 'Deep Quiet ANC' : 'Transparent Pass'}
              </p>
            </div>
            <div style={{ height: 1, background: C.border }} />
            <div style={{ display: 'flex', gap: 16 }}>
              <div><p style={{ margin: '0 0 2px', fontSize: 9, color: C.dim, letterSpacing: 0.8, textTransform: 'uppercase' }}>Suppressed</p><p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>–{Math.round(intensity * 0.42)} dB</p></div>
              <div><p style={{ margin: '0 0 2px', fontSize: 9, color: C.dim, letterSpacing: 0.8, textTransform: 'uppercase' }}>Latency</p><p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>4 ms</p></div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, padding: '10px 0 6px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: C.dim, fontWeight: 500, letterSpacing: 0.6 }}>LIVE NOISE SUPPRESSION</span>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.coral, boxShadow: `0 0 6px ${C.coral}` }} />
              <span style={{ fontSize: 9, color: C.coral, fontWeight: 600, letterSpacing: 0.8 }}>ACTIVE</span>
            </div>
          </div>
          <AudioWaveform active={mode !== 'transparent'} />
        </div>
      </Card>

      {/* Ambient filter controls */}
      <Card style={{ marginBottom: 14 }}>
        <SectionHeading>Ambient Filter</SectionHeading>
        <div style={{ display: 'flex', gap: 4, background: C.surface2, borderRadius: 14, padding: 4, marginBottom: 20 }}>
          {MODES.map(m => {
            const isActive = mode === m.id
            const col = m.id === 'balanced' ? C.coral : m.id === 'deep' ? C.blue : C.green
            return (
              <button key={m.id} onClick={() => setMode(m.id)} style={{ flex: 1, padding: '9px 4px', borderRadius: 10, border: 'none', background: isActive ? col : 'transparent', cursor: 'pointer', outline: 'none', transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)', transform: isActive ? 'scale(1.02)' : 'scale(1)' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: isActive ? '#fff' : C.muted, transition: 'color 0.2s' }}>{m.label}</p>
                <p style={{ margin: 0, fontSize: 9, color: isActive ? 'rgba(255,255,255,0.7)' : C.dim, marginTop: 2 }}>{m.sub}</p>
              </button>
            )
          })}
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: C.muted }}>Filter Intensity</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.coral }}>{intensity}%</span>
          </div>
          <div style={{ position: 'relative', height: 36, display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, background: C.surface2, overflow: 'hidden' }}>
              <div style={{ width: `${intensity}%`, height: '100%', background: `linear-gradient(90deg, rgba(232,133,106,0.5), ${C.coral})`, borderRadius: 2, transition: 'width 0.05s' }} />
            </div>
            <input ref={sliderRef} type="range" min={0} max={100} value={intensity} onChange={e => setIntensity(Number(e.target.value))} style={{ position: 'absolute', left: 0, right: 0, width: '100%', appearance: 'none', background: 'transparent', cursor: 'pointer', outline: 'none', height: 36 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 9, color: C.dim }}>0 — Minimal</span>
            <span style={{ fontSize: 9, color: C.dim }}>100 — Maximum</span>
          </div>
        </div>
      </Card>

      {/* Activity log */}
      <Card style={{ marginBottom: 14 }}>
        <SectionHeading>Activity Log</SectionHeading>
        {LOG_ENTRIES.map((entry, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < LOG_ENTRIES.length - 1 ? 14 : 0, marginBottom: i < LOG_ENTRIES.length - 1 ? 14 : 0, borderBottom: i < LOG_ENTRIES.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: `${entry.color}18`, border: `1px solid ${entry.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{entry.icon}</div>
              {i < LOG_ENTRIES.length - 1 && <div style={{ width: 1, flex: 1, background: C.border, marginTop: 6 }} />}
            </div>
            <div style={{ paddingTop: 4 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: C.text }}>{entry.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: C.dim }}>{entry.context}</p>
              <p style={{ margin: '4px 0 0', fontSize: 10, color: C.dim, letterSpacing: 0.3 }}>{entry.time}</p>
            </div>
          </div>
        ))}
      </Card>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Presets screen
// ─────────────────────────────────────────────────────────────────────────

interface Preset {
  id: string
  name: string
  focus: string
  description: string
  icon: string
  accentColor: string
  accentDim: string
  tags: string[]
  dB: number
  latency: string
  trigger?: string
  active?: boolean
}

const PRESETS: Preset[] = [
  {
    id: 'commute',
    name: 'Commute',
    focus: 'High Ambient Filter',
    description: 'Aggressively suppresses low-frequency engine rumble and city roar while preserving emergency siren cues.',
    icon: '🚇',
    accentColor: C.blue,
    accentDim: C.blueDim,
    tags: ['Auto ANC', 'Siren pass-through', 'Transit'],
    dB: 28,
    latency: '4 ms',
    trigger: 'GPS · Transit zones',
    active: true,
  },
  {
    id: 'meeting',
    name: 'Meeting',
    focus: 'Voice Isolation Engine',
    description: 'Isolates nearby human speech frequencies for crystal-clear voice clarity during calls or in-person syncs.',
    icon: '🎙',
    accentColor: C.coral,
    accentDim: C.coralDim,
    tags: ['Voice isolation', 'Call clarity', 'ANC off'],
    dB: 14,
    latency: '3 ms',
    trigger: 'Calendar · Bluetooth headset',
  },
  {
    id: 'study',
    name: 'Study / Deep Work',
    focus: 'Deep Quiet Mode',
    description: 'Maximum active noise cancellation for sustained concentration — blocks all ambient distraction at the source.',
    icon: '📖',
    accentColor: C.purple,
    accentDim: C.purpleDim,
    tags: ['Max ANC', 'No pass-through', 'Focus timer'],
    dB: 38,
    latency: '5 ms',
    trigger: 'Focus timer · Library GPS',
  },
  {
    id: 'office',
    name: 'Office',
    focus: 'Balanced Filter',
    description: 'Smooths sharp impulse noises while maintaining passive awareness for team interactions and announcements.',
    icon: '🏢',
    accentColor: C.green,
    accentDim: C.greenDim,
    tags: ['Balanced ANC', 'Team awareness', 'Impulse block'],
    dB: 18,
    latency: '4 ms',
    trigger: 'Work hours · Office Wi-Fi',
  },
  {
    id: 'gym',
    name: 'Gym & Outdoor',
    focus: 'Adaptive Ambient Awareness',
    description: 'Enhances rhythm and energy while intelligently feeding in safety cues from the immediate surroundings.',
    icon: '🏃',
    accentColor: C.amber,
    accentDim: C.amberDim,
    tags: ['Adaptive ANC', 'Safety feed', 'High energy'],
    dB: 10,
    latency: '3 ms',
    trigger: 'Motion sensor · Outdoor GPS',
  },
]

function MiniWave({ color, bars = 12 }: { color: string; bars?: number }) {
  const heights = Array.from({ length: bars }, (_, i) => 30 + Math.abs(Math.sin(i * 1.1)) * 70)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 20 }}>
      {heights.map((h, i) => (
        <div key={i} className="wave-bar" style={{ width: 2.5, height: `${h}%`, background: color, borderRadius: 1, opacity: 0.6 + (i % 3) * 0.13, '--dur': `${0.6 + i * 0.07}s`, animationDelay: `${i * 0.05}s` } as React.CSSProperties} />
      ))}
    </div>
  )
}

function PresetCard({ preset, onActivate }: { preset: Preset; onActivate: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const isActive = preset.active

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background: isActive ? `linear-gradient(135deg, ${preset.accentDim}, rgba(255,255,255,0.02))` : C.surface,
        border: `1.5px solid ${isActive ? preset.accentColor + '50' : C.border}`,
        borderRadius: 18,
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'all 0.22s ease',
        marginBottom: 12,
      }}
    >
      {/* Row 1: icon + name + active badge + chevron */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: `${preset.accentColor}18`, border: `1.5px solid ${preset.accentColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {preset.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: -0.2 }}>{preset.name}</span>
            {isActive && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: preset.accentColor, background: `${preset.accentColor}20`, padding: '2px 7px', borderRadius: 20 }}>Active</span>
            )}
          </div>
          <span style={{ fontSize: 11, color: preset.accentColor, fontWeight: 500 }}>{preset.focus}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <MiniWave color={preset.accentColor} />
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.4 }}>
            <path d="M4 6l4 4 4-4" stroke={C.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="slide-up" style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: C.muted, lineHeight: 1.55 }}>{preset.description}</p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {[{ label: 'Noise cut', value: `–${preset.dB} dB` }, { label: 'Latency', value: preset.latency }, { label: 'Profile', value: preset.focus.split(' ')[0] }].map((s, i) => (
              <div key={i} style={{ flex: 1, background: C.surface2, borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: preset.accentColor }}>{s.value}</p>
                <p style={{ margin: '3px 0 0', fontSize: 9, color: C.dim, letterSpacing: 0.5, textTransform: 'uppercase' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {preset.tags.map(tag => (
              <span key={tag} style={{ fontSize: 10, fontWeight: 500, color: preset.accentColor, background: `${preset.accentColor}14`, border: `1px solid ${preset.accentColor}28`, borderRadius: 20, padding: '3px 9px' }}>{tag}</span>
            ))}
          </div>

          {/* Trigger */}
          {preset.trigger && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', background: C.surface2, borderRadius: 10 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke={C.dim} strokeWidth="1.3"/><path d="M7 4v3l2 1.5" stroke={C.dim} strokeWidth="1.3" strokeLinecap="round"/></svg>
              <span style={{ fontSize: 11, color: C.dim }}>Auto-triggers: <span style={{ color: C.muted, fontWeight: 500 }}>{preset.trigger}</span></span>
            </div>
          )}

          {/* Activate button */}
          <button
            onClick={e => { e.stopPropagation(); onActivate(preset.id) }}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
              background: isActive ? C.surface2 : preset.accentColor,
              color: isActive ? C.muted : '#fff',
              fontSize: 13, fontWeight: 700, letterSpacing: 0.3,
              cursor: isActive ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isActive ? '✓ Currently Active' : 'Activate Preset'}
          </button>
        </div>
      )}
    </div>
  )
}

function CreatePresetCard() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [ancLevel, setAncLevel] = useState(50)
  const [voicePass, setVoicePass] = useState(60)
  const [trigger, setTrigger] = useState('manual')

  return (
    <div style={{ border: `1.5px dashed rgba(255,255,255,0.14)`, borderRadius: 18, padding: '14px 18px', cursor: 'pointer', transition: 'all 0.2s', background: open ? C.surface : 'transparent' }} onClick={() => !open && setOpen(true)}>
      {!open ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, border: `1.5px dashed rgba(255,255,255,0.18)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke={C.dim} strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.muted }}>Create New Preset</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: C.dim }}>Fine-tune frequency isolation & triggers</p>
          </div>
        </div>
      ) : (
        <div className="slide-up" onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>New Preset</p>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>

          {/* Name input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: C.dim, letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Preset Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Late Night Reading" style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif' }} />
          </div>

          {/* ANC slider */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 11, color: C.dim, letterSpacing: 0.8, textTransform: 'uppercase' }}>Frequency Isolation</label>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.coral }}>{ancLevel}%</span>
            </div>
            <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, background: C.surface2 }}>
                <div style={{ width: `${ancLevel}%`, height: '100%', background: C.coral, borderRadius: 2 }} />
              </div>
              <input type="range" min={0} max={100} value={ancLevel} onChange={e => setAncLevel(Number(e.target.value))} style={{ position: 'absolute', width: '100%', appearance: 'none', background: 'transparent', cursor: 'pointer', outline: 'none', height: 28 }} />
            </div>
          </div>

          {/* Voice pass-through */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 11, color: C.dim, letterSpacing: 0.8, textTransform: 'uppercase' }}>Voice Pass-Through</label>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>{voicePass}%</span>
            </div>
            <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, background: C.surface2 }}>
                <div style={{ width: `${voicePass}%`, height: '100%', background: C.blue, borderRadius: 2 }} />
              </div>
              <input type="range" min={0} max={100} value={voicePass} onChange={e => setVoicePass(Number(e.target.value))} style={{ position: 'absolute', width: '100%', appearance: 'none', background: 'transparent', cursor: 'pointer', outline: 'none', height: 28 }} />
            </div>
          </div>

          {/* Trigger condition */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, color: C.dim, letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Auto-Switch Trigger</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ id: 'manual', label: 'Manual' }, { id: 'gps', label: 'GPS' }, { id: 'bt', label: 'Bluetooth' }, { id: 'time', label: 'Schedule' }].map(t => (
                <button key={t.id} onClick={() => setTrigger(t.id)} style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: `1.5px solid ${trigger === t.id ? C.coral + '60' : C.border}`, background: trigger === t.id ? C.coralDim : 'transparent', color: trigger === t.id ? C.coral : C.dim, fontSize: 10, fontWeight: 600, cursor: 'pointer', outline: 'none', transition: 'all 0.15s' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => { if (name.trim()) setOpen(false) }}
            style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', background: name.trim() ? C.coral : C.surface2, color: name.trim() ? '#fff' : C.dim, fontSize: 13, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}
          >
            Save Preset
          </button>
        </div>
      )}
    </div>
  )
}

function PresetsScreen() {
  const [presets, setPresets] = useState(PRESETS)

  const activatePreset = (id: string) => {
    setPresets(p => p.map(pr => ({ ...pr, active: pr.id === id })))
  }

  const activePreset = presets.find(p => p.active)

  return (
    <>
      {/* Header */}
      <div style={{ padding: '20px 0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: C.text }}>Presets</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>Context-aware acoustic profiles</p>
        </div>
        {activePreset && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${activePreset.accentColor}16`, border: `1px solid ${activePreset.accentColor}30`, borderRadius: 20, padding: '6px 12px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: activePreset.accentColor, boxShadow: `0 0 6px ${activePreset.accentColor}` }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: activePreset.accentColor }}>{activePreset.name}</span>
          </div>
        )}
      </div>

      {/* Active preset summary strip */}
      {activePreset && (
        <div style={{ background: `linear-gradient(135deg, ${activePreset.accentDim}, rgba(255,255,255,0.01))`, border: `1px solid ${activePreset.accentColor}30`, borderRadius: 16, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 26 }}>{activePreset.icon}</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{activePreset.name} is active</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: activePreset.accentColor }}>{activePreset.focus} · –{activePreset.dB} dB</p>
          </div>
          <MiniWave color={activePreset.accentColor} bars={10} />
        </div>
      )}

      {/* Preset list */}
      <div>
        {presets.map(preset => (
          <PresetCard key={preset.id} preset={preset} onActivate={activatePreset} />
        ))}
        <CreatePresetCard />
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Stats screen (placeholder)
// ─────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────
// Stats — data viz helpers
// ─────────────────────────────────────────────────────────────────────────

// Donut arc path: angles in degrees, 0 = top
function arcPath(cx: number, cy: number, R: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180
  const sx = cx + R * Math.cos(toRad(startDeg))
  const sy = cy + R * Math.sin(toRad(startDeg))
  const ex = cx + R * Math.cos(toRad(endDeg))
  const ey = cy + R * Math.sin(toRad(endDeg))
  const ix = cx + r * Math.cos(toRad(endDeg))
  const iy = cy + r * Math.sin(toRad(endDeg))
  const jx = cx + r * Math.cos(toRad(startDeg))
  const jy = cy + r * Math.sin(toRad(startDeg))
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${sx} ${sy} A ${R} ${R} 0 ${large} 1 ${ex} ${ey} L ${ix} ${iy} A ${r} ${r} 0 ${large} 0 ${jx} ${jy} Z`
}

// Categorical palette — fixed order, dark-surface validated
// Deep Quiet: blue #5B8AF0, Balanced: coral #E8856A, Voice Pass: green #34C98A, Transparent: purple #9B7FEA
const PIE_DATA = [
  { label: 'Deep Quiet',  pct: 45, color: '#5B8AF0', dimColor: 'rgba(91,138,240,0.16)'  },
  { label: 'Balanced',    pct: 30, color: '#E8856A', dimColor: 'rgba(232,133,106,0.16)' },
  { label: 'Voice Pass',  pct: 15, color: '#34C98A', dimColor: 'rgba(52,201,138,0.16)'  },
  { label: 'Transparent', pct: 10, color: '#9B7FEA', dimColor: 'rgba(155,127,234,0.16)' },
]

// Weekly bar data — hours per day vs 7.5h target
const WEEK_DATA = [
  { day: 'Mon', hours: 5.2 },
  { day: 'Tue', hours: 7.8 },
  { day: 'Wed', hours: 6.5 },
  { day: 'Thu', hours: 7.5 },
  { day: 'Fri', hours: 4.9 },
  { day: 'Sat', hours: 3.1 },
  { day: 'Sun', hours: 6.2 },
]
const TODAY_IDX = 3 // Thu = today
const TARGET = 7.5

// Mode usage frequency
const MODE_FREQ = [
  { label: 'Deep Quiet',  pct: 42, color: '#5B8AF0' },
  { label: 'Balanced',    pct: 31, color: '#E8856A' },
  { label: 'Voice Pass',  pct: 17, color: '#34C98A' },
  { label: 'Transparent', pct: 10, color: '#9B7FEA' },
]

// ── Donut chart ────────────────────────────────────────────────────────────
function DonutChart() {
  const [hovered, setHovered] = useState<number | null>(null)
  const cx = 88, cy = 88, R = 72, r = 48
  const GAP_DEG = 2

  let cursor = 0
  const segments = PIE_DATA.map((d, i) => {
    const sweep = (d.pct / 100) * 360
    const start = cursor + GAP_DEG / 2
    const end = cursor + sweep - GAP_DEG / 2
    cursor += sweep
    return { ...d, start, end, i }
  })

  const active = hovered !== null ? PIE_DATA[hovered] : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      {/* SVG donut */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width="176" height="176" viewBox="0 0 176 176">
          {/* Track */}
          <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke={C.surface2} strokeWidth={R - r} />
          {segments.map(seg => (
            <path
              key={seg.i}
              d={arcPath(cx, cy, hovered === seg.i ? R + 4 : R, hovered === seg.i ? r - 2 : r, seg.start, seg.end)}
              fill={seg.color}
              opacity={hovered === null || hovered === seg.i ? 1 : 0.35}
              style={{ transition: 'opacity 0.18s, d 0.18s' }}
              onMouseEnter={() => setHovered(seg.i)}
              onMouseLeave={() => setHovered(null)}
              cursor="pointer"
            />
          ))}
          {/* Center label */}
          {active ? (
            <>
              <text x={cx} y={cy - 8} textAnchor="middle" fill={active.color} fontSize="22" fontWeight="700" fontFamily="Inter,sans-serif">{active.pct}%</text>
              <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(242,242,247,0.5)" fontSize="9" fontFamily="Inter,sans-serif" letterSpacing="0.8">{active.label.toUpperCase()}</text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - 6} textAnchor="middle" fill={C.text} fontSize="20" fontWeight="700" fontFamily="Inter,sans-serif">6h 12m</text>
              <text x={cx} y={cy + 11} textAnchor="middle" fill={C.muted} fontSize="9" fontFamily="Inter,sans-serif" letterSpacing="0.8">TODAY</text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PIE_DATA.map((d, i) => (
          <div
            key={d.label}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'default', opacity: hovered === null || hovered === i ? 1 : 0.4, transition: 'opacity 0.18s' }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0, boxShadow: hovered === i ? `0 0 8px ${d.color}` : 'none', transition: 'box-shadow 0.18s' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{d.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.pct}%</span>
              </div>
              <div style={{ height: 3, background: C.surface2, borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                <div style={{ width: `${d.pct}%`, height: '100%', background: d.color, borderRadius: 2, opacity: 0.85 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Weekly bar chart ───────────────────────────────────────────────────────
function WeeklyChart() {
  const [hovered, setHovered] = useState<number | null>(null)
  const W = 356, H = 120
  const PADL = 28, PADR = 8, PADT = 12, PADB = 24
  const chartW = W - PADL - PADR
  const chartH = H - PADT - PADB
  const maxH = 9
  const barW = (chartW / WEEK_DATA.length) * 0.55
  const bandW = chartW / WEEK_DATA.length

  const yScale = (h: number) => chartH - (h / maxH) * chartH
  const targetY = yScale(TARGET)

  return (
    <div style={{ position: 'relative' }}>
      <svg width={W} height={H} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 2.5, 5, 7.5].map(v => {
          const y = PADT + yScale(v)
          return (
            <g key={v}>
              <line x1={PADL} x2={PADL + chartW} y1={y} y2={y} stroke={C.border} strokeWidth="1" strokeDasharray={v === 0 ? 'none' : '3 4'} />
              <text x={PADL - 5} y={y + 4} textAnchor="end" fill={C.dim} fontSize="9" fontFamily="Inter,sans-serif">{v === 0 ? '' : v}</text>
            </g>
          )
        })}

        {/* Target line */}
        <line x1={PADL} x2={PADL + chartW} y1={PADT + targetY} y2={PADT + targetY} stroke={C.coral} strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
        <text x={PADL + chartW + 4} y={PADT + targetY + 3} fill={C.coral} fontSize="8" fontFamily="Inter,sans-serif" opacity="0.7">7.5h</text>

        {/* Bars */}
        {WEEK_DATA.map((d, i) => {
          const x = PADL + i * bandW + (bandW - barW) / 2
          const barH = (d.hours / maxH) * chartH
          const y = PADT + chartH - barH
          const isToday = i === TODAY_IDX
          const isHov = hovered === i
          const color = d.hours >= TARGET ? C.green : isToday ? C.coral : '#5B8AF0'

          return (
            <g key={d.day}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              cursor="pointer"
            >
              {/* Hit target */}
              <rect x={PADL + i * bandW} width={bandW} y={PADT} height={chartH} fill="transparent" />
              {/* Bar background (track) */}
              <rect x={x} width={barW} y={PADT} height={chartH} fill={C.surface2} rx="3" />
              {/* Bar fill */}
              <rect
                x={x} width={barW} y={y} height={barH}
                rx="3"
                fill={color}
                opacity={isHov ? 1 : isToday ? 0.9 : 0.55}
                style={{ transition: 'opacity 0.15s, y 0.3s, height 0.3s' }}
              />
              {/* Today indicator */}
              {isToday && <circle cx={x + barW / 2} cy={PADT + chartH + 12} r="2.5" fill={C.coral} />}
              {/* Day label */}
              <text x={x + barW / 2} y={H - 4} textAnchor="middle" fill={isToday ? C.coral : C.dim} fontSize="10" fontWeight={isToday ? '600' : '400'} fontFamily="Inter,sans-serif">{d.day}</text>
              {/* Hover value */}
              {isHov && (
                <g>
                  <rect x={x + barW / 2 - 18} y={y - 22} width={36} height={17} rx="5" fill={C.surface2} />
                  <text x={x + barW / 2} y={y - 10} textAnchor="middle" fill={C.text} fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif">{d.hours}h</text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Mode usage frequency bars ──────────────────────────────────────────────
function ModeFrequency() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {MODE_FREQ.map(m => (
        <div key={m.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.color }} />
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{m.label}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.pct}%</span>
          </div>
          <div style={{ height: 6, background: C.surface2, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${m.pct}%`, height: '100%', background: m.color, borderRadius: 3, opacity: 0.8 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Stat tile ──────────────────────────────────────────────────────────────
function StatTile({ value, label, sub, color, icon }: { value: string; label: string; sub?: string; color: string; icon: string }) {
  return (
    <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '14px 14px 12px' }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── Stats screen ───────────────────────────────────────────────────────────
function StatsScreen() {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ margin: '0 0 3px', fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: -0.5 }}>Stats</h1>
        <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{dateStr}</p>
      </div>

      {/* ── 1. TODAY'S OVERVIEW ── */}
      <div style={{ marginBottom: 14 }}>
        <SectionHeading>{"Today's Overview"}</SectionHeading>

        {/* Focus achievement hero + total time */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {/* Focus achievement */}
          <div style={{ flex: 2, background: `linear-gradient(135deg, rgba(232,133,106,0.12), rgba(232,133,106,0.04))`, border: `1.5px solid rgba(232,133,106,0.22)`, borderRadius: 18, padding: '16px 16px 14px', position: 'relative', overflow: 'hidden' }}>
            {/* Background arc hint */}
            <svg style={{ position: 'absolute', top: -10, right: -10, opacity: 0.12 }} width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="30" fill="none" stroke={C.coral} strokeWidth="14"/>
            </svg>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: C.dim, marginBottom: 6 }}>Focus Achievement</div>
            <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1.5, color: C.coral, lineHeight: 1 }}>89%</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>of daily goal reached</div>
            {/* Progress bar */}
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ width: '89%', height: '100%', background: `linear-gradient(90deg, #F0A882, ${C.coral})`, borderRadius: 2 }} />
            </div>
          </div>
          {/* Total time */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '12px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.dim, marginBottom: 5 }}>Active Time</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: -0.5, lineHeight: 1.1 }}>6h 12m</div>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>of 8h target</div>
            </div>
            <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '12px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.dim, marginBottom: 5 }}>Sessions</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.blue, letterSpacing: -0.5, lineHeight: 1.1 }}>7</div>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 3 }}>auto-switched ×3</div>
            </div>
          </div>
        </div>

        {/* Sensory distribution donut */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Sensory Distribution</span>
            <span style={{ fontSize: 10, color: C.dim }}>Tap segment to inspect</span>
          </div>
          <DonutChart />
        </Card>
      </div>

      {/* ── 2. WEEKLY FOCUS TREND ── */}
      <div style={{ marginBottom: 14 }}>
        <SectionHeading>Weekly Focus Trend</SectionHeading>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Daily Focus Hours</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 16, height: 1.5, borderTop: `1.5px dashed ${C.coral}`, opacity: 0.6 }} />
              <span style={{ fontSize: 10, color: C.dim }}>7.5h target</span>
            </div>
          </div>
          <WeeklyChart />
          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
            {[{ color: C.green, label: 'At or above target' }, { color: C.coral, label: 'Today' }, { color: '#5B8AF0', label: 'Below target' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, opacity: 0.85 }} />
                <span style={{ fontSize: 9, color: C.dim }}>{l.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── 3. PRODUCTIVITY METRICS ── */}
      <div style={{ marginBottom: 14 }}>
        <SectionHeading>Productivity Metrics</SectionHeading>

        {/* Stat tiles row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <StatTile value="38 min" label="Avg. Attention Span" sub="per uninterrupted session" color={C.coral} icon="🧠" />
          <StatTile value="↓ 18%" label="Stress Reduction" sub="vs. baseline week" color={C.green} icon="💚" />
        </div>

        {/* Mode usage frequency */}
        <Card>
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Mode Usage Frequency</span>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: C.dim }}>How often each filter was active this week</p>
          </div>
          <ModeFrequency />
        </Card>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Profile / Settings screen
// ─────────────────────────────────────────────────────────────────────────

const AVATAR_OPTIONS = [
  { id: 'shih1', url: 'https://images.unsplash.com/photo-1629740067905-bd3f515aa739?w=160&h=160&fit=crop&auto=format', label: 'Fluffy' },
  { id: 'shih2', url: 'https://images.unsplash.com/photo-1698949654875-544ecfef27ac?w=160&h=160&fit=crop&auto=format', label: 'Sunny' },
  { id: 'shih3', url: 'https://images.unsplash.com/photo-1707014064563-b9f7cb06bb3a?w=160&h=160&fit=crop&auto=format', label: 'Mochi' },
  { id: 'shih4', url: 'https://images.unsplash.com/photo-1777841709927-d1e88b90b8dd?w=160&h=160&fit=crop&auto=format', label: 'Biscuit' },
]

const BT_DEVICES = [
  { id: 'bt1', name: 'SensorySync Pro X', type: 'Earbuds', connected: true,  battery: 78 },
  { id: 'bt2', name: 'Sony WH-1000XM5',   type: 'Headphones', connected: false, battery: 42 },
  { id: 'bt3', name: 'AirPods Pro 2',      type: 'Earbuds', connected: false, battery: 91 },
]

function SettingsRow({ icon, label, sub, right, onPress, danger }: {
  icon: React.ReactNode; label: string; sub?: string
  right?: React.ReactNode; onPress?: () => void; danger?: boolean
}) {
  const [pressed, setPressed] = useState(false)
  return (
    <div
      onClick={onPress}
      onMouseDown={() => onPress && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 0',
        cursor: onPress ? 'pointer' : 'default',
        opacity: pressed ? 0.7 : 1,
        transition: 'opacity 0.12s',
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: danger ? 'rgba(255,80,80,0.12)' : C.surface2, border: `1px solid ${danger ? 'rgba(255,80,80,0.2)' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: danger ? '#FF5050' : C.text }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.dim, marginTop: 1 }}>{sub}</div>}
      </div>
      {right}
    </div>
  )
}

function Toggle({ value, onChange, color = C.coral }: { value: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: value ? color : C.surface2,
        border: `1.5px solid ${value ? color : C.border}`,
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.22s, border-color 0.22s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        width: 18, height: 18,
        borderRadius: '50%',
        background: '#fff',
        top: 2,
        left: value ? 20 : 2,
        transition: 'left 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      }} />
    </div>
  )
}

function ChevronRight({ color = C.dim }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M6 4l4 4-4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function EQBars({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const labels = ['60Hz', '250Hz', '1kHz', '4kHz', '12kHz']
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 72, paddingTop: 8 }}>
      {value.map((v, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ position: 'relative', width: '100%', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', width: 2, height: '100%', background: C.surface2, borderRadius: 1, left: '50%', transform: 'translateX(-50%)' }} />
            <input
              type="range" min={-12} max={12} value={v}
              onChange={e => { const next = [...value]; next[i] = Number(e.target.value); onChange(next) }}
              style={{ appearance: 'none', writingMode: 'vertical-lr', direction: 'rtl', width: 24, height: 52, background: 'transparent', cursor: 'pointer', outline: 'none', position: 'relative', zIndex: 1 }}
            />
          </div>
          <span style={{ fontSize: 8, color: C.dim, letterSpacing: 0.3 }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

function BatteryIcon({ pct }: { pct: number }) {
  const color = pct > 50 ? C.green : pct > 20 ? C.amber : '#FF5050'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 20, height: 10, border: `1.5px solid ${C.dim}`, borderRadius: 2, padding: 1.5, display: 'flex', alignItems: 'center' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 1, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 600 }}>{pct}%</span>
    </div>
  )
}

function ProfileScreen() {
  const [name, setName] = useState('Elloise Cruz')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('Elloise Cruz')
  const [avatarId, setAvatarId] = useState('shih1')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [btDevices, setBtDevices] = useState(BT_DEVICES)
  const [showBtExpanded, setShowBtExpanded] = useState(false)
  const [showEqExpanded, setShowEqExpanded] = useState(false)
  const [eqValues, setEqValues] = useState([2, -1, 3, 5, 1])
  const [emergencyBypass, setEmergencyBypass] = useState(true)
  const [focusGoal, setFocusGoal] = useState(7.5)
  const [notifFocus, setNotifFocus] = useState(true)
  const [notifBreak, setNotifBreak] = useState(true)
  const [notifMode, setNotifMode] = useState(false)
  const [updateAvail] = useState(true)
  const [updateProgress, setUpdateProgress] = useState<number | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const currentAvatar = AVATAR_OPTIONS.find(a => a.id === avatarId)!
  const connectedDevice = btDevices.find(d => d.connected)

  const handleNameSave = () => {
    if (nameInput.trim()) setName(nameInput.trim())
    setEditingName(false)
  }

  const startUpdate = () => {
    if (updateProgress !== null) return
    setUpdateProgress(0)
    const interval = setInterval(() => {
      setUpdateProgress(p => {
        if (p === null || p >= 100) { clearInterval(interval); return 100 }
        return p + 4
      })
    }, 80)
  }

  return (
    <div style={{ padding: '20px 0' }}>

      {/* ── PROFILE CARD ── */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, overflow: 'hidden', border: `2.5px solid ${C.coral}`, background: C.surface2 }}>
              <img src={currentAvatar.url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <button
              onClick={() => setShowAvatarPicker(p => !p)}
              style={{ position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: '50%', background: C.coral, border: `2px solid ${C.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none' }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1.5 8.5L3 7l1 1L2.5 9.5 1.5 8.5z" fill="#fff"/>
                <path d="M3 7L7.5 2.5l1 1L4 8 3 7z" fill="#fff"/>
                <path d="M7.5 2.5L9 1.5 9.5 2l-1 1-1-1z" fill="#fff"/>
              </svg>
            </button>
          </div>

          {/* Name & role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  ref={nameRef}
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                  autoFocus
                  style={{ flex: 1, background: C.surface2, border: `1.5px solid ${C.coral}40`, borderRadius: 8, padding: '6px 10px', color: C.text, fontSize: 16, fontWeight: 700, outline: 'none', fontFamily: 'Inter, sans-serif', letterSpacing: -0.3 }}
                />
                <button onClick={handleNameSave} style={{ background: C.coral, border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>Save</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: -0.4 }}>{name}</span>
                <button onClick={() => { setEditingName(true); setNameInput(name) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: C.dim, outline: 'none' }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 10.5l2-2 6-6 1.5 1.5-6 6-2 2-1.5-.5v-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M8.5 2.5L10 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                </button>
              </div>
            )}
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>SensorySync member · Pro plan</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: C.coral, background: C.coralDim, padding: '2px 8px', borderRadius: 20 }}>🐾 Shih Tzu lover</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: C.blue, background: C.blueDim, padding: '2px 8px', borderRadius: 20 }}>Focus Pro</span>
            </div>
          </div>
        </div>

        {/* Avatar picker */}
        {showAvatarPicker && (
          <div className="slide-up" style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, color: C.dim, fontWeight: 500, letterSpacing: 0.6, textTransform: 'uppercase' }}>Choose Avatar</p>
            <div style={{ display: 'flex', gap: 10 }}>
              {AVATAR_OPTIONS.map(av => (
                <div
                  key={av.id}
                  onClick={() => { setAvatarId(av.id); setShowAvatarPicker(false) }}
                  style={{ flex: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}
                >
                  <div style={{ width: 60, height: 60, borderRadius: 16, overflow: 'hidden', border: `2.5px solid ${av.id === avatarId ? C.coral : C.border}`, transition: 'border-color 0.2s', background: C.surface2 }}>
                    <img src={av.url} alt={av.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontSize: 9, color: av.id === avatarId ? C.coral : C.dim, fontWeight: av.id === avatarId ? 600 : 400 }}>{av.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ── DEVICE PAIRING ── */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <SectionHeading>Device Pairing</SectionHeading>
          <button onClick={() => setShowBtExpanded(e => !e)} style={{ background: 'none', border: 'none', color: C.coral, fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none', padding: '0 0 14px' }}>
            {showBtExpanded ? 'Done' : 'Manage'}
          </button>
        </div>

        {btDevices.map((dev, i) => (
          <div key={dev.id} style={{ paddingBottom: i < btDevices.length - 1 ? 12 : 0, marginBottom: i < btDevices.length - 1 ? 12 : 0, borderBottom: i < btDevices.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: dev.connected ? C.blueDim : C.surface2, border: `1px solid ${dev.connected ? C.blue + '40' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                {dev.type === 'Earbuds' ? '🎧' : '🎵'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{dev.name}</span>
                  {dev.connected && <span style={{ fontSize: 9, color: C.green, background: C.greenDim, padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>Connected</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                  <span style={{ fontSize: 10, color: C.dim }}>{dev.type}</span>
                  <BatteryIcon pct={dev.battery} />
                </div>
              </div>
              {showBtExpanded && !dev.connected && (
                <button
                  onClick={() => setBtDevices(prev => prev.map(d => ({ ...d, connected: d.id === dev.id })))}
                  style={{ padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${C.blue}50`, background: C.blueDim, color: C.blue, fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                >
                  Connect
                </button>
              )}
              {showBtExpanded && dev.connected && (
                <button
                  onClick={() => setBtDevices(prev => prev.map(d => d.id === dev.id ? { ...d, connected: false } : d))}
                  style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface2, color: C.dim, fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        ))}
      </Card>

      {/* ── AUDIO PROFILE ── */}
      <Card style={{ marginBottom: 14 }}>
        <div
          onClick={() => setShowEqExpanded(e => !e)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.purpleDim, border: `1px solid ${C.purple}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z" fill={C.purple} opacity="0.8"/><path d="M8 5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z" fill={C.purple}/><path d="M8 13c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z" fill={C.purple} opacity="0.6"/><line x1="4" y1="9" x2="18" y2="9" stroke={C.purple} strokeWidth="1.2" opacity="0.3"/><line x1="10" y1="5" x2="18" y2="5" stroke={C.purple} strokeWidth="1.2" opacity="0.3"/><line x1="10" y1="13" x2="18" y2="13" stroke={C.purple} strokeWidth="1.2" opacity="0.3"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Audio Profile</div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 1 }}>Equalizer & sound tuning</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: showEqExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
            <path d="M6 4l4 4-4 4" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {showEqExpanded && (
          <div className="slide-up" style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>5-Band Equalizer</span>
              <button onClick={() => setEqValues([0, 0, 0, 0, 0])} style={{ background: 'none', border: 'none', color: C.dim, fontSize: 10, cursor: 'pointer', outline: 'none' }}>Reset flat</button>
            </div>
            {/* EQ presets */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[
                { label: 'Flat',    vals: [0,0,0,0,0] },
                { label: 'Vocal',   vals: [-2,0,4,5,2] },
                { label: 'Bass+',   vals: [6,3,0,-1,0] },
                { label: 'Crisp',   vals: [0,-1,2,5,4] },
              ].map(p => (
                <button key={p.label} onClick={() => setEqValues(p.vals)} style={{ flex: 1, padding: '5px 0', borderRadius: 8, border: `1px solid ${C.border}`, background: JSON.stringify(eqValues) === JSON.stringify(p.vals) ? C.purpleDim : C.surface2, color: JSON.stringify(eqValues) === JSON.stringify(p.vals) ? C.purple : C.dim, fontSize: 10, fontWeight: 600, cursor: 'pointer', outline: 'none', transition: 'all 0.15s' }}>
                  {p.label}
                </button>
              ))}
            </div>
            <EQBars value={eqValues} onChange={setEqValues} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 9, color: C.dim }}>–12 dB</span>
              <span style={{ fontSize: 9, color: C.dim }}>0</span>
              <span style={{ fontSize: 9, color: C.dim }}>+12 dB</span>
            </div>
          </div>
        )}
      </Card>

      {/* ── SAFETY, FOCUS, NOTIFICATIONS ── */}
      <Card style={{ marginBottom: 14 }}>
        <SectionHeading>Safety & Focus</SectionHeading>

        {/* Emergency Bypass */}
        <SettingsRow
          icon={<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M8.5 1L10.5 6h5l-4 3 1.5 5L8.5 11l-4.5 3 1.5-5L1.5 6h5L8.5 1z" fill="#FF5050" opacity="0.85"/></svg>}
          label="Emergency Bypass"
          sub="Sirens, horns & alarms always break through ANC"
          danger
          right={<Toggle value={emergencyBypass} onChange={setEmergencyBypass} color="#FF5050" />}
        />
        {emergencyBypass && (
          <div style={{ marginLeft: 50, marginBottom: 4, padding: '6px 10px', background: 'rgba(255,80,80,0.06)', borderRadius: 8, border: '1px solid rgba(255,80,80,0.15)' }}>
            <span style={{ fontSize: 10, color: '#FF7070' }}>🛡 Active — safety sounds will always be audible</span>
          </div>
        )}
        <div style={{ height: 1, background: C.border, margin: '4px 0' }} />

        {/* Daily Focus Goal */}
        <div style={{ padding: '12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.coralDim, border: `1px solid ${C.coral}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="8.5" r="6.5" stroke={C.coral} strokeWidth="1.4"/><circle cx="8.5" cy="8.5" r="3.5" stroke={C.coral} strokeWidth="1.4" opacity="0.6"/><circle cx="8.5" cy="8.5" r="1.2" fill={C.coral}/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Daily Focus Goal</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: C.coral }}>{focusGoal}h</span>
              </div>
              <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, background: C.surface2 }}>
                  <div style={{ width: `${(focusGoal / 12) * 100}%`, height: '100%', background: C.coral, borderRadius: 2 }} />
                </div>
                <input type="range" min={1} max={12} step={0.5} value={focusGoal} onChange={e => setFocusGoal(Number(e.target.value))} style={{ position: 'absolute', width: '100%', appearance: 'none', background: 'transparent', cursor: 'pointer', outline: 'none', height: 28 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 9, color: C.dim }}>1h min</span>
                <span style={{ fontSize: 9, color: C.dim }}>12h max</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── NOTIFICATIONS ── */}
      <Card style={{ marginBottom: 14 }}>
        <SectionHeading>Push Notifications</SectionHeading>
        {[
          { label: 'Focus session reminders', sub: 'Daily prompts to start a session', val: notifFocus, set: setNotifFocus },
          { label: 'Break reminders',          sub: 'Alert after 90 min of continuous use', val: notifBreak, set: setNotifBreak },
          { label: 'Auto mode changes',         sub: 'Notify when preset switches automatically', val: notifMode, set: setNotifMode },
        ].map((item, i, arr) => (
          <div key={item.label}>
            <SettingsRow
              icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6v3L2 10.5h12L12.5 9V6C12.5 3.5 10.5 1.5 8 1.5z" stroke={C.muted} strokeWidth="1.3" fill="none"/><path d="M6.5 10.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5" stroke={C.muted} strokeWidth="1.3" strokeLinecap="round"/></svg>}
              label={item.label}
              sub={item.sub}
              right={<Toggle value={item.val} onChange={item.set} />}
            />
            {i < arr.length - 1 && <div style={{ height: 1, background: C.border }} />}
          </div>
        ))}
      </Card>

      {/* ── SYSTEM UPDATES ── */}
      <Card style={{ marginBottom: 24 }}>
        <SectionHeading>System</SectionHeading>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: updateProgress === 100 ? C.greenDim : C.blueDim, border: `1px solid ${updateProgress === 100 ? C.green + '40' : C.blue + '40'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {updateProgress === 100
              ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-7" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v4l2.5-2.5M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6c0-1.8-.8-3.4-2-4.5" stroke={C.blue} strokeWidth="1.4" strokeLinecap="round"/></svg>
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>AI Audio Filters</div>
                <div style={{ fontSize: 11, color: C.dim, marginTop: 1 }}>
                  {updateProgress === 100 ? 'Up to date — v3.2.1' : updateAvail ? 'v3.2.1 available · 14 MB' : 'Up to date — v3.1.8'}
                </div>
              </div>
              {updateProgress === null && updateAvail && (
                <button
                  onClick={startUpdate}
                  style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: C.blue, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                >
                  Update
                </button>
              )}
              {updateProgress === 100 && (
                <span style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>✓ Done</span>
              )}
            </div>
            {updateProgress !== null && updateProgress < 100 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 10, color: C.dim }}>Installing update…</span>
                  <span style={{ fontSize: 10, color: C.blue, fontWeight: 600 }}>{updateProgress}%</span>
                </div>
                <div style={{ height: 4, background: C.surface2, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${updateProgress}%`, height: '100%', background: C.blue, borderRadius: 2, transition: 'width 0.08s' }} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
        <SettingsRow
          icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={C.dim} strokeWidth="1.3"/><path d="M8 5v3l2 1" stroke={C.dim} strokeWidth="1.3" strokeLinecap="round"/></svg>}
          label="App Version"
          sub="SensorySync v2.4.0"
          right={<span style={{ fontSize: 11, color: C.dim }}>Latest</span>}
        />
      </Card>

      {/* ── SPOTIFY INTEGRATION ── */}
      <SpotifySection avatarUrl={AVATAR_OPTIONS.find(a => a.id === avatarId)?.url ?? ''} userName={name} />

    </div>
  )
}

// ── Spotify section ────────────────────────────────────────────────────────
const SPOTIFY_PLAYLISTS = [
  { id: '37i9dQZF1DXcBWIGoYBM5M', name: "Today's Top Hits",  emoji: '🔥' },
  { id: '37i9dQZF1DWXLeA8Omikj7', name: 'Brain Food',         emoji: '🧠' },
  { id: '37i9dQZF1DX4sWSpwq3LiO', name: 'Peaceful Piano',     emoji: '🎹' },
  { id: '37i9dQZF1DWZeKCadgRdKQ', name: 'Deep Focus',         emoji: '🎯' },
]

function SpotifySection({ avatarUrl, userName }: { avatarUrl: string; userName: string }) {
  const { theme } = useContext(ThemeCtx)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [playlist, setPlaylist]   = useState(SPOTIFY_PLAYLISTS[0].id)

  const connect = () => {
    setLoading(true)
    // Simulate OAuth handshake delay
    setTimeout(() => { setConnected(true); setLoading(false) }, 1800)
  }

  const SPOTIFY_GREEN = '#1DB954'

  return (
    <Card style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {/* Spotify wordmark / icon */}
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#191414', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={SPOTIFY_GREEN}>
            <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.52 17.32c-.225.359-.706.471-1.065.247-2.921-1.785-6.596-2.188-10.924-1.198-.417.096-.833-.165-.929-.582-.096-.417.165-.833.582-.929 4.735-1.082 8.795-.616 12.07 1.388.358.224.47.705.246 1.074zm1.472-3.272c-.282.447-.884.587-1.331.305-3.342-2.054-8.437-2.649-12.389-1.449-.512.155-1.053-.133-1.208-.644-.155-.512.133-1.053.644-1.208 4.514-1.37 10.121-.707 13.98 1.665.447.282.587.883.304 1.331zm.127-3.407C15.553 8.327 8.826 8.1 5.023 9.269c-.614.187-1.264-.16-1.451-.774-.187-.614.16-1.264.774-1.451 4.39-1.333 11.69-1.075 16.301 1.636.552.328.731 1.042.403 1.594-.328.551-1.041.73-1.593.402z"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Spotify</div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 1 }}>Music integration</div>
        </div>
        {connected && (
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: SPOTIFY_GREEN, background: 'rgba(29,185,84,0.12)', border: '1px solid rgba(29,185,84,0.25)', padding: '2px 8px', borderRadius: 20 }}>Connected</span>
        )}
      </div>

      {!connected ? (
        /* ── Not connected ── */
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <p style={{ margin: '0 0 6px', fontSize: 13, color: C.muted }}>Link your Spotify account to embed playlists in your profile.</p>
          <p style={{ margin: '0 0 18px', fontSize: 11, color: C.dim }}>Works with Free and Premium accounts.</p>
          <button
            onClick={connect}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 30, border: 'none', background: loading ? '#116730' : SPOTIFY_GREEN, color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', outline: 'none', transition: 'background 0.2s' }}
          >
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin-in 0.8s linear infinite' }}><circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/><path d="M7 2A5 5 0 0112 7" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                Connecting…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.52 17.32c-.225.359-.706.471-1.065.247-2.921-1.785-6.596-2.188-10.924-1.198-.417.096-.833-.165-.929-.582-.096-.417.165-.833.582-.929 4.735-1.082 8.795-.616 12.07 1.388.358.224.47.705.246 1.074zm1.472-3.272c-.282.447-.884.587-1.331.305-3.342-2.054-8.437-2.649-12.389-1.449-.512.155-1.053-.133-1.208-.644-.155-.512.133-1.053.644-1.208 4.514-1.37 10.121-.707 13.98 1.665.447.282.587.883.304 1.331zm.127-3.407C15.553 8.327 8.826 8.1 5.023 9.269c-.614.187-1.264-.16-1.451-.774-.187-.614.16-1.264.774-1.451 4.39-1.333 11.69-1.075 16.301 1.636.552.328.731 1.042.403 1.594-.328.551-1.041.73-1.593.402z"/></svg>
                Connect Spotify
              </>
            )}
          </button>
        </div>
      ) : (
        /* ── Connected ── */
        <div className="slide-up">
          {/* Connected user row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(29,185,84,0.07)', border: '1px solid rgba(29,185,84,0.18)', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${SPOTIFY_GREEN}`, flexShrink: 0, background: C.surface2 }}>
              <img src={avatarUrl} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                {userName}
                <svg width="12" height="12" viewBox="0 0 24 24" fill={SPOTIFY_GREEN}><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.52 17.32c-.225.359-.706.471-1.065.247-2.921-1.785-6.596-2.188-10.924-1.198-.417.096-.833-.165-.929-.582-.096-.417.165-.833.582-.929 4.735-1.082 8.795-.616 12.07 1.388.358.224.47.705.246 1.074zm1.472-3.272c-.282.447-.884.587-1.331.305-3.342-2.054-8.437-2.649-12.389-1.449-.512.155-1.053-.133-1.208-.644-.155-.512.133-1.053.644-1.208 4.514-1.37 10.121-.707 13.98 1.665.447.282.587.883.304 1.331zm.127-3.407C15.553 8.327 8.826 8.1 5.023 9.269c-.614.187-1.264-.16-1.451-.774-.187-.614.16-1.264.774-1.451 4.39-1.333 11.69-1.075 16.301 1.636.552.328.731 1.042.403 1.594-.328.551-1.041.73-1.593.402z"/></svg>
              </div>
              <div style={{ fontSize: 10, color: SPOTIFY_GREEN, marginTop: 1, fontWeight: 500 }}>Spotify Free · elloise.cruz</div>
            </div>
            <button onClick={() => setConnected(false)} style={{ fontSize: 10, color: C.dim, background: 'none', border: 'none', cursor: 'pointer', outline: 'none', padding: '4px 8px', borderRadius: 6 }}>Disconnect</button>
          </div>

          {/* Playlist picker */}
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.dim }}>Select Playlist</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {SPOTIFY_PLAYLISTS.map(pl => (
              <button
                key={pl.id}
                onClick={() => setPlaylist(pl.id)}
                style={{ padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${playlist === pl.id ? SPOTIFY_GREEN + '60' : C.border}`, background: playlist === pl.id ? 'rgba(29,185,84,0.10)' : C.surface2, color: playlist === pl.id ? SPOTIFY_GREEN : C.muted, fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none', textAlign: 'left', display: 'flex', gap: 6, alignItems: 'center', transition: 'all 0.15s' }}
              >
                <span>{pl.emoji}</span> {pl.name}
              </button>
            ))}
          </div>

          {/* Embedded Spotify player */}
          <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            <iframe
              key={playlist}
              src={`https://open.spotify.com/embed/playlist/${playlist}?utm_source=generator&theme=${theme === 'dark' ? '0' : '1'}`}
              width="100%"
              height="220"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ display: 'block' }}
              title="Spotify playlist"
            />
          </div>
        </div>
      )}
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  // ── Theme management ──────────────────────────────────────────────────
  const [theme, setTheme] = useState<ThemeType>(() => {
    try { return (localStorage.getItem('sensorysync-theme') as ThemeType) || 'dark' } catch { return 'dark' }
  })

  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('sensorysync-theme', next) } catch {}
      return next
    })
  }

  // Apply palette to mutable C before the subtree renders
  Object.assign(C, theme === 'dark' ? DARK_C : LIGHT_C)

  const NAV_TABS = [
    {
      id: 'dashboard', label: 'Dashboard',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="2" width="8" height="8" rx="2.5" fill={active ? C.coral : 'none'} stroke={active ? C.coral : C.dim} strokeWidth="1.5"/>
          <rect x="12" y="2" width="8" height="8" rx="2.5" fill="none" stroke={active ? C.coral : C.dim} strokeWidth="1.5"/>
          <rect x="2" y="12" width="8" height="8" rx="2.5" fill="none" stroke={active ? C.coral : C.dim} strokeWidth="1.5"/>
          <rect x="12" y="12" width="8" height="8" rx="2.5" fill="none" stroke={active ? C.coral : C.dim} strokeWidth="1.5"/>
        </svg>
      ),
    },
    {
      id: 'presets', label: 'Presets',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4 6h14M4 11h9M4 16h11" stroke={active ? C.coral : C.dim} strokeWidth="1.6" strokeLinecap="round"/>
          <circle cx="17" cy="16" r="3" stroke={active ? C.coral : C.dim} strokeWidth="1.5"/>
        </svg>
      ),
    },
    {
      id: 'stats', label: 'Stats',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M3 18L7.5 11l4 4.5L15 7l4 7" stroke={active ? C.coral : C.dim} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: 'profile', label: 'Profile',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="7.5" r="3.5" stroke={active ? C.coral : C.dim} strokeWidth="1.5"/>
          <path d="M4 18.5c0-3.87 3.13-7 7-7h0c3.87 0 7 3.13 7 7" stroke={active ? C.coral : C.dim} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ]

  return (
    <ThemeCtx.Provider value={{ theme, toggle: toggleTheme }}>
      <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '0 16px 100px', transition: 'background 0.3s' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {activeTab === 'dashboard' && <DashboardScreen />}
          {activeTab === 'presets'   && <PresetsScreen />}
          {activeTab === 'stats'     && <StatsScreen />}
          {activeTab === 'profile'   && <ProfileScreen />}

        </div>

        {/* Bottom nav */}
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: C.navBg, backdropFilter: 'blur(20px)', borderTop: `1px solid ${C.border}`, display: 'flex', paddingBottom: 8, zIndex: 100, transition: 'background 0.3s' }}>
          {NAV_TABS.map(tab => (
            <NavTab key={tab.id} label={tab.label} icon={tab.icon(activeTab === tab.id)} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
          ))}
        </div>
      </div>
    </ThemeCtx.Provider>
  )
}
