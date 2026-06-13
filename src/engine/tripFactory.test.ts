import { describe, expect, it } from 'vitest'
import { makeTripFromForm, switchActiveRound, autoTeams } from '@/engine/tripFactory'
import { syncRoundFromTrip } from '@/engine/scoring'

describe('makeTripFromForm', () => {
  it('creates trip with rounds and join code', () => {
    const trip = makeTripFromForm({
      name: 'Test Trip',
      location: 'SC',
      start: '2026-01-01',
      end: '2026-01-03',
      players: [
        { nick: 'A', hcp: 10, team: 'pine' },
        { nick: 'B', hcp: 12, team: 'sand' }
      ],
      paid: true,
      mode: 'indiv',
      gameFormat: 'stroke',
      stake: 5,
      skins: true,
      rounds: [{ course: 'Course A', name: 'Round 1' }]
    })
    expect(trip.name).toBe('Test Trip')
    expect(trip.code.length).toBe(6)
    expect(trip.rounds.length).toBe(1)
    expect(trip.players.length).toBe(2)
  })
})

describe('autoTeams', () => {
  it('alternates by sorted handicap', () => {
    const teams = autoTeams([
      { id: 'a', name: 'A', nick: 'A', hcp: 20, team: 'pine' },
      { id: 'b', name: 'B', nick: 'B', hcp: 5, team: 'pine' }
    ])
    expect(teams.pine).toContain('b')
    expect(teams.sand).toContain('a')
  })
})

describe('switchActiveRound', () => {
  it('mirrors selected round to trip top level', () => {
    let trip = makeTripFromForm({
      name: 'Multi',
      location: '',
      start: '2026-01-01',
      end: '2026-01-02',
      players: [{ nick: 'A', hcp: 10, team: 'pine' }],
      paid: true,
      mode: 'indiv',
      gameFormat: 'stroke',
      stake: 0,
      skins: true,
      rounds: [
        { course: 'Course One', name: 'R1' },
        { course: 'Course Two', name: 'R2' }
      ]
    })
    trip = switchActiveRound(trip, 1)
    expect(trip.activeRoundIndex).toBe(1)
    expect(trip.course.name).toBe('Course Two')
  })
})

describe('syncRoundFromTrip', () => {
  it('persists top-level scores into active round', () => {
    let trip = makeTripFromForm({
      name: 'Sync',
      location: '',
      start: '2026-01-01',
      end: '2026-01-01',
      players: [{ nick: 'A', hcp: 10, team: 'pine' }],
      paid: true,
      mode: 'indiv',
      gameFormat: 'stroke',
      stake: 0,
      skins: false,
      rounds: [{ course: 'C', name: 'R1' }]
    })
    const pid = trip.players[0].id
    trip.scores[pid][0] = 4
    trip = syncRoundFromTrip(trip)
    expect(trip.rounds[0].scores[pid][0]).toBe(4)
  })
})
