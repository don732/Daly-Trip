import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { useTripStore } from '@/context/TripContext'
import { DalyLogo } from '@/components/DalyLogo'
import { c, flowInput } from '@/styles'

const STARTER_LINES = [
  'Handicaps are suggestions. Egos are not.',
  'Someone will claim they were "pressured" into that triple.',
  'The only thing shorter than your temper is your putter today.',
  'Welcome aboard. The ledger never forgets.'
]

export function JoinFlow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { joinByCodeAsync, state } = useTripStore()
  const [code, setCode] = useState('')
  const [nick, setNick] = useState('')
  const [hcp, setHcp] = useState('18')
  const [venmo, setVenmo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<'invite' | 'confirm'>('invite')

  const previewTrip = code.trim().length >= 4 ? Object.values(state.trips).find(t => t.code === code.trim().toUpperCase()) : null
  const starterLine = STARTER_LINES[Math.floor(Math.random() * STARTER_LINES.length)]

  useEffect(() => {
    const fromUrl = searchParams.get('code')?.trim().toUpperCase()
    if (!fromUrl || fromUrl.length < 4) return
    setCode(fromUrl)
    setPhase('confirm')
  }, [searchParams])

  const submit = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('Enter a join code')
      return
    }
    if (phase === 'invite') {
      setPhase('confirm')
      return
    }
    if (!nick.trim()) {
      setError('Enter your nickname')
      return
    }
    setLoading(true)
    setError('')
    const found = await joinByCodeAsync(trimmed)
    setLoading(false)
    if (found) {
      navigate(`/trip/${found.id}`)
      return
    }
    setError('Trip not found. Try BOYS26 for the demo.')
  }

  const initial = (previewTrip?.players[0]?.nick || '?').trim()[0]?.toUpperCase() || '?'

  return (
    <div
      className="dt-root dt-fade"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        background: c.bg
      }}
    >
      <div style={{ maxWidth: 480, width: '100%', position: 'relative' }}>
        <button
          onClick={() => navigate('/')}
          style={{ position: 'absolute', top: -8, right: 0, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={24} color={c.muted} />
        </button>

        {phase === 'invite' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', marginBottom: 16 }}>
              <DalyLogo size={72} />
            </div>
            <div
              className="dt-cond"
              style={{ fontSize: 11, letterSpacing: '.26em', color: c.gold, marginBottom: 10 }}
            >
              YOU&apos;VE BEEN SUMMONED
            </div>
            <div
              className="dt-display"
              style={{ fontSize: 32, fontWeight: 900, color: c.creamSoft, lineHeight: 1.05, marginBottom: 8 }}
            >
              {previewTrip?.name || 'A Daly Trip'}
            </div>
            <div className="dt-cond" style={{ fontSize: 13, color: c.muted, marginBottom: 16 }}>
              {previewTrip
                ? `${previewTrip.players.length} player${previewTrip.players.length === 1 ? '' : 's'} · ${previewTrip.location || 'Location TBD'}`
                : 'Enter your join code below'}
            </div>

            {previewTrip && previewTrip.players.length > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                {previewTrip.players.slice(0, 6).map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      marginLeft: i === 0 ? 0 : -10,
                      background: 'radial-gradient(circle at 40% 30%,#1A2744,#0D1629)',
                      border: `2px solid ${c.bg}`,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      color: c.cardWarm,
                      fontFamily: "'Archivo', sans-serif"
                    }}
                  >
                    {(p.nick || '?').trim()[0]?.toUpperCase() || '?'}
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  margin: '0 auto 20px',
                  background: 'radial-gradient(circle at 40% 30%,#1A2744,#0D1629)',
                  border: `2px solid ${c.bg}`,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  color: c.cardWarm
                }}
              >
                {initial}
              </div>
            )}

            <div
              style={{
                background: 'rgba(154,124,26,.08)',
                border: '1px solid rgba(154,124,26,.3)',
                borderRadius: 14,
                padding: '12px 16px',
                marginBottom: 24,
                textAlign: 'left'
              }}
            >
              <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.14em', color: c.gold, marginBottom: 5 }}>
                THE STARTER SAYS
              </div>
              <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: 13.5, color: c.cream, lineHeight: 1.5, fontStyle: 'italic' }}>
                &quot;{starterLine}&quot;
              </div>
            </div>

            <input
              value={code}
              onChange={e => {
                setCode(e.target.value.toUpperCase())
                setError('')
              }}
              placeholder="BOYS26"
              maxLength={6}
              style={{
                ...flowInput,
                textAlign: 'center',
                fontSize: 22,
                letterSpacing: '.2em',
                fontWeight: 700,
                marginBottom: 12
              }}
            />
            {error ? <p style={{ color: c.red, fontSize: 13, marginTop: 0 }}>{error}</p> : null}
            <button
              className="dt-btn dt-glow dt-press"
              onClick={submit}
              disabled={loading}
              style={{
                width: '100%',
                padding: 18,
                borderRadius: 14,
                marginTop: 8,
                cursor: 'pointer',
                background: c.felt,
                border: `2px solid ${c.goldBright}`,
                color: c.ink,
                opacity: loading ? 0.7 : 1
              }}
            >
              <span className="dt-cond" style={{ fontSize: 15, fontWeight: 800, letterSpacing: '.04em' }}>
                {loading ? 'LOOKING UP…' : 'JOIN THE TRIP →'}
              </span>
            </button>
          </div>
        ) : (
          <div>
            <div
              className="dt-cond"
              style={{ fontSize: 11, letterSpacing: '.22em', color: c.gold, marginBottom: 10 }}
            >
              CLAIM YOUR SPOT
            </div>
            <div className="dt-display" style={{ fontSize: 28, fontWeight: 900, color: c.creamSoft, marginBottom: 20 }}>
              Who are you on the scorecard?
            </div>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Join code"
              maxLength={6}
              style={{ ...flowInput, marginBottom: 12, letterSpacing: '.12em', fontWeight: 700 }}
            />
            <input
              value={nick}
              onChange={e => {
                setNick(e.target.value)
                setError('')
              }}
              placeholder="Nickname"
              style={{ ...flowInput, marginBottom: 12 }}
            />
            <input
              value={hcp}
              onChange={e => setHcp(e.target.value)}
              placeholder="Handicap"
              type="number"
              style={{ ...flowInput, marginBottom: 12 }}
            />
            <input
              value={venmo}
              onChange={e => setVenmo(e.target.value)}
              placeholder="Venmo @handle (optional)"
              style={{ ...flowInput, marginBottom: 12 }}
            />
            {error ? <p style={{ color: c.red, fontSize: 13 }}>{error}</p> : null}
            <button
              className="dt-btn dt-glow dt-press"
              onClick={submit}
              disabled={loading}
              style={{
                width: '100%',
                padding: 18,
                borderRadius: 14,
                marginTop: 8,
                cursor: 'pointer',
                background: c.felt,
                border: `2px solid ${c.goldBright}`,
                color: c.ink,
                opacity: loading ? 0.7 : 1
              }}
            >
              <span className="dt-cond" style={{ fontSize: 15, fontWeight: 800 }}>
                {loading ? 'JOINING…' : 'CONFIRM & JOIN'}
              </span>
            </button>
            <button
              className="dt-btn"
              onClick={() => setPhase('invite')}
              style={{
                width: '100%',
                marginTop: 10,
                padding: 10,
                background: 'transparent',
                border: 'none',
                color: c.muted,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
