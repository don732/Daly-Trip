import { useNavigate } from 'react-router-dom'
import { useTripStore } from '@/context/TripContext'
import { DalyLogo } from '@/components/DalyLogo'
import { c } from '@/styles'

const FEATURES = [
  ['⛳  Live scoring', 'Every player, every hole, in real time.'],
  ['💰  Money, handled', 'Skins, Nassau, presses — auto-tracked and settled up.'],
  ['🏆  Team formats', 'Best-ball, scramble, match play and 36 more formats.'],
  ['🤖  The Starter', 'An AI commissioner narrating your trip and talking trash.'],
  ['🎬  Trip Movie + Order of Merit', 'Highlight reel at the end, season standings all year.']
] as const

export function WelcomeFlow() {
  const navigate = useNavigate()
  const { loadDemo } = useTripStore()

  return (
    <div
      className="dt-root dt-fade"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: c.bg
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: '100%',
          background: c.card,
          border: `2px solid ${c.goldBright}`,
          borderRadius: 20,
          padding: '30px 20px 24px',
          boxShadow: '0 8px 32px rgba(13,31,60,.14)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <DalyLogo size={72} />
          </div>
          <div
            className="dt-cond"
            style={{ fontSize: 11, letterSpacing: '.2em', color: c.gold, marginBottom: 6 }}
          >
            THE GOLF-TRIP OPERATING SYSTEM
          </div>
          <div className="dt-display" style={{ fontSize: 36, fontWeight: 900, color: c.creamSoft, lineHeight: 1 }}>
            Daly Trips
          </div>
          <div
            className="dt-cond"
            style={{ fontSize: 15, color: c.gold, letterSpacing: '.04em', marginTop: 8, fontWeight: 600 }}
          >
            Run the trip. Win the trip.
          </div>
          <div style={{ fontSize: 14, color: c.cream, lineHeight: 1.55, marginTop: 10, opacity: 0.75 }}>
            Run your buddies&apos; golf trip like a tour event — scoring, bets, teams, and trash talk, all in one place.
          </div>
        </div>

        <div
          className="dt-cond"
          style={{ fontSize: 11, letterSpacing: '.18em', color: c.gold, fontWeight: 700, marginBottom: 10 }}
        >
          WHAT YOU GET
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {FEATURES.map(([title, desc], i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                padding: '12px 14px',
                background: c.cardFeature,
                border: `1.5px solid ${c.goldBright}`,
                borderRadius: 12
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: c.gold,
                  border: `2px solid ${c.cardWarm}`,
                  color: c.ink,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 900
                }}
              >
                ✓
              </span>
              <div style={{ flex: 1 }}>
                <div className="dt-cond" style={{ fontSize: 15, fontWeight: 800, color: c.creamSoft, lineHeight: 1.2 }}>
                  {title}
                </div>
                <div style={{ fontSize: 13, color: c.cream, lineHeight: 1.4, marginTop: 3, opacity: 0.72 }}>{desc}</div>
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
            background: c.felt,
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
          onClick={() => {
            loadDemo()
            navigate('/trip/demo')
          }}
          style={{
            width: '100%',
            marginTop: 10,
            padding: 16,
            borderRadius: 13,
            cursor: 'pointer',
            background: c.card,
            border: `2px solid ${c.gold}`,
            color: c.felt,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span className="dt-cond" style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.06em' }}>
            EXPLORE THE DEMO
          </span>
        </button>

        <div style={{ fontSize: 11, color: c.cream, lineHeight: 1.6, marginTop: 16, textAlign: 'center', opacity: 0.5 }}>
          Tracks friendly wagers only — never places, holds, or processes bets or payments.
        </div>
      </div>
    </div>
  )
}
