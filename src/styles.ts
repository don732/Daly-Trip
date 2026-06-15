import type { CSSProperties } from 'react'

export const c = {
  bg: '#F5F2EA',
  pageOuter: '#F5F3EE',
  card: '#FFFFFF',
  cardDeep: '#F5F2EA',
  cardWarm: '#FFFDF6',
  cardFeature: '#FDFAF4',
  line: 'rgba(13,31,60,0.18)',
  lineStrong: 'rgba(26,39,68,0.22)',
  cream: '#0D1F3C',
  creamSoft: '#060E1E',
  muted: 'rgba(13,31,60,0.55)',
  gold: '#B8903A',
  goldBright: '#C9A24B',
  goldDim: 'rgba(184,144,58,.25)',
  felt: '#0D1F3C',
  ink: '#FFFFFF',
  red: '#B82030',
  green: '#1A6630',
  win: '#1A6630',
  pine: '#2A6B4A',
  sand: '#C4A882',
  black: '#000000',
  surfaceSubtle: 'rgba(13,31,60,.06)',
  surfaceGold: 'rgba(184,144,58,.14)',
  surfaceGoldStrong: 'rgba(184,144,58,.18)'
} as const

export const STYLES = `
.dt-root { font-family:'Archivo',sans-serif; color:${c.cream}; background:${c.bg}; min-height:100vh; }
.dt-display { font-family:'Archivo',sans-serif; font-weight:800; }
.dt-cond { font-family:'Archivo',sans-serif; letter-spacing:.04em; }
.dt-num { font-family:'Archivo',sans-serif; font-variant-numeric:tabular-nums; letter-spacing:.01em; }
.dt-shell { max-width:480px; margin:0 auto; position:relative; min-height:100vh;
  box-shadow: 0 0 0 1px ${c.line}, 0 0 40px rgba(13,31,60,.10); }

.dt-card {
  background:#FFFFFF;
  border:1.5px solid ${c.line};
  border-radius:14px;
  box-shadow:0 1px 6px rgba(13,31,60,.06);
}
.dt-card-gold {
  background:${c.cardWarm};
  border:1.5px solid ${c.goldBright};
  box-shadow:0 2px 12px rgba(184,144,58,.12);
}
.dt-press:active { transform:scale(.97); }
.dt-btn { font-family:'Archivo',sans-serif; border:none; cursor:pointer; transition:transform .1s,filter .15s; }
.dt-btn:active { transform:scale(.94); }
.dt-btn-gold { background:${c.felt}; border:2px solid ${c.goldBright}; color:${c.ink}; font-weight:700; }
.dt-btn-ghost { background:#FFFFFF; border:1.5px solid ${c.lineStrong}; color:${c.cream}; }
.dt-step { transition:transform .08s,background .1s; }
.dt-step:active { transform:scale(.88); }
.dt-tab { transition:color .15s,transform .12s; }
.dt-tab:active { transform:scale(.92); }

.dt-fade { animation:dtFade .35s cubic-bezier(.2,.7,.3,1) both; }
@keyframes dtFade { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:none;} }
.dt-pop { animation:dtPop .22s cubic-bezier(.2,1.4,.4,1) both; }
@keyframes dtPop { from{opacity:0;transform:scale(.93);} to{opacity:1;transform:none;} }
.dt-sheet { animation:dtSheet .28s cubic-bezier(.2,.8,.2,1) both; }
@keyframes dtSheet { from{transform:translateY(100%);} to{transform:none;} }
.dt-glow { animation:dtGlow 2.4s ease-in-out infinite; }
@keyframes dtGlow { 0%,100%{box-shadow:0 0 8px 0 rgba(184,144,58,.20);} 50%{box-shadow:0 0 18px 0 rgba(184,144,58,.34);} }

.dt-scroll::-webkit-scrollbar { height:4px; width:4px; }
.dt-scroll::-webkit-scrollbar-thumb { background:${c.line}; border-radius:8px; }
.dt-noscroll::-webkit-scrollbar { display:none; }
.dt-divider { height:1px; background:${c.line}; }

.dt-ticker {
  position:relative; overflow:hidden; cursor:pointer;
  background:${c.felt};
  border-top:2px solid ${c.gold};
  border-bottom:2px solid ${c.gold};
}
.dt-ticker-track { display:inline-flex; align-items:center; white-space:nowrap; will-change:transform; animation:dtTicker 40s linear infinite; }
.dt-ticker:hover .dt-ticker-track,.dt-ticker:active .dt-ticker-track { animation-play-state:paused; }
@keyframes dtTicker { from{transform:translateX(0);} to{transform:translateX(-50%);} }

.dt-live-dot { animation:dtLive 1.1s ease-in-out infinite; }
@keyframes dtLive { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.3;transform:scale(.75);} }

.dt-chip { display:inline-flex; align-items:center; justify-content:center; min-width:28px; height:28px; border-radius:8px; font-weight:700; font-size:13px; }
.dt-chip-under { background:rgba(184,32,48,.12); color:#B82030; border:1px solid rgba(184,32,48,.28); }
.dt-chip-over { background:rgba(26,102,48,.12); color:#1A6630; border:1px solid rgba(26,102,48,.28); }
.dt-chip-even { background:rgba(13,31,60,.06); color:${c.cream}; border:1px solid ${c.line}; }
`

export const flowInput: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '13px 15px',
  borderRadius: 12,
  background: c.cardDeep,
  border: `1.5px solid ${c.lineStrong}`,
  color: c.creamSoft,
  fontSize: 16,
  outline: 'none',
  fontFamily: "'Archivo', sans-serif"
}

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
