export const c = {
  bg: '#06170F',
  card: '#0D2B1F',
  cardDeep: '#081912',
  line: 'rgba(255,255,255,.08)',
  cream: '#F5F0E6',
  muted: 'rgba(245,240,230,.45)',
  gold: '#C9A24B',
  goldDim: 'rgba(201,162,75,.25)',
  red: '#D26049',
  green: '#3D8B5F',
  pine: '#2A6B4A',
  sand: '#C4A882',
  black: '#000000'
} as const

export const STYLES = `
.dt-root { font-family:'Archivo',sans-serif; color:${c.cream}; background:${c.bg}; }
.dt-shell { max-width:480px; margin:0 auto; min-height:100%; position:relative; }
.dt-card { background:${c.card}; border:1px solid ${c.line}; border-radius:16px; }
.dt-card-gold { background:linear-gradient(170deg,#0D2B1F,#06170F); border:1px solid ${c.goldDim}; border-radius:16px; }
.dt-btn { font-family:'Archivo',sans-serif; border:none; cursor:pointer; transition:transform .08s,opacity .1s; }
.dt-btn:active { transform:scale(.97); }
.dt-btn-gold { background:linear-gradient(135deg,${c.gold},#A8842F); color:${c.bg}; font-weight:700; }
.dt-btn-ghost { background:rgba(255,255,255,.04); border:1px solid ${c.line}; color:${c.cream}; }
.dt-num { font-family:'Archivo',sans-serif; font-variant-numeric:tabular-nums; letter-spacing:.01em; }
.dt-cond { font-family:'Archivo',sans-serif; letter-spacing:.04em; }
.dt-tab { transition:color .15s,transform .12s; }
.dt-tab:active { transform:scale(.92); }
.dt-glow { box-shadow:0 0 20px rgba(201,162,75,.15); }
.dt-sheet { background:linear-gradient(170deg,#0D2B1F,#06170F); border-radius:24px 24px 0 0; border-top:1px solid ${c.goldDim}; }
.dt-chip { display:inline-flex; align-items:center; justify-content:center; min-width:28px; height:28px; border-radius:8px; font-weight:700; font-size:13px; }
.dt-chip-under { background:rgba(210,96,73,.18); color:#E8917E; border:1px solid rgba(210,96,73,.35); }
.dt-chip-over { background:rgba(61,139,95,.18); color:#7BC99A; border:1px solid rgba(61,139,95,.35); }
.dt-chip-even { background:rgba(255,255,255,.06); color:${c.cream}; border:1px solid ${c.line}; }
.dt-step { transition:transform .08s,background .1s; }
.dt-step:active { transform:scale(.88); }
@keyframes dt-fade-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
.dt-fade-in { animation:dt-fade-in .35s ease-out; }
`

export const BUILD_STAMP = 'build 0701a'

export function formatScore(v: number): string {
  if (v > 0) return `+${v}`
  if (v === 0) return 'E'
  return `${v}`
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function tripCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i += 1) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}
