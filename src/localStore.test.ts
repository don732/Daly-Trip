import { describe, expect, it, beforeEach, vi } from 'vitest'
import { createTestTrip } from '@/test/fixtures'
import { findTripByCode, getTrip, loadState, saveState, saveTrip, setMemberPlayer, getMemberPlayer, STORAGE_KEY } from '@/localStore'

describe('localStore', () => {
  beforeEach(() => {
    const store: Record<string, string> = {}
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        Object.keys(store).forEach(key => delete store[key])
      }
    })
  })

  it('findTripByCode matches case-insensitively', () => {
    const trip = createTestTrip()
    const state = saveTrip({ trips: {}, activeTripId: null, merit: [], memberPlayers: {} }, trip)
    expect(findTripByCode(state, trip.code.toLowerCase())).toEqual(trip)
    expect(findTripByCode(state, trip.code.toUpperCase())).toEqual(trip)
  })

  it('saveTrip and getTrip round-trip through state', () => {
    const trip = createTestTrip()
    const base = { trips: {}, activeTripId: null, merit: [], memberPlayers: {} }
    const next = saveTrip(base, trip)
    expect(getTrip(next, trip.id)).toEqual(trip)
    expect(next.activeTripId).toBe(trip.id)
  })

  it('persists state to localStorage', () => {
    const trip = createTestTrip()
    saveTrip({ trips: {}, activeTripId: null, merit: [], memberPlayers: {} }, trip)
    const loaded = loadState()
    expect(loaded.trips[trip.id]).toEqual(trip)
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()
  })

  it('saveState writes merit array', () => {
    const state = { trips: {}, activeTripId: null, merit: [{ nick: 'A', trips: 1, points: 10 }], memberPlayers: {} }
    saveState(state)
    expect(loadState().merit).toEqual(state.merit)
  })

  it('setMemberPlayer and getMemberPlayer round-trip', () => {
    const trip = createTestTrip()
    const base = { trips: {}, activeTripId: null, merit: [], memberPlayers: {} }
    const next = setMemberPlayer(base, trip.id, trip.players[0].id)
    expect(getMemberPlayer(next, trip.id)).toBe(trip.players[0].id)
  })
})
