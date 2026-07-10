import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppState, BetEntry, Trip } from '@/types/trip'
import { findTripByCode, getMemberPlayer, getTrip, loadState, saveState, saveTrip, setMemberPlayer } from '@/localStore'
import {
  joinTripByCodeCloud,
  pullTripFromCloud,
  schedulePushTripToCloud,
  subscribeTrip
} from '@/cloudStore'
import { createDemoTrip } from '@/demo/createDemoTrip'
import { DEMO_SEEN_KEY, isDemoTrip } from '@/demo/constants'
import { applyJoinProfile, type JoinProfile } from '@/engine/joinProfile'
import { addPlayerToTrip } from '@/engine/tripFactory'
import { getSession } from '@/lib/auth'
import { notifyTripActivity } from '@/lib/push'
import { syncRoundFromTrip } from '@/engine/scoring'
import { switchActiveRound } from '@/engine/tripFactory'
import { fetchMeritStandings } from '@/lib/merit'
import { uid } from '@/styles'

export type { JoinProfile }

interface TripContextValue {
  state: AppState
  trip: Trip | null
  setActiveTrip: (tripId: string | null) => void
  upsertTrip: (trip: Trip) => void
  updateTrip: (updater: (trip: Trip) => Trip) => void
  joinByCode: (code: string) => Trip | null
  joinByCodeAsync: (code: string, profile?: JoinProfile) => Promise<Trip | null>
  getMyPlayerId: (tripId: string | null) => string | null
  setMyPlayerId: (tripId: string, playerId: string) => void
  addFeedPost: (body: string, authorId: string, authorNick: string) => void
  reactToPost: (postId: string, emoji: string, playerId: string) => void
  addSideBet: (bet: Omit<BetEntry, 'id' | 'ts'>) => void
  loadDemo: () => Trip
  refreshMerit: () => Promise<void>
}

const TripContext = createContext<TripContextValue | null>(null)

