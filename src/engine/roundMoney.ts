import type { Course, EngineGame, Player, Trip } from '@/types/trip'
import { computeSkinsForRound, netScore, strokesOnHole } from '@/engine/scoring'

export function applySkinsBalances(
  balances: Record<string, number>,
  players: Player[],
  games: EngineGame[],
  skins: ReturnType<typeof computeSkinsForRound>
): void {
  const stake = games.find(g => g.type === 'skins')?.stake || 5
  Object.values(skins.winners).forEach(winnerId => {
    if (!winnerId) return
    players.forEach(p => {
      if (p.id === winnerId) balances[p.id] += stake * (players.length - 1)
      else balances[p.id] -= stake
    })
  })
}

function netToParThrough(
  players: Player[],
  course: Course,
  scores: Record<string, (number | null)[]>,
  fromHole: number,
  toHole: number
): Record<string, number | null> {
  const totals: Record<string, number | null> = {}
  players.forEach(p => {
    let netTotal = 0
    let parPlayed = 0
    let played = 0
    for (let h = fromHole; h < toHole; h += 1) {
      const gross = scores[p.id]?.[h]
      if (gross == null) continue
      const hole = course.holes[h]
      if (!hole) continue
      played += 1
      parPlayed += hole.par
      netTotal += netScore(gross, strokesOnHole(p.hcp, hole.hcp))
    }
    totals[p.id] = played > 0 ? netTotal - parPlayed : null
  })
  return totals
}

function applySegmentNassau(
  balances: Record<string, number>,
  players: Player[],
  stake: number,
  nets: Record<string, number | null>
): void {
  const ranked = players
    .map(p => ({ id: p.id, net: nets[p.id] }))
    .filter(x => x.net != null) as Array<{ id: string; net: number }>
  if (ranked.length < 2) return
  ranked.sort((a, b) => a.net - b.net)
  const winnerId = ranked[0].id
  const tied = ranked.filter(x => x.net === ranked[0].net)
  if (tied.length > 1) return
  players.forEach(p => {
    if (p.id === winnerId) balances[p.id] += stake * (players.length - 1)
    else balances[p.id] -= stake
  })
}

export function applyNassauBalances(
  balances: Record<string, number>,
  players: Player[],
  games: EngineGame[],
  course: Course,
  scores: Record<string, (number | null)[]>
): void {
  const nassau = games.find(g => g.type === 'nassau')
  if (!nassau?.stake) return
  const stake = nassau.stake
  const front = netToParThrough(players, course, scores, 0, 9)
  const back = netToParThrough(players, course, scores, 9, 18)
  const overall = netToParThrough(players, course, scores, 0, 18)
  applySegmentNassau(balances, players, stake, front)
  applySegmentNassau(balances, players, stake, back)
  applySegmentNassau(balances, players, stake, overall)
}

export function allRoundContexts(trip: Trip): Array<{
  course: Course
  games: EngineGame[]
  scores: Record<string, (number | null)[]>
}> {
  return trip.rounds.map(r => ({
    course: r.course,
    games: r.games,
    scores: r.scores
  }))
}
