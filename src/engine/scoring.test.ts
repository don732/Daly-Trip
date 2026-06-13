import { describe, expect, it } from 'vitest'
import { strokesOnHole, netScore, buildLeaderboard, computeSkins } from '@/engine/scoring'
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
  const rounds = trip.rounds.map((r, i) => (i === 0 ? { ...r, scores } : r))
  return { ...trip, scores, rounds }
}

describe('strokesOnHole', () => {
  it('allocates extra strokes on lowest handicap holes', () => {
    expect(strokesOnHole(18, 1)).toBe(1)
    expect(strokesOnHole(18, 18)).toBe(1)
    expect(strokesOnHole(19, 1)).toBe(2)
    expect(strokesOnHole(19, 18)).toBe(1)
    expect(strokesOnHole(4, 10)).toBe(1)
    expect(strokesOnHole(4, 17)).toBe(0)
  })
})

describe('netScore', () => {
  it('subtracts handicap strokes from gross', () => {
    expect(netScore(5, 1)).toBe(4)
  })
})

describe('buildLeaderboard', () => {
  it('computes thru and to-par for demo trip', () => {
    const trip = createDemoTrip()
    const rows = buildLeaderboard(trip)
    expect(rows.length).toBe(8)
    expect(rows.every(r => r.thru === 18)).toBe(true)
  })
})

describe('computeSkins', () => {
  it('returns pot and winners for scored holes', () => {
    const trip = withUniqueSkinWinner(createDemoTrip())
    const skins = computeSkins(trip)
    expect(skins.pot).toBeGreaterThan(0)
    expect(Object.keys(skins.winners).length).toBeGreaterThan(0)
  })
})
