import type { Hole, LeaderRow, Player, Round, RoundFormat, SkinsState, Trip } from '@/types/trip'
import { normalizeFormat } from '@/engine/games'

export function strokesOnHole(hcp: number, holeHcp: number): number {
  const base = Math.floor(hcp / 18)
  const extra = hcp % 18
  return base + (holeHcp <= extra ? 1 : 0)
}

export function netScore(gross: number, strokes: number): number {
  return gross - strokes
}

function playedHoles(scores: (number | null)[]): number {
  return scores.filter(s => s != null).length
}

export function buildLeaderboard(trip: Trip): LeaderRow[] {
  const par = trip.course.holes.map(h => h.par)
  return trip.players.map(p => {
    const scores = trip.scores[p.id] || Array(18).fill(null)
    const thru = playedHoles(scores)
    let grossTotal = 0
    let netTotal = 0
    let parPlayed = 0
    scores.forEach((s, i) => {
      if (s == null) return
      grossTotal += s
      parPlayed += par[i]
      netTotal += netScore(s, strokesOnHole(p.hcp, trip.course.holes[i].hcp))
    })
    const toPar = thru ? grossTotal - parPlayed : 0
    const toParNet = thru ? netTotal - parPlayed : 0
    return {
      id: p.id,
      nick: p.nick,
      team: p.team,
      hcp: p.hcp,
      gross: grossTotal,
      net: netTotal,
      toPar,
      toParNet,
      thru
    }
  })
}

export function computeSkins(trip: Trip): SkinsState {
  const skinsGame = trip.games.find(g => g.type === 'skins')
  const stake = skinsGame?.stake || 5
  const winners: Record<number, string | null> = {}
  let carry = 0
  let pot = 0
  for (let h = 0; h < 18; h += 1) {
    const hole = trip.course.holes[h]
    let bestNet: number | null = null
    let bestIds: string[] = []
    trip.players.forEach(p => {
      const gross = trip.scores[p.id]?.[h]
      if (gross == null) return
      const n = netScore(gross, strokesOnHole(p.hcp, hole.hcp))
      if (bestNet == null || n < bestNet) {
        bestNet = n
        bestIds = [p.id]
      } else if (n === bestNet) {
        bestIds.push(p.id)
      }
    })
    if (bestNet == null) continue
    if (bestIds.length === 1) {
      winners[h] = bestIds[0]
      pot += stake * (1 + carry)
      carry = 0
    } else {
      winners[h] = null
      carry += 1
    }
  }
  return { pot, carry, winners }
}

const BEST_BALL_FORMATS: RoundFormat[] = ['bestball', 'fourball', 'shamble', 'chapman']

export function isBestBallFormat(format: RoundFormat): boolean {
  return BEST_BALL_FORMATS.includes(normalizeFormat(format))
}

export function isOneBallFormat(format: RoundFormat): boolean {
  return ['scramble', 'alternate'].includes(normalizeFormat(format))
}

export function teamHoleNet(
  playerIds: string[],
  players: Player[],
  scores: Record<string, (number | null)[]>,
  hole: Hole,
  format: RoundFormat
): number | null {
  const formatKey = normalizeFormat(format)
  const vals: number[] = []
  playerIds.forEach(id => {
    const p = players.find(x => x.id === id)
    const gross = scores[id]?.[hole.n - 1]
    if (!p || gross == null) return
    vals.push(netScore(gross, strokesOnHole(p.hcp, hole.hcp)))
  })
  if (!vals.length) return null
  if (isBestBallFormat(formatKey)) return Math.min(...vals)
  if (isOneBallFormat(formatKey)) return vals[0]
  return vals.reduce((a, b) => a + b, 0)
}

export function computeTeamBoard(trip: Trip, round?: Round) {
  const r = round || trip.rounds[trip.activeRoundIndex]
  const format = r?.format || 'stroke'
  const teamIds = {
    pine: r?.teams.pine.ids.length ? r.teams.pine.ids : trip.teams.pine.ids,
    sand: r?.teams.sand.ids.length ? r.teams.sand.ids : trip.teams.sand.ids
  }
  const totals = { pine: 0, sand: 0 }
  trip.course.holes.forEach(hole => {
    const pine = teamHoleNet(teamIds.pine, trip.players, trip.scores, hole, format)
    const sand = teamHoleNet(teamIds.sand, trip.players, trip.scores, hole, format)
    if (pine == null || sand == null) return
    if (isBestBallFormat(format)) {
      totals.pine += pine
      totals.sand += sand
    } else {
      totals.pine += pine - hole.par
      totals.sand += sand - hole.par
    }
  })
  return totals
}

export function mirrorActiveRound(trip: Trip): Trip {
  const idx = trip.activeRoundIndex
  const round = trip.rounds[idx]
  if (!round) return trip
  return {
    ...trip,
    course: round.course,
    games: round.games,
    scores: round.scores,
    putts: round.putts
  }
}

export function syncRoundFromTrip(trip: Trip): Trip {
  const idx = trip.activeRoundIndex
  const rounds = [...trip.rounds]
  const round = rounds[idx]
  if (!round) return trip
  rounds[idx] = {
    ...round,
    course: trip.course,
    games: trip.games,
    scores: trip.scores,
    putts: trip.putts
  }
  return { ...trip, rounds }
}
