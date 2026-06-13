import { describe, expect, it } from 'vitest'
import { computeSettlements, totalTripMoney, tripSkinsPot, TRIP_PRICE } from '@/engine/money'
import { createDemoTrip } from '@/demo/seedTrip'

describe('TRIP_PRICE', () => {
  it('is five dollars per head', () => {
    expect(TRIP_PRICE()).toBe(5)
  })
})

describe('computeSettlements', () => {
  it('produces settlement lines for demo skins', () => {
    const trip = createDemoTrip()
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
    const trip = createDemoTrip()
    expect(tripSkinsPot(trip)).toBeGreaterThan(0)
  })
})
