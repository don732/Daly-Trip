import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppState, FeedPost, Trip } from '@/types/trip'
import { createDemoTrip } from '@/demo/seedTrip'
import { findTripByCode, getTrip, loadState, saveState, saveTrip } from '@/localStore'
import { pushTripToCloud } from '@/cloudStore'
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
  addFeedPost: (body: string, authorId: string, authorNick: string) => void
  reactToPost: (postId: string, emoji: string, playerId: string) => void
}

const TripContext = createContext<TripContextValue | null>(null)

export function TripProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const trip = useMemo(() => getTrip(state, state.activeTripId), [state])

  const setActiveTrip = useCallback((tripId: string | null) => {
    setState(prev => ({ ...prev, activeTripId: tripId }))
  }, [])

  const upsertTrip = useCallback((nextTrip: Trip) => {
    setState(prev => saveTrip(prev, nextTrip))
    pushTripToCloud(nextTrip).catch(() => undefined)
  }, [])

  const updateTrip = useCallback((updater: (trip: Trip) => Trip) => {
    setState(prev => {
      const current = getTrip(prev, prev.activeTripId)
      if (!current) return prev
      const synced = syncRoundFromTrip(updater(current))
      return saveTrip(prev, synced)
    })
  }, [])

  const loadDemo = useCallback(() => {
    const demo = createDemoTrip()
    setState(prev => saveTrip(prev, demo))
    return demo
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

  const value = useMemo(
    () => ({
      state,
      trip,
      setActiveTrip,
      upsertTrip,
      updateTrip,
      loadDemo,
      joinByCode,
      addFeedPost,
      reactToPost
    }),
    [state, trip, setActiveTrip, upsertTrip, updateTrip, loadDemo, joinByCode, addFeedPost, reactToPost]
  )

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

export function useTripStore() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('TripProvider required')
  return ctx
}

export { switchActiveRound }
