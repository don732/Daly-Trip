import { describe, expect, it } from 'vitest'
import { applyJoinProfile } from '@/engine/joinProfile'
import { createTestTrip } from '@/test/fixtures'

describe('applyJoinProfile', () => {
  it('claims a slot and updates nick, hcp, and venmo', () => {
    const trip = createTestTrip({ playerCount: 4 })
    const target = trip.players[2]
    const next = applyJoinProfile(trip, {
      claimPlayerId: target.id,
      nick: 'Ace',
      hcp: 7,
      venmo: '@ace'
    })
    const updated = next.players.find(p => p.id === target.id)
    expect(updated?.nick).toBe('Ace')
    expect(updated?.hcp).toBe(7)
    expect(updated?.venmo).toBe('@ace')
  })

  it('falls back to first Player N or Organizer slot when no claim id', () => {
    const trip = createTestTrip({ playerCount: 3 })
    const next = applyJoinProfile(trip, { nick: 'Rookie', hcp: 22, venmo: '@rook' })
    expect(next.players[0].nick).toBe('Rookie')
    expect(next.players[0].hcp).toBe(22)
    expect(next.players[0].venmo).toBe('@rook')
  })

  it('no-ops when profile is empty', () => {
    const trip = createTestTrip()
    expect(applyJoinProfile(trip)).toBe(trip)
    expect(applyJoinProfile(trip, {})).toBe(trip)
  })
})
