import { useNavigate } from 'react-router-dom'
import { Flag, Sparkles, Users } from 'lucide-react'
import { useTripStore } from '@/context/TripContext'
import { c } from '@/styles'

export function WelcomeFlow() {
  const navigate = useNavigate()
  const { loadDemo } = useTripStore()

  return (
    <div className="dt-root dt-fade-in" style={{ minHeight: '100%', background: c.bg }}>
      <div className="dt-shell" style={{ padding: 'calc(28px + env(safe-area-inset-top)) 20px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg,#0D2B1F,#06170F)',
              border: `1px solid ${c.goldDim}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Flag size={34} color={c.gold} />
          </div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: c.cream, letterSpacing: '-.02em' }}>Daly Trips</h1>
          <p style={{ margin: '10px 0 0', color: c.muted, fontSize: 14, lineHeight: 1.5, maxWidth: 320, marginInline: 'auto' }}>
            The operating system for golf trips with the boys. Live scoring, skins, leaderboards, settlement, and a year-round feed.
          </p>
        </div>

        <div className="dt-card-gold" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Sparkles size={18} color={c.gold} />
            <span className="dt-cond" style={{ fontSize: 11, letterSpacing: '.12em', color: c.gold, textTransform: 'uppercase' }}>
              Why sign up
            </span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: c.cream, fontSize: 13, lineHeight: 1.7 }}>
            <li>Run the trip like a tour event — scoring, money, teams</li>
            <li>The Starter narrates the chaos in real time</li>
            <li>Settle up with Venmo-ready ledger math</li>
          </ul>
        </div>

        <button
          className="dt-btn dt-btn-gold dt-glow"
          onClick={() => {
            loadDemo()
            navigate('/trip/demo')
          }}
          style={{ width: '100%', padding: 16, borderRadius: 14, fontSize: 14, marginBottom: 10 }}
        >
          Explore the demo
        </button>

        <button
          className="dt-btn dt-btn-ghost"
          onClick={() => navigate('/plan')}
          style={{ width: '100%', padding: 16, borderRadius: 14, fontSize: 14, marginBottom: 10 }}
        >
          Get Started — Create a trip
        </button>

        <button
          className="dt-btn"
          onClick={() => navigate('/join')}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 14,
            fontSize: 13,
            background: 'transparent',
            color: c.muted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <Users size={16} />
          Have a join code?
        </button>
      </div>
    </div>
  )
}
