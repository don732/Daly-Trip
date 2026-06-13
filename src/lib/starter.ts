import type { LeaderRow, Trip } from '@/types/trip'
import { computeSkins } from '@/engine/scoring'
import { formatScore } from '@/styles'

export async function askStarter(input: {
  history: Array<{ role: string; content: string }>
  context?: string
}): Promise<string | null> {
  const last = input.history[input.history.length - 1]?.content.toLowerCase() || ''
  if (/roast/.test(last)) {
    return 'The committee has reviewed the tape. That swing had more moving parts than a PGA Tour rules decision. — The Starter on Daly Trips ⛳'
  }
  if (/win|lead|first|board/.test(last)) {
    return 'Net leaders are shifting every hole. Gross is a different movie entirely. Dr. Sandbag\'s card remains under review. — The Starter'
  }
  if (/team|pair|fair/.test(last)) {
    return 'Fairest teams by handicap: Pine stacks low numbers. Sand brings the firepower. Classic Ryder setup. — The Starter'
  }
  return null
}

export function starterDailyDrop(trip: Trip, leaders: LeaderRow[]): string {
  const skins = computeSkins(trip)
  const top = [...leaders].sort((a, b) => a.toParNet - b.toParNet)[0]
  if (!top || !top.thru) {
    return 'The Starter is on the first tee. Cards are clean. Wagers are live. Let\'s go.'
  }
  return `${top.nick} leads net at ${formatScore(top.toParNet)} through ${top.thru}. Skins pot at $${skins.pot}${skins.carry ? ` with ${skins.carry} carrying` : ''}.`
}

export function starterRecap(trip: Trip, leaders: LeaderRow[]): string {
  const top = [...leaders].sort((a, b) => a.toParNet - b.toParNet).slice(0, 3)
  const lines = top.map((l, i) => `${i + 1}. ${l.nick} (${formatScore(l.toParNet)} net)`).join(' · ')
  return `${trip.name}: ${lines || 'No scores yet'}. The board is live.`
}
