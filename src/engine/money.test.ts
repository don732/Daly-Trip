import { describe, expect, it } from 'vitest'
import { computeSettlements, totalTripMoney, tripSkinsPot, TRIP_PRICE } from '@/engine/money'
import { createDemoTrip } from '@/demo/seedTrip'
import type { Trip } from '@/types/trip'

function withUniqueSkinWinner(trip: Trip): Trip {
  const scores = Object.fromEntries(
    trip.players.map((p, i) => {
      const row = Array(18).fill(5)
      row[0] = i === 0 ? 3 : 7
      return [p.id, row]
    })
  )
  const rounds = trip.rounds.map((r, i) => (i === 0 ? { ...r, scores } : { ...r, scores: Object.fromEntries(trip.players.map(p => [p.id, Array(18).fill(null)])) }))
  return { ...trip, scores, rounds }
}

describe('TRIP_PRICE', () => {
  it('is five dollars per head', () => {
    expect(TRIP_PRICE()).toBe(5)
  })
})

describe('computeSettlements', () => {
  it('produces settlement lines for demo skins', () => {
    const trip = withUniqueSkinWinner(createDemoTrip())
    const lines = computeSettlements(trip)
    expect(lines.length).toBeGreaterThan(0)
    lines.forEach(l => {
      expect(l.amount).toBeGreaterThan(0)
      expect(l.from).not.toBe(l.to)
    })
  })
})

describe('totalTripMoney', () => {
  it('balances to zero across players', () => {
    const trip = createDemoTrip()
    const totals = totalTripMoney(trip)
    const sum = Object.values(totals).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum)).toBeLessThan(0.01)
  })
})

describe('tripSkinsPot', () => {
  it('sums skins pot across all rounds', () => {
    const trip = withUniqueSkinWinner(createDemoTrip())
    expect(tripSkinsPot(trip)).toBeGreaterThan(0)
  })
})
