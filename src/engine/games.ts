import type { GameStake, Round, RoundFormat, RoundSides, EngineGame } from '@/types/trip'
import { uid } from '@/styles'

export const FMT_MAP: Record<string, RoundFormat> = {
  fourball: 'bestball',
  bestball4: 'bestball'
}

export function normalizeFormat(format: string): RoundFormat {
  return (FMT_MAP[format] || format) as RoundFormat
}

export function DEFAULT_STAKE(): GameStake {
  return { on: false, amount: 0, per: 'player', basis: 'hole', carry: false, counts: 'best' }
}

export function DEFAULT_SIDES(): RoundSides {
  return {
    skins: { on: true, stake: 5, carry: true },
    snake: { on: false, stake: 1 },
    ctp: { on: false, stake: 5 },
    nassau: { on: false, stake: 10 },
    press: { on: false, stake: 5 }
  }
}

export function deriveGames(round: Round): EngineGame[] {
  const games: EngineGame[] = []
  if (round.gameStake.on && round.gameStake.amount > 0) {
    games.push({
      id: uid('game'),
      type: 'stake',
      label: `${round.gameStake.amount}/${round.gameStake.basis} game`,
      stake: round.gameStake.amount,
      carry: round.gameStake.carry,
      meta: { per: round.gameStake.per, basis: round.gameStake.basis, counts: round.gameStake.counts }
    })
  }
  if (round.sides.skins.on) {
    games.push({
      id: uid('game'),
      type: 'skins',
      label: 'Skins',
      stake: round.sides.skins.stake,
      carry: round.sides.skins.carry
    })
  }
  if (round.sides.snake.on) {
    games.push({ id: uid('game'), type: 'snake', label: 'Snake', stake: round.sides.snake.stake })
  }
  if (round.sides.ctp.on) {
    games.push({ id: uid('game'), type: 'junk', label: 'CTP', stake: round.sides.ctp.stake })
  }
  if (round.sides.nassau.on) {
    games.push({ id: uid('game'), type: 'nassau', label: 'Nassau', stake: round.sides.nassau.stake })
  }
  if (round.sides.press.on) {
    games.push({ id: uid('game'), type: 'press', label: 'Press', stake: round.sides.press.stake })
  }
  return games
}

export function emptyScores(playerIds: string[]): Record<string, (number | null)[]> {
  const scores: Record<string, (number | null)[]> = {}
  playerIds.forEach(id => {
    scores[id] = Array(18).fill(null)
  })
  return scores
}

export function emptyPutts(playerIds: string[]): Record<string, (number | null)[]> {
  const putts: Record<string, (number | null)[]> = {}
  playerIds.forEach(id => {
    putts[id] = Array(18).fill(null)
  })
  return putts
}
