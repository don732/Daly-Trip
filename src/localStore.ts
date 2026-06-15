import type { AppState, Trip } from '@/types/trip'

export const STORAGE_KEY = 'daly-trips:v1'

const emptyState = (): AppState => ({ trips: {}, activeTripId: null, merit: [] })

export function loadState(): AppState {
  if (typeof window === 'undefined') {
    return emptyState()
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as AppState
    return {
      trips: parsed.trips || {},
      activeTripId: parsed.activeTripId || null,
      merit: parsed.merit || []
    }
  } catch {
    return emptyState()
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function saveTrip(state: AppState, trip: Trip): AppState {
  const next = {
    ...state,
    trips: { ...state.trips, [trip.id]: trip },
    activeTripId: trip.id
  }
  saveState(next)
  return next
}

export function deleteTrip(state: AppState, tripId: string): AppState {
  const trips = { ...state.trips }
  delete trips[tripId]
  const next = {
    ...state,
    trips,
    activeTripId: state.activeTripId === tripId ? null : state.activeTripId
  }
  saveState(next)
  return next
}

export function getTrip(state: AppState, tripId: string | null): Trip | null {
  if (!tripId) return null
  return state.trips[tripId] || null
}

export function findTripByCode(state: AppState, code: string): Trip | null {
  const upper = code.trim().toUpperCase()
  return Object.values(state.trips).find(t => t.code.toUpperCase() === upper) || null
}
