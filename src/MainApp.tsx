import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Menu, MessageSquare, Trophy, X } from 'lucide-react'
import { useTripStore, switchActiveRound } from '@/context/TripContext'
import { getTrip } from '@/localStore'
import { TabBar } from '@/components/TabBar'
import { ClubhousePanel } from '@/components/ClubhousePanel'
import { StarterChat } from '@/components/StarterChat'
import type { Player } from '@/types/trip'
import { PlayerProfile } from '@/components/PlayerProfile'
import { TripTab } from '@/tabs/TripTab'
import { PlayTab } from '@/tabs/PlayTab'
import { BoardTab } from '@/tabs/BoardTab'
import { MoneyTab } from '@/tabs/MoneyTab'
import { FeedTab } from '@/tabs/FeedTab'
import { HighlightReel } from '@/components/HighlightReel'
import { SyncStatus } from '@/components/SyncStatus'
import { DEMO_TRIP_ID } from '@/demo/seedTrip'
import { BUILD_STAMP, c } from '@/styles'

const TABS = [
  { id: 'trip', label: 'Trip' },
  { id: 'play', label: 'Play' },
  { id: 'board', label: 'Board' },
  { id: 'money', label: 'Money' },
  { id: 'feed', label: 'Feed' }
]

export function MainApp() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { state, trip, updateTrip, setActiveTrip, addFeedPost, reactToPost, loadDemo } = useTripStore()
  const [tab, setTab] = useState('trip')
  const [menuOpen, setMenuOpen] = useState(false)
  const [clubhouseOpen, setClubhouseOpen] = useState(false)
  const [starterOpen, setStarterOpen] = useState(false)
  const [profilePlayer, setProfilePlayer] = useState<Player | null>(null)
  const [movieOpen, setMovieOpen] = useState(false)

  useEffect(() => {
    if (!tripId) return
    if (tripId === 'demo') {
      loadDemo()
      navigate(`/trip/${DEMO_TRIP_ID}`, { replace: true })
      return
    }
    if (tripId === DEMO_TRIP_ID) {
      const existing = getTrip(state, DEMO_TRIP_ID)
      if (existing) setActiveTrip(DEMO_TRIP_ID)
      else loadDemo()
      return
    }
    const found = getTrip(state, tripId)
    if (found) setActiveTrip(tripId)
    else if (tripId.toUpperCase() === 'BOYS26') loadDemo()
  }, [tripId, state.trips, setActiveTrip, loadDemo, navigate])

  if (!trip) {
    return (
      <div className="dt-root" style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg, color: c.muted }}>
        Loading trip…
      </div>
    )
  }

  const handleRoundChange = (index: number) => {
    updateTrip(t => switchActiveRound(t, index))
  }

  const handleScore = (playerId: string, hole: number, score: number | null) => {
    updateTrip(t => {
      const scores = { ...t.scores, [playerId]: [...(t.scores[playerId] || Array(18).fill(null))] }
      scores[playerId][hole] = score
      return { ...t, scores }
    })
  }

  const tripList = Object.values(state.trips)

  return (
    <div className="dt-root" style={{ minHeight: '100%', background: c.bg }}>
      <div className="dt-shell">
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            padding: 'calc(10px + env(safe-area-inset-top)) 16px 10px',
            background: 'linear-gradient(180deg,#06170F 70%,transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: c.cream }}>{trip.name}</div>
              <SyncStatus />
            </div>
            <div className="dt-cond" style={{ fontSize: 10, color: c.muted, letterSpacing: '.06em' }}>
              {BUILD_STAMP} · {trip.code}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="dt-btn"
              onClick={() => setStarterOpen(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: c.card,
                border: `1px solid ${c.line}`,
                color: c.gold,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MessageSquare size={18} />
            </button>
            <button
              className="dt-btn"
              onClick={() => setMenuOpen(true)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: c.card,
                border: `1px solid ${c.line}`,
                color: c.cream,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {tab === 'trip' ? <TripTab trip={trip} onRoundChange={handleRoundChange} onShowMovie={() => setMovieOpen(true)} /> : null}
        {tab === 'play' ? <PlayTab trip={trip} onScore={handleScore} /> : null}
        {tab === 'board' ? <BoardTab trip={trip} onPlayerClick={setProfilePlayer} /> : null}
        {tab === 'money' ? <MoneyTab trip={trip} /> : null}
        {tab === 'feed' ? (
          <FeedTab
            trip={trip}
            onPost={body => addFeedPost(body, trip.players[0]?.id || 'me', trip.players[0]?.nick || 'Organizer')}
            onReact={(postId, emoji) => reactToPost(postId, emoji, trip.players[0]?.id || 'me')}
          />
        ) : null}

        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {clubhouseOpen ? <ClubhousePanel onClose={() => setClubhouseOpen(false)} /> : null}
        {starterOpen ? <StarterChat trip={trip} onClose={() => setStarterOpen(false)} /> : null}
        {profilePlayer ? <PlayerProfile player={profilePlayer} trip={trip} onClose={() => setProfilePlayer(null)} /> : null}
        {movieOpen ? <HighlightReel trip={trip} onClose={() => setMovieOpen(false)} /> : null}
        {menuOpen ? (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.75)' }} onClick={() => setMenuOpen(false)}>
            <div
              className="dt-sheet"
              onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className="dt-cond" style={{ fontSize: 11, letterSpacing: '.12em', color: c.gold, textTransform: 'uppercase' }}>Trips</span>
                <button className="dt-btn" onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', color: c.cream }}>
                  <X size={20} />
                </button>
              </div>
              {tripList.map(t => (
                <button
                  key={t.id}
                  className="dt-btn"
                  onClick={() => {
                    setActiveTrip(t.id)
                    navigate(`/trip/${t.id}`)
                    setMenuOpen(false)
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: 14,
                    borderRadius: 12,
                    marginBottom: 8,
                    background: t.id === trip.id ? 'rgba(201,162,75,.12)' : c.card,
                    border: `1px solid ${c.line}`,
                    color: c.cream
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: c.muted }}>{t.code} · {t.location}</div>
                </button>
              ))}
              <button
                className="dt-btn"
                onClick={() => {
                  setMenuOpen(false)
                  setClubhouseOpen(true)
                }}
                style={{
                  width: '100%',
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 8,
                  background: c.card,
                  border: `1px solid ${c.line}`,
                  color: c.cream,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Trophy size={16} color={c.gold} />
                Order of Merit
              </button>
              <button
                className="dt-btn dt-btn-ghost"
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/plan')
                }}
                style={{ width: '100%', padding: 14, borderRadius: 12, marginTop: 8 }}
              >
                Create new trip
              </button>
              <button
                className="dt-btn"
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/')
                }}
                style={{ width: '100%', padding: 14, borderRadius: 12, marginTop: 8, background: 'transparent', color: c.muted }}
              >
                Back to welcome
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function resolveInitialRoute(): string {
  if (typeof window !== 'undefined' && window.__DT_START__ === 'plan') return '/plan'
  return '/'
}
