import { describe, expect, it } from 'vitest'
import { normalizeFormat, DEFAULT_SIDES } from '@/engine/games'
import { makeRound } from '@/engine/tripFactory'

describe('normalizeFormat', () => {
  it('maps fourball to bestball', () => {
    expect(normalizeFormat('fourball')).toBe('bestball')
  })
})

describe('deriveGames', () => {
  it('includes skins when enabled', () => {
    const round = makeRound({
      name: 'R1',
      courseName: 'Test',
      mode: 'indiv',
      format: 'stroke',
      playerIds: ['a', 'b'],
      stake: 0,
      skins: true,
      teamIds: { pine: ['a'], sand: ['b'] }
    })
    const types = round.games.map(g => g.type)
    expect(types).toContain('skins')
  })

  it('includes stake game when amount set', () => {
    const round = makeRound({
      name: 'R1',
      courseName: 'Test',
      mode: 'indiv',
      format: 'stroke',
      playerIds: ['a', 'b'],
      stake: 10,
      skins: false,
      teamIds: { pine: ['a'], sand: ['b'] }
    })
    expect(round.games.some(g => g.type === 'stake')).toBe(true)
  })
})

describe('DEFAULT_SIDES', () => {
  it('enables skins by default', () => {
    expect(DEFAULT_SIDES().skins.on).toBe(true)
  })
})
