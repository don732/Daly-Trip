import type { LeaderRow, Trip } from '@/types/trip'
import { computeSkins } from '@/engine/scoring'
import { formatScore } from '@/styles'

const STARTER_API = import.meta.env.VITE_STARTER_API_URL as string | undefined

const ROAST_LINES = [
  'That swing had more moving parts than a PGA Tour rules decision.',
  'Your handicap is a suggestion. Your ego wrote it.',
  'The committee reviewed the tape. We are still reviewing.',
  'If sand saves were currency, you would be broke.',
  'You putt like the hole owes you money.'
]

async function callStarterApi(input: {
  history: Array<{ role: string; content: string }>
  context?: string
}): Promise<string | null> {
  if (!STARTER_API) return null
  try {
    const res = await fetch(STARTER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    if (!res.ok) return null
    const data = (await res.json()) as { reply?: string; message?: string }
    return data.reply || data.message || null
  } catch {
    return null
  }
}

function keywordReply(last: string): string | null {
  if (/roast/.test(last)) {
    return `${ROAST_LINES[Math.floor(Math.random() * ROAST_LINES.length)]} — The Starter on Daly Trips ⛳`
  }
  if (/win|lead|first|board/.test(last)) {
    return 'Net leaders are shifting every hole. Gross is a different movie entirely. Dr. Sandbag\'s card remains under review. — The Starter'
  }
  if (/team|pair|fair/.test(last)) {
    return 'Fairest teams by handicap: Pine stacks low numbers. Sand brings the firepower. Classic Ryder setup. — The Starter'
  }
  if (/settle|money|venmo|pay/.test(last)) {
    return 'The ledger is sacred. Settle like adults — or let Venmo be the witness. — The Starter'
  }
  return null
}

export async function askStarter(input: {
  history: Array<{ role: string; content: string }>
  context?: string
}): Promise<string | null> {
  const api = await callStarterApi(input)
  if (api) return api
  const last = input.history[input.history.length - 1]?.content.toLowerCase() || ''
  return keywordReply(last)
}

export function generateRoast(playerNick: string, trip?: Trip): string {
  const line = ROAST_LINES[Math.floor(Math.random() * ROAST_LINES.length)]
  const tripBit = trip?.name ? ` at ${trip.name}` : ''
  return `${playerNick}${tripBit}: ${line} — The Starter 🔥`
}

export function generateSettleFeedPost(trip: Trip, lines: Array<{ from: string; to: string; amount: number }>): string {
  const nick = (id: string) => trip.players.find(p => p.id === id)?.nick || id
  if (!lines.length) return 'All square on the money. For now. — The Starter'
  const top = lines.slice(0, 3).map(l => `${nick(l.from)} → ${nick(l.to)} $${l.amount}`).join(' · ')
  const more = lines.length > 3 ? ` (+${lines.length - 3} more)` : ''
  return `Settle up${trip.name ? ` · ${trip.name}` : ''}: ${top}${more}. Pay your debts like champions. — The Starter 💸`
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
