import { describe, expect, it } from 'vitest'
import { strokesOnHole, netScore, buildLeaderboard, computeSkins } from '@/engine/scoring'
import { createTestTrip, withUniqueSkinWinner } from '@/test/fixtures'

describe('strokesOnHole', () => {
  it('allocates extra strokes on lowest handicap holes', () => {
    expect(strokesOnHole(18, 1)).toBe(1)
    expect(strokesOnHole(18, 18)).toBe(1)
    expect(strokesOnHole(19, 1)).toBe(2)
    expect(strokesOnHole(19, 18)).toBe(1)
    expect(strokesOnHole(4, 1)).toBe(1)
    expect(strokesOnHole(4, 4)).toBe(1)
    expect(strokesOnHole(4, 5)).toBe(0)
    expect(strokesOnHole(4, 17)).toBe(0)
  })
})

describe('netScore', () => {
  it('subtracts handicap strokes from gross', () => {
    expect(netScore(5, 1)).toBe(4)
  })
})

describe('buildLeaderboard', () => {
  it('computes thru and to-par for scored trip', () => {
    const trip = createTestTrip({ playerCount: 8, fillScores: true })
    const rows = buildLeaderboard(trip)
    expect(rows.length).toBe(8)
    expect(rows.every(r => r.thru === 18)).toBe(true)
  })
})

describe('computeSkins', () => {
  it('returns pot and winners for scored holes', () => {
    const trip = withUniqueSkinWinner(createTestTrip())
    const skins = computeSkins(trip)
    expect(skins.pot).toBeGreaterThan(0)
    expect(Object.keys(skins.winners).length).toBeGreaterThan(0)
  })
})
