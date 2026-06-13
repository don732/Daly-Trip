import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppState, BetEntry, Trip } from '@/types/trip'
import { createDemoTrip, DEMO_TRIP_CODE, DEMO_TRIP_ID } from '@/demo/seedTrip'
import { findTripByCode, getTrip, loadState, saveState, saveTrip } from '@/localStore'
import { findTripByCodeCloud, pullTripFromCloud, schedulePushTripToCloud, subscribeTrip } from '@/cloudStore'
import { syncRoundFromTrip } from '@/engine/scoring'
import { switchActiveRound } from '@/engine/tripFactory'
import { uid } from '@/styles'

interface TripContextValue {
  state: AppState
  trip: Trip | null
  setActiveTrip: (tripId: string | null) => void
  upsertTrip: (trip: Trip) => void
  updateTrip: (updater: (trip: Trip) => Trip) => void
  loadDemo: () => Trip
  joinByCode: (code: string) => Trip | null
  joinByCodeAsync: (code: string) => Promise<Trip | null>
  addFeedPost: (body: string, authorId: string, authorNick: string) => void
  reactToPost: (postId: string, emoji: string, playerId: string) => void
  addSideBet: (bet: Omit<BetEntry, 'id' | 'ts'>) => void
}

const TripContext = createContext<TripContextValue | null>(null)

export function TripProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  const cloudMergeRef = useRef(false)

  useEffect(() => {
    saveState(state)
  }, [state])

  const trip = useMemo(() => getTrip(state, state.activeTripId), [state])

  useEffect(() => {
    const tripId = state.activeTripId
    if (!tripId) return
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

  const loadDemo = useCallback(() => {
    let result: Trip | null = null
    setState(prev => {
      const existing = prev.trips[DEMO_TRIP_ID]
      if (existing) {
        result = existing
        return { ...prev, activeTripId: DEMO_TRIP_ID }
      }
      const demo = createDemoTrip()
      result = demo
      return saveTrip(prev, demo)
    })
    if (result) schedulePushTripToCloud(result)
    return result!
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

  const joinByCodeAsync = useCallback(async (code: string): Promise<Trip | null> => {
    const upper = code.trim().toUpperCase()
    if (!upper) return null
    const cloud = await findTripByCodeCloud(upper)
    if (cloud) {
      setState(prev => saveTrip(prev, cloud))
      return cloud
    }
    const local = findTripByCode(state, upper)
    if (local) {
      setState(prev => ({ ...prev, activeTripId: local.id }))
      return local
    }
    if (upper === DEMO_TRIP_CODE) {
      return loadDemo()
    }
    return null
  }, [state, loadDemo])

  const addFeedPost = useCallback((body: string, authorId: string, authorNick: string) => {
    updateTrip(t => ({
      ...t,
      feed: [{ id: uid('feed'), authorId, authorNick, body, ts: Date.now(), reactions: {} }, ...t.feed]
    }))
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

  const value = useMemo(
    () => ({
      state,
      trip,
      setActiveTrip,
      upsertTrip,
      updateTrip,
      loadDemo,
      joinByCode,
      joinByCodeAsync,
      addFeedPost,
      reactToPost,
      addSideBet
    }),
    [state, trip, setActiveTrip, upsertTrip, updateTrip, loadDemo, joinByCode, joinByCodeAsync, addFeedPost, reactToPost, addSideBet]
  )

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

export function useTripStore() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('TripProvider required')
  return ctx
}

export { switchActiveRound }
