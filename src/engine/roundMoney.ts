import type { Course, EngineGame, Player, Trip } from '@/types/trip'
import { computeSkinsForRound } from '@/engine/scoring'

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
