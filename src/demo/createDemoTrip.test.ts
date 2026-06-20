import { describe, expect, it } from 'vitest'
import { createDemoTrip } from '@/demo/createDemoTrip'
import { DEMO_TRIP_ID, isDemoTrip } from '@/demo/constants'

describe('createDemoTrip', () => {
  it('creates a seeded demo trip with prototype roster', () => {
    const trip = createDemoTrip()
    expect(trip.id).toBe(DEMO_TRIP_ID)
    expect(trip.seed).toBe(true)
    expect(trip.code).toBe('DEMO26')
    expect(trip.players.length).toBe(8)
    expect(trip.players[0].nick).toBe('The Mortician')
    expect(isDemoTrip(trip)).toBe(true)
  })

  it('includes partial scores and feed posts', () => {
    const trip = createDemoTrip()
    const thru = trip.scores[trip.players[0].id]?.filter(s => s != null).length ?? 0
    expect(thru).toBeGreaterThan(0)
    expect(trip.feed.length).toBeGreaterThan(0)
  })
})