function resolvePlayerId(trip: Trip, profile?: JoinProfile): string | null {
  if (profile?.claimPlayerId) return profile.claimPlayerId
  if (profile?.addNew) {
    const nick = profile.nick?.trim()
    if (nick) {
      const match = trip.players.find(p => p.nick === nick)
      if (match) return match.id
    }
    return trip.players[trip.players.length - 1]?.id ?? null
  }
  const nick = profile?.nick?.trim()
  if (nick) {
    const match = trip.players.find(p => p.nick === nick)
    if (match) return match.id
  }
  return trip.players[0]?.id ?? null
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  const cloudMergeRef = useRef(false)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    fetchMeritStandings().then(rows => {
      if (rows.length) setState(prev => ({ ...prev, merit: rows }))
    })
  }, [])

  const trip = useMemo(() => getTrip(state, state.activeTripId), [state])

  useEffect(() => {
    const tripId = state.activeTripId
    if (!tripId) return
    const local = getTrip(state, tripId)
    if (isDemoTrip(local)) return
    let cancelled = false
    let unsubscribe: (() => void) | null = null

    pullTripFromCloud(tripId).then(cloud => {
      if (cancelled || !cloud || cloudMergeRef.current) return
      setState(prev => saveTrip(prev, cloud))
    })

    unsubscribe = subscribeTrip(tripId, cloudTrip => {
      if (cancelled) return
      cloudMergeRef.current = true
      setState(prev => saveTrip(prev, cloudTrip))
      setTimeout(() => {
        cloudMergeRef.current = false
      }, 1000)
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [state.activeTripId])

  const setActiveTrip = useCallback((tripId: string | null) => {
    setState(prev => ({ ...prev, activeTripId: tripId }))
  }, [])

  const setMyPlayerId = useCallback((tripId: string, playerId: string) => {
    setState(prev => setMemberPlayer(prev, tripId, playerId))
  }, [])

  const getMyPlayerId = useCallback((tripId: string | null) => getMemberPlayer(state, tripId), [state])

  const upsertTrip = useCallback((nextTrip: Trip) => {
    setState(prev => saveTrip(prev, nextTrip))
    schedulePushTripToCloud(nextTrip)
  }, [])

  const updateTrip = useCallback((updater: (trip: Trip) => Trip) => {
    setState(prev => {
      const current = getTrip(prev, prev.activeTripId)
      if (!current) return prev
      const synced = syncRoundFromTrip(updater(current))
      schedulePushTripToCloud(synced)
      return saveTrip(prev, synced)
    })
  }, [])

  const joinByCode = useCallback(
    (code: string) => {
      const found = findTripByCode(state, code)
      if (found) {
        setState(prev => ({ ...prev, activeTripId: found.id }))
        return found
      }
      return null
    },
    [state]
  )

  const joinByCodeAsync = useCallback(async (code: string, profile?: JoinProfile): Promise<Trip | null> => {
    const upper = code.trim().toUpperCase()
    if (!upper) return null

    const session = await getSession()
    if (session?.user?.id) {
      const cloudTrip = await joinTripByCodeCloud(upper, profile)
      if (cloudTrip) {
        const playerId = resolvePlayerId(cloudTrip, profile)
        setState(prev => {
          let next = saveTrip(prev, cloudTrip)
          if (playerId) next = setMemberPlayer(next, cloudTrip.id, playerId)
          return { ...next, activeTripId: cloudTrip.id }
        })
        return cloudTrip
      }
    }

    let found: Trip | null = findTripByCode(state, upper) ?? null
    if (!found) return null
    let merged = profile?.addNew
      ? addPlayerToTrip(found, profile.nick?.trim() || 'New Player', profile.hcp ?? 18)
      : applyJoinProfile(found, profile)
    const playerId = resolvePlayerId(merged, profile)
    setState(prev => {
      let next = saveTrip(prev, merged)
      if (playerId) next = setMemberPlayer(next, merged.id, playerId)
      return { ...next, activeTripId: merged.id }
    })
    schedulePushTripToCloud(merged)
    return merged
  }, [state])

  const addFeedPost = useCallback((body: string, authorId: string, authorNick: string) => {
    updateTrip(t => {
      const next = {
        ...t,
        feed: [{ id: uid('feed'), authorId, authorNick, body, ts: Date.now(), reactions: {} }, ...t.feed]
      }
      if (!isDemoTrip(t)) {
        getSession()
          .then(session => {
            notifyTripActivity({
              tripId: t.id,
              title: t.name,
              body: `${authorNick}: ${body.slice(0, 120)}`,
              url: `/trip/${t.id}`,
              excludeUserId: session?.user?.id
            }).catch(() => undefined)
          })
          .catch(() => undefined)
      }
      return next
    })
  }, [updateTrip])

  const reactToPost = useCallback((postId: string, emoji: string, playerId: string) => {
    updateTrip(t => ({
      ...t,
      feed: t.feed.map(p => {
        if (p.id !== postId) return p
        const list = p.reactions[emoji] || []
        const has = list.includes(playerId)
        const reactions = { ...p.reactions }
        reactions[emoji] = has ? list.filter(x => x !== playerId) : [...list, playerId]
        if (!reactions[emoji].length) delete reactions[emoji]
        return { ...p, reactions }
      })
    }))
  }, [updateTrip])

  const addSideBet = useCallback((bet: Omit<BetEntry, 'id' | 'ts'>) => {
    updateTrip(t => ({
      ...t,
      bets: [{ ...bet, id: uid('bet'), ts: Date.now(), settled: false }, ...t.bets]
    }))
  }, [updateTrip])

  const loadDemo = useCallback((): Trip => {
    const demo = createDemoTrip()
    if (typeof window !== 'undefined') localStorage.setItem(DEMO_SEEN_KEY, '1')
    setState(prev => {
      let next = saveTrip(prev, demo)
      next = setMemberPlayer(next, demo.id, demo.players[0].id)
      return next
    })
    return demo
  }, [])

  const refreshMerit = useCallback(async () => {
    const rows = await fetchMeritStandings()
    setState(prev => ({ ...prev, merit: rows }))
  }, [])

  const value = useMemo(
    () => ({
      state,
      trip,
      setActiveTrip,
      upsertTrip,
      updateTrip,
      joinByCode,
      joinByCodeAsync,
      getMyPlayerId,
      setMyPlayerId,
      addFeedPost,
      reactToPost,
      addSideBet,
      loadDemo,
      refreshMerit
    }),
    [state, trip, setActiveTrip, upsertTrip, updateTrip, joinByCode, joinByCodeAsync, getMyPlayerId, setMyPlayerId, addFeedPost, reactToPost, addSideBet, loadDemo, refreshMerit]
  )

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

export function useTripStore() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('TripProvider required')
  return ctx
}

export { switchActiveRound }
