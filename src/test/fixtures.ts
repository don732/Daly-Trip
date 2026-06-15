import { makeTripFromForm } from '@/engine/tripFactory'
import type { TeamKey, Trip } from '@/types/trip'

export function createTestTrip(opts?: { playerCount?: number; fillScores?: boolean }): Trip {
  const n = opts?.playerCount ?? 2
  const players = Array.from({ length: n }, (_, i) => ({
    nick: i === 0 ? 'Organizer' : `Player ${i + 1}`,
    hcp: 10 + i,
    team: (i % 2 === 0 ? 'pine' : 'sand') as TeamKey
  }))
  let trip = makeTripFromForm({
    name: 'Test Trip',
    location: 'Test',
    start: '2026-01-01',
    end: '2026-01-02',
    players,
    paid: true,
    mode: 'indiv',
    gameFormat: 'stroke',
    stake: 5,
    skins: true,
    skinsStake: 5,
    rounds: [{ course: 'Test Course', name: 'Round 1' }]
  })
  if (!opts?.fillScores) return trip
  const scores = Object.fromEntries(
    trip.players.map((p, pi) => [p.id, Array.from({ length: 18 }, (_, hi) => 4 + ((pi + hi) % 2))])
  )
  return {
    ...trip,
    scores,
    rounds: trip.rounds.map((r, i) => (i === 0 ? { ...r, scores } : r))
  }
}

export function withUniqueSkinWinner(trip: Trip): Trip {
  const scores = Object.fromEntries(
    trip.players.map((p, i) => {
      const row = Array<number | null>(18).fill(null)
      row[0] = i === 0 ? 3 : 7
      return [p.id, row]
    })
  )
  const rounds = trip.rounds.map((r, i) =>
    i === 0
      ? { ...r, scores }
      : { ...r, scores: Object.fromEntries(trip.players.map(p => [p.id, Array<number | null>(18).fill(null)])) }
  )
  return { ...trip, scores, rounds }
}
