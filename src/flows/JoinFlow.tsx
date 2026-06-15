import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { findTripByCodeCloud } from '@/cloudStore'
import { findTripByCode } from '@/localStore'
import { useTripStore } from '@/context/TripContext'
import { DEMO_TRIP_CODE, DEMO_TRIP_ID } from '@/demo/seedTrip'
import { DalyLogo } from '@/components/DalyLogo'
import type { AppState, Player, Trip } from '@/types/trip'
import { c, flowInput } from '@/styles'

const STARTER_LINES = [
  'Handicaps are suggestions. Egos are not.',
  'Someone will claim they were "pressured" into that triple.',
  'The only thing shorter than your temper is your putter today.',
  'Welcome aboard. The ledger never forgets.'
]

type Phase = 'invite' | 'claim' | 'confirm'

async function lookupTrip(code: string, appState: AppState): Promise<Trip | null> {
  const upper = code.trim().toUpperCase()
  if (!upper) return null
  const local = findTripByCode(appState, upper)
  if (local) return local
  const cloud = await findTripByCodeCloud(upper)
  if (cloud) return cloud
  if (upper === DEMO_TRIP_CODE) return null
  return null
}

export function JoinFlow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { joinByCodeAsync, state, loadDemo } = useTripStore()
  const [code, setCode] = useState('')
  const [preview, setPreview] = useState<Trip | null>(null)
  const [claimed, setClaimed] = useState<Player | null>(null)
  const [nick, setNick] = useState('')
  const [hcp, setHcp] = useState('18')
  const [venmo, setVenmo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<Phase>('invite')
  const [starterLine] = useState(() => STARTER_LINES[Math.floor(Math.random() * STARTER_LINES.length)])

  const refreshPreview = useCallback(
    async (raw: string) => {
      const upper = raw.trim().toUpperCase()
      if (upper.length < 4) {
        setPreview(null)
        return
      }
      if (upper === DEMO_TRIP_CODE) {
        const demo = state.trips[DEMO_TRIP_ID] || null
        setPreview(demo)
        return
      }
      const trip = await lookupTrip(upper, state)
      setPreview(trip)
    },
    [state]
  )

  useEffect(() => {
    const fromUrl = searchParams.get('code')?.trim().toUpperCase()
    if (!fromUrl || fromUrl.length < 4) return
    setCode(fromUrl)
    refreshPreview(fromUrl)
  }, [searchParams, refreshPreview])

  useEffect(() => {
    const t = setTimeout(() => refreshPreview(code), 300)
    return () => clearTimeout(t)
  }, [code, refreshPreview])

  const pickPlayer = (player: Player) => {
    setClaimed(player)
    setNick(player.nick || player.name || '')
    setHcp(String(player.hcp ?? 18))
    setVenmo(player.venmo || '')
    setPhase('confirm')
  }

  const goClaim = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('Enter a join code')
      return
    }
    setLoading(true)
    setError('')
    if (trimmed === DEMO_TRIP_CODE) {
      loadDemo()
      setLoading(false)
      navigate(`/trip/${DEMO_TRIP_ID}`)
      return
    }
    let trip = preview || (await lookupTrip(trimmed, state))
    setLoading(false)
    if (!trip) {
      setError('Trip not found. Try BOYS26 for the demo.')
      return
    }
    setPreview(trip)
    if (trip.players.length > 0) setPhase('claim')
    else setPhase('confirm')
  }

  const confirmJoin = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    if (!nick.trim()) {
      setError('Enter your nickname')
      return
    }
    setLoading(true)
    setError('')
    const found = await joinByCodeAsync(trimmed, {
      nick: nick.trim(),
      hcp: Number(hcp) || 18,
      venmo: venmo.trim(),
      claimPlayerId: claimed?.id
    })
    setLoading(false)
    if (found) navigate(`/trip/${found.id}`)
    else setError('Trip not found. Try BOYS26 for the demo.')
  }

  const displayTrip = preview
  const initial = (displayTrip?.players[0]?.nick || '?').trim()[0]?.toUpperCase() || '?'

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
            <div className="dt-cond" style={{ fontSize: 11, letterSpacing: '.26em', color: c.gold, marginBottom: 10 }}>
              YOU&apos;VE BEEN SUMMONED
            </div>
            <div className="dt-display" style={{ fontSize: 32, fontWeight: 900, color: c.creamSoft, lineHeight: 1.05, marginBottom: 8 }}>
              {displayTrip?.name || 'A Daly Trip'}
            </div>
            <div className="dt-cond" style={{ fontSize: 13, color: c.muted, marginBottom: 16 }}>
              {displayTrip
                ? `${displayTrip.players.length} player${displayTrip.players.length === 1 ? '' : 's'} · ${displayTrip.location || 'Location TBD'}`
                : 'Enter your join code below'}
            </div>

            {displayTrip && displayTrip.players.length > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                {displayTrip.players.slice(0, 6).map((p, i) => (
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
                {displayTrip.players.length > 6 ? (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      marginLeft: -10,
                      background: c.surfaceGold,
                      border: `2px solid ${c.bg}`,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: c.goldBright
                    }}
                  >
                    +{displayTrip.players.length - 6}
                  </div>
                ) : null}
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
              onClick={goClaim}
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
        ) : null}

        {phase === 'claim' && displayTrip ? (
          <div>
            <div className="dt-cond" style={{ fontSize: 11, letterSpacing: '.22em', color: c.gold, marginBottom: 10 }}>
              CLAIM YOUR SPOT
            </div>
            <div className="dt-display" style={{ fontSize: 28, fontWeight: 900, color: c.creamSoft, marginBottom: 8 }}>
              Who are you?
            </div>
            <p style={{ fontSize: 13, color: c.muted, marginBottom: 16, lineHeight: 1.5 }}>
              Tap your name if you&apos;re already on the roster.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {displayTrip.players.map(p => (
                <button
                  key={p.id}
                  className="dt-btn dt-press"
                  onClick={() => pickPlayer(p)}
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: c.card,
                    border: `1.5px solid ${c.line}`,
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 700, color: c.creamSoft }}>{p.nick || p.name}</span>
                  <span className="dt-cond" style={{ fontSize: 12, color: c.muted }}>HCP {p.hcp}</span>
                </button>
              ))}
            </div>
            <button
              className="dt-btn"
              onClick={() => {
                setClaimed(null)
                setNick('')
                setHcp('18')
                setVenmo('')
                setPhase('confirm')
              }}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 12,
                cursor: 'pointer',
                background: c.surfaceSubtle,
                border: `1.5px solid ${c.lineStrong}`,
                color: c.cream,
                fontSize: 13
              }}
            >
              I&apos;m new — add me
            </button>
            <button
              className="dt-btn"
              onClick={() => setPhase('invite')}
              style={{ width: '100%', marginTop: 10, padding: 10, background: 'transparent', border: 'none', color: c.muted, cursor: 'pointer', fontSize: 12 }}
            >
              Back
            </button>
          </div>
        ) : null}

        {phase === 'confirm' ? (
          <div>
            <div className="dt-cond" style={{ fontSize: 11, letterSpacing: '.22em', color: c.gold, marginBottom: 10 }}>
              CONFIRM YOUR CARD
            </div>
            <div className="dt-display" style={{ fontSize: 28, fontWeight: 900, color: c.creamSoft, marginBottom: 20 }}>
              Scorecard details
            </div>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Join code"
              maxLength={6}
              readOnly={!!searchParams.get('code')}
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
              onClick={confirmJoin}
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
              onClick={() => setPhase(displayTrip && displayTrip.players.length > 0 ? 'claim' : 'invite')}
              style={{ width: '100%', marginTop: 10, padding: 10, background: 'transparent', border: 'none', color: c.muted, cursor: 'pointer', fontSize: 12 }}
            >
              Back
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
