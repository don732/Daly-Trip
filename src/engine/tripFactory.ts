import type { Player, Round, TeamKey, Trip, TripFormInput } from '@/types/trip'
import { uid, tripCode } from '@/styles'
import { BLACK_CYPRESS, makePlayer } from '@/engine/courses'
import { DEFAULT_SIDES, DEFAULT_STAKE, deriveGames, emptyPutts, emptyScores, normalizeFormat } from '@/engine/games'
import { syncRoundFromTrip } from '@/engine/scoring'

export function autoTeams(players: Player[]): { pine: string[]; sand: string[] } {
  const sorted = [...players].sort((a, b) => a.hcp - b.hcp)
  const pine: string[] = []
  const sand: string[] = []
  sorted.forEach((p, i) => {
    if (i % 2 === 0) pine.push(p.id)
    else sand.push(p.id)
  })
  return { pine, sand }
}

export function makeRound(input: {
  name: string
  courseName: string
  mode: Trip['rounds'][0]['mode']
  format: Trip['rounds'][0]['format']
  playerIds: string[]
  stake: number
  skins: boolean
  skinsStake?: number
  teamIds: { pine: string[]; sand: string[] }
}): Round {
  const sides = DEFAULT_SIDES()
  if (input.skins) {
    sides.skins.on = true
    sides.skins.stake = input.skinsStake ?? 5
  }
  const gameStake = DEFAULT_STAKE()
  if (input.stake > 0) {
    gameStake.on = true
    gameStake.amount = input.stake
  }
  const round: Round = {
    id: uid('round'),
    name: input.name,
    date: new Date().toISOString().slice(0, 10),
    tee: 'Blue',
    course: { ...BLACK_CYPRESS, name: input.courseName || BLACK_CYPRESS.name },
    mode: input.mode,
    size: input.mode === 'teams' ? 2 : null,
    format: normalizeFormat(input.format),
    gameStake,
    sides,
    teams: { pine: { ids: input.teamIds.pine }, sand: { ids: input.teamIds.sand } },
    scores: emptyScores(input.playerIds),
    putts: emptyPutts(input.playerIds),
    games: []
  }
  round.games = deriveGames(round)
  return round
}

export function makeTripFromForm(form: TripFormInput): Trip {
  const players = form.players.map((p, i) =>
    makePlayer({
      nick: p.nick || `Player ${i + 1}`,
      name: p.nick || `Player ${i + 1}`,
      hcp: p.hcp,
      team: p.team,
      venmo: p.venmo
    })
  )
  const teamIds = autoTeams(players)
  players.forEach(p => {
    if (teamIds.pine.includes(p.id)) p.team = 'pine'
    else p.team = 'sand'
  })
  const playerIds = players.map(p => p.id)
  const rounds = form.rounds.map((r, i) =>
    makeRound({
      name: r.name || `Round ${i + 1}`,
      courseName: r.course,
      mode: form.mode,
      format: form.gameFormat,
      playerIds,
      stake: form.stake,
      skins: form.skins,
      skinsStake: form.skinsStake,
      teamIds
    })
  )
  const first = rounds[0]
  const trip: Trip = {
    id: uid('trip'),
    code: tripCode(),
    name: form.name || 'Untitled Trip',
    location: form.location || '',
    start: form.start || new Date().toISOString().slice(0, 10),
    end: form.end || form.start || new Date().toISOString().slice(0, 10),
    seed: false,
    paid: form.paid,
    price: 5,
    players,
    teams: {
      pine: { name: 'Pine', color: '#2A6B4A', ids: teamIds.pine },
      sand: { name: 'Sand', color: '#C4A882', ids: teamIds.sand }
    },
    sameTeams: true,
    rounds,
    course: first.course,
    games: first.games,
    scores: first.scores,
    putts: first.putts,
    feed: [],
    bets: [],
    activeRoundIndex: 0
  }
  return trip
}

export function addPlayerToTrip(trip: Trip, nick: string, hcp: number, team?: TeamKey): Trip {
  const slot: TeamKey = team || (trip.teams.pine.ids.length <= trip.teams.sand.ids.length ? 'pine' : 'sand')
  const player = makePlayer({ nick, hcp, team: slot })
  const scores = { ...trip.scores, [player.id]: Array(18).fill(null) }
  const putts = { ...trip.putts, [player.id]: Array(18).fill(null) }
  const teams = {
    pine: { ...trip.teams.pine, ids: slot === 'pine' ? [...trip.teams.pine.ids, player.id] : trip.teams.pine.ids },
    sand: { ...trip.teams.sand, ids: slot === 'sand' ? [...trip.teams.sand.ids, player.id] : trip.teams.sand.ids }
  }
  const rounds = trip.rounds.map(r => ({
    ...r,
    scores: { ...r.scores, [player.id]: Array(18).fill(null) },
    putts: { ...r.putts, [player.id]: Array(18).fill(null) },
    teams: {
      pine: { ids: slot === 'pine' ? [...r.teams.pine.ids, player.id] : r.teams.pine.ids },
      sand: { ids: slot === 'sand' ? [...r.teams.sand.ids, player.id] : r.teams.sand.ids }
    }
  }))
  return {
    ...trip,
    players: [...trip.players, player],
    teams,
    scores,
    putts,
    rounds
  }
}

export function switchActiveRound(trip: Trip, index: number): Trip {
  const synced = syncRoundFromTrip(trip)
  const next = { ...synced, activeRoundIndex: index }
  const round = next.rounds[index]
  if (!round) return next
  return {
    ...next,
    course: round.course,
    games: round.games,
    scores: round.scores,
    putts: round.putts
  }
}
