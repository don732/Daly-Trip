import type { CSSProperties } from 'react'

/** v11 design tokens (daly-trips-rwb-v11.html) */
export const c = {
  bg: '#FAFAF6',
  pageOuter: '#FAFAF6',
  green950: '#FAFAF6',
  green900: '#FFFFFF',
  green850: '#FBF8F0',
  green800: '#F4F0E6',
  card: '#FFFFFF',
  cardDeep: '#FBF8F0',
  cardWarm: '#FFFFFF',
  cardFeature: '#FBF8F0',
  line: '#E8E4D8',
  lineStrong: 'rgba(12,28,56,0.12)',
  cream: '#0F172A',
  creamSoft: '#0C1C38',
  onDark: '#F5F5F2',
  onDarkMuted: 'rgba(245,245,242,0.72)',
  muted: '#64748B',
  gold: '#C8102E',
  goldBright: '#E0243E',
  goldDim: 'rgba(200,16,46,0.25)',
  felt: '#0C1C38',
  ink: '#FFFFFF',
  red: '#DC2626',
  green: '#15803D',
  win: '#15803D',
  pine: '#2A6B4A',
  sand: '#C4A882',
  black: '#000000',
  surfaceSubtle: 'rgba(12,28,56,0.06)',
  surfaceGold: 'rgba(200,16,46,0.1)',
  surfaceGoldStrong: 'rgba(200,16,46,0.16)',
  flowGradient: 'linear-gradient(170deg, #0C1C38, #081428)',
  flowBorder: 'rgba(200,16,46,0.28)'
} as const

export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap');
* { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }

.dt-root {
  font-family:'Archivo',sans-serif;
  color:${c.cream};
  background:
    radial-gradient(1200px 600px at 50% -10%, ${c.green800} 0%, ${c.green950} 60%),
    ${c.green950};
  min-height:100vh;
}
.dt-display { font-family:'Archivo',sans-serif; font-weight:800; }
.dt-cond { font-family:'Archivo',sans-serif; letter-spacing:.04em; }
.dt-num { font-family:'Archivo',sans-serif; font-variant-numeric:tabular-nums; letter-spacing:.01em; }
.dt-shell {
  max-width:480px; margin:0 auto; position:relative; min-height:100vh;
  box-shadow:0 0 0 1px ${c.line}, 0 0 40px rgba(12,28,56,.10);
}

.dt-card {
  background:#FFFFFF;
  border:1px solid ${c.line};
  border-radius:18px;
  box-shadow:0 1px 3px rgba(15,23,42,.06), 0 8px 24px rgba(15,23,42,.06);
}
.dt-card-gold {
  background:#FFFFFF;
  border:1px solid ${c.gold};
  border-radius:18px;
  box-shadow:0 1px 3px rgba(15,23,42,.06), 0 8px 24px rgba(200,16,46,.10);
}
.dt-press:active { transform:scale(.97); }
.dt-btn { transition:transform .1s,filter .15s; border:none; cursor:pointer; }
.dt-btn:active { transform:scale(.94); }
.dt-btn-gold { background:${c.felt}; border:2px solid ${c.goldBright}; color:${c.ink}; font-weight:700; }
.dt-btn-ghost { background:#FFFFFF; border:1.5px solid ${c.line}; color:${c.cream}; }
.dt-step { transition:transform .08s,background .1s; }
.dt-step:active { transform:scale(.88); }
.dt-tab { transition:color .15s,transform .12s; }
.dt-tab:active { transform:scale(.92); }

.dt-fade { animation:dtFade .4s cubic-bezier(.2,.7,.3,1) both; }
.dt-fade-in { animation:dtFade .4s cubic-bezier(.2,.7,.3,1) both; }
@keyframes dtFade { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:none;} }
.dt-pop { animation:dtPop .25s cubic-bezier(.2,1.4,.4,1) both; }
@keyframes dtPop { from{opacity:0;transform:scale(.9);} to{opacity:1;transform:none;} }
.dt-sheet { animation:dtSheet .28s cubic-bezier(.2,.8,.2,1) both; }
@keyframes dtSheet { from{transform:translateY(100%);} to{transform:none;} }
.dt-glow { animation:dtGlow 2.4s ease-in-out infinite; }
@keyframes dtGlow { 0%,100%{box-shadow:0 0 8px 0 rgba(200,16,46,.18);} 50%{box-shadow:0 0 16px 0 rgba(200,16,46,.24);} }

.dt-scroll::-webkit-scrollbar { height:5px; width:5px; }
.dt-scroll::-webkit-scrollbar-thumb { background:${c.line}; border-radius:10px; }
.dt-noscroll::-webkit-scrollbar { display:none; }
.dt-divider { height:1px; background:${c.line}; }

.dt-ticker {
  position:relative; overflow:hidden; cursor:pointer;
  background:#FFFFFF;
  border-top:2px solid ${c.gold};
  border-bottom:2px solid ${c.gold};
}
.dt-ticker-track { display:inline-flex; align-items:center; white-space:nowrap; will-change:transform; animation:dtTicker 40s linear infinite; }
.dt-ticker:hover .dt-ticker-track,.dt-ticker:active .dt-ticker-track { animation-play-state:paused; }
@keyframes dtTicker { from{transform:translateX(0);} to{transform:translateX(-50%);} }

.dt-live-dot { animation:dtLive 1.1s ease-in-out infinite; }
@keyframes dtLive { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.3;transform:scale(.75);} }
.dt-flash { animation:dtFlash 1.8s ease-in-out infinite; }
@keyframes dtFlash { 0%,100%{box-shadow:0 0 0 0 rgba(200,16,46,0);} 50%{box-shadow:0 0 11px 0 rgba(200,16,46,.45);} }

.dt-chip { display:inline-flex; align-items:center; justify-content:center; min-width:28px; height:28px; border-radius:8px; font-weight:700; font-size:13px; }
.dt-chip-under { background:rgba(220,38,38,.12); color:${c.red}; border:1px solid rgba(220,38,38,.28); }
.dt-chip-over { background:rgba(21,128,61,.12); color:${c.win}; border:1px solid rgba(21,128,61,.28); }
.dt-chip-even { background:rgba(12,28,56,.06); color:${c.cream}; border:1px solid ${c.line}; }

.dt-otp-shake { animation:dtOtpShake .42s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes dtOtpShake {
  10%, 90% { transform:translateX(-1px); }
  20%, 80% { transform:translateX(2px); }
  30%, 50%, 70% { transform:translateX(-4px); }
  40%, 60% { transform:translateX(4px); }
}
`

export const flowInput: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '13px 15px',
  borderRadius: 12,
  background: 'rgba(255,255,255,0.08)',
  border: '1.5px solid rgba(200,16,46,0.25)',
  color: c.onDark,
  fontSize: 16,
  outline: 'none',
  fontFamily: "'Archivo', sans-serif"
}

export const flowInputLight: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '13px 15px',
  borderRadius: 12,
  background: c.cardDeep,
  border: `1.5px solid ${c.line}`,
  color: c.creamSoft,
  fontSize: 16,
  outline: 'none',
  fontFamily: "'Archivo', sans-serif"
}

export const flowShell: CSSProperties = {
  background: c.flowGradient,
  borderRadius: 24,
  padding: '24px 24px 36px',
  maxHeight: '90vh',
  overflowY: 'auto',
  border: `1px solid ${c.flowBorder}`,
  boxShadow: '0 20px 60px rgba(8,20,40,.45)'
}

export const BUILD_STAMP = 'build v11'

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
