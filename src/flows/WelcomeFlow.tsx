import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DalyLogo } from '@/components/DalyLogo'
import { useTripStore } from '@/context/TripContext'
import { DEMO_SEEN_KEY } from '@/demo/constants'
import { c } from '@/styles'

const FEATURES = [
  ['⛳  Live scoring', 'Every player, every hole — cards sync in real time.'],
  ['💰  Money, handled', 'Skins, Nassau, presses, snake & CTP — tracked and settled.'],
  ['🏆  Team formats', 'Stroke, scramble, shamble, match play, stableford & more.'],
  ['🤖  The Starter', 'AI commissioner — roasts, recaps, and daily drops.'],
  ['🎬  Trip Movie + Order of Merit', 'Highlight reel at the end, season standings all year.']
] as const

export function WelcomeFlow() {
  const navigate = useNavigate()
  const { loadDemo, state, trip } = useTripStore()
  const seenDemo = typeof window !== 'undefined' && localStorage.getItem(DEMO_SEEN_KEY) === '1'

  const resumeTrip = useMemo(() => {
    if (trip) return trip
    const id = state.activeTripId
    if (!id) return null
    return state.trips[id] || null
  }, [state.activeTripId, state.trips, trip])

  const exploreDemo = () => {
    const demoTrip = loadDemo()
    navigate(`/trip/${demoTrip.id}`)
  }

  return (
    <div
      className="dt-root dt-fade"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px'
      }}
    >
      <div
        className="dt-pop"
        style={{
          maxWidth: 440,
          width: '100%',
          padding: '30px 24px 22px',
          textAlign: 'center',
          background: c.flowGradient,
          border: `1px solid ${c.flowBorder}`,
          borderRadius: 18,
          boxShadow: '0 20px 60px rgba(8,20,40,.45)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <DalyLogo size={64} />
        </div>
        <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.18em', color: c.goldBright, marginBottom: 8 }}>
          THE GOLF-TRIP OPERATING SYSTEM
        </div>
        <div className="dt-display" style={{ fontSize: 30, fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
          Daly Trips
        </div>
        <div className="dt-cond" style={{ fontSize: 14, color: c.goldBright, letterSpacing: '.05em', marginTop: 9 }}>
          Run the trip. Win the trip.
        </div>
        <div style={{ fontSize: 13.5, color: c.onDarkMuted, lineHeight: 1.55, marginTop: 12 }}>
          Run your buddies&apos; golf trip like a tour event — scoring, bets, teams, and trash talk, all in one place.
        </div>

        {resumeTrip ? (
          <button
            className="dt-btn dt-glow dt-press"
            onClick={() => navigate(`/trip/${resumeTrip.id}`)}
            style={{
              width: '100%',
              marginTop: 20,
              marginBottom: 12,
              padding: 16,
              borderRadius: 13,
              cursor: 'pointer',
              background: c.felt,
              border: `2px solid ${c.goldBright}`,
              color: c.ink,
              textAlign: 'left'
            }}
          >
            <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.14em', opacity: 0.85, marginBottom: 4 }}>
              CONTINUE YOUR TRIP
            </div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{resumeTrip.name}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
              Code {resumeTrip.code} · {resumeTrip.players.length} players
            </div>
          </button>
        ) : null}

        <div style={{ textAlign: 'left', marginTop: resumeTrip ? 0 : 20, display: 'grid', gap: 11 }}>
          <div className="dt-cond" style={{ fontSize: 10.5, letterSpacing: '.14em', color: 'rgba(245,245,242,.5)' }}>
            WHAT YOU GET
          </div>
          {FEATURES.map(([title, desc], i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span
                style={{
                  flexShrink: 0,
                  marginTop: 1,
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: 'rgba(200,16,46,.2)',
                  border: `1px solid ${c.gold}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: c.goldBright
                }}
              >
                ✓
              </span>
              <div>
                <div className="dt-cond" style={{ fontSize: 14, fontWeight: 800, color: c.onDark, lineHeight: 1.2 }}>
                  {title}
                </div>
                <div style={{ fontSize: 12.5, color: c.onDarkMuted, lineHeight: 1.4, marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="dt-btn dt-glow dt-press"
          onClick={() => navigate('/plan')}
          style={{
            width: '100%',
            marginTop: 20,
            padding: 18,
            borderRadius: 13,
            cursor: 'pointer',
            background: c.gold,
            border: `2px solid ${c.goldBright}`,
            color: c.ink,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span className="dt-cond" style={{ fontSize: 15, fontWeight: 800, letterSpacing: '.06em' }}>
            CREATE AN EVENT
          </span>
        </button>

        <button
          className="dt-btn dt-press"
          onClick={() => navigate('/join')}
          style={{
            width: '100%',
            marginTop: 10,
            padding: 16,
            borderRadius: 13,
            cursor: 'pointer',
            background: 'transparent',
            border: `1.5px solid rgba(200,16,46,.45)`,
            color: c.onDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span className="dt-cond" style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.06em' }}>
            JOIN WITH CODE
          </span>
        </button>

        {!seenDemo ? (
          <div style={{ fontSize: 12, color: 'rgba(245,245,242,.5)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
            New here? Try a live sample trip before you create your own.
          </div>
        ) : null}

        <button
          className="dt-btn dt-press"
          onClick={exploreDemo}
          style={{
            width: '100%',
            marginTop: seenDemo ? 10 : 8,
            padding: 14,
            borderRadius: 13,
            cursor: 'pointer',
            background: 'transparent',
            border: '1.5px solid rgba(245,245,242,.2)',
            color: 'rgba(245,245,242,.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span className="dt-cond" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em' }}>
            EXPLORE THE DEMO
          </span>
        </button>

        <div style={{ fontSize: 11, color: 'rgba(245,245,242,.45)', lineHeight: 1.6, marginTop: 16, textAlign: 'center' }}>
          Tracks friendly wagers only — never places, holds, or processes bets or payments.
        </div>
      </div>
    </div>
  )
}
