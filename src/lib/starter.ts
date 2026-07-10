import type { LeaderRow, Player, Trip } from '@/types/trip'
import { buildLeaderboard, computeSkins } from '@/engine/scoring'
import { formatScore } from '@/styles'

const STARTER_OVERRIDE = import.meta.env.VITE_STARTER_API_URL as string | undefined

const ROAST_LINES = [
  'That swing had more moving parts than a PGA Tour rules decision.',
  'Your handicap is a suggestion. Your ego wrote it.',
  'The committee reviewed the tape. We are still reviewing.',
  'If sand saves were currency, you would be broke.',
  'You putt like the hole owes you money.'
]

function formatToPar(n: number): string {
  if (n > 0) return `+${n}`
  if (n === 0) return 'E'
  return String(n)
}

export function buildTripContext(trip: Trip, leaders?: LeaderRow[]): string {
  const board = leaders || buildLeaderboard(trip)
  const top = [...board].sort((a, b) => a.toParNet - b.toParNet).slice(0, 6)
  const leaderLines = top
    .map((l, i) => `${i + 1}. ${l.nick} net ${formatToPar(l.toParNet)} / gross ${formatToPar(l.toPar)}`)
    .join('; ')
  const roster = trip.players.map(p => `${p.nick} (hcp ${p.hcp})`).join(', ')
  const skins = computeSkins(trip)
  return `Trip: ${trip.name}${trip.location ? ` at ${trip.location}` : ''}. Players: ${roster}. Net leaderboard: ${leaderLines || 'no scores yet'}. Skins pot $${skins.pot}${skins.carry ? `, ${skins.carry} hole(s) carrying` : ''}.`
}

function keywordReply(last: string, trip?: Trip, leaders?: LeaderRow[]): string | null {
  const board = leaders || (trip ? buildLeaderboard(trip) : [])
  const netLead = [...board].sort((a, b) => a.toParNet - b.toParNet)[0]
  const grossLead = [...board].sort((a, b) => a.toPar - b.toPar)[0]

  if (/roast/.test(last)) {
    return `${ROAST_LINES[Math.floor(Math.random() * ROAST_LINES.length)]} — The Starter on Daly Trips ⛳`
  }
  if (/win|lead|first|board/.test(last) && netLead) {
    return `${netLead.nick} leads net at ${formatToPar(netLead.toParNet)}. ${grossLead?.nick || 'Someone'} is your gross leader. Dr. Sandbag's "net" lead remains under formal review. — The Starter`
  }
  if (/team|pair|fair/.test(last) && trip) {
    const pine = trip.players.filter(p => p.team === 'pine').map(p => `${p.nick} (${p.hcp})`).join(' + ')
    const sand = trip.players.filter(p => p.team === 'sand').map(p => `${p.nick} (${p.hcp})`).join(' + ')
    return `Fairest teams by handicap: Pine — ${pine || 'TBD'}. Sand — ${sand || 'TBD'}. Classic Ryder setup. — The Starter`
  }
  if (/settle|money|venmo|pay/.test(last)) {
    return 'The ledger is sacred. Settle like adults — or let Venmo be the witness. — The Starter'
  }
  return null
}

async function callStarterApi(input: {
  history: Array<{ role: string; content: string }>
  context?: string
}): Promise<string | null> {
  const endpoints = [STARTER_OVERRIDE, '/api/starter'].filter(Boolean) as string[]
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      if (!res.ok) continue
      const data = (await res.json()) as { text?: string; reply?: string; message?: string }
      return data.text || data.reply || data.message || null
    } catch {
      /* try next endpoint */
    }
  }
  return null
}

export async function askStarter(input: {
  history: Array<{ role: string; content: string }>
  context?: string
  trip?: Trip
}): Promise<string | null> {
  const api = await callStarterApi(input)
  if (api) return api
  const last = input.history[input.history.length - 1]?.content.toLowerCase() || ''
  const leaders = input.trip ? buildLeaderboard(input.trip) : undefined
  return keywordReply(last, input.trip, leaders)
}

function fallbackRoast(player: Player, trip?: Trip, leaders?: LeaderRow[]): string {
  const row = leaders?.find(l => l.id === player.id)
  const line = ROAST_LINES[Math.floor(Math.random() * ROAST_LINES.length)]
  const nick = player.nick.split(' ').pop() || player.nick
  const scoreBit = row?.thru ? ` through ${row.thru} at ${formatToPar(row.toParNet)} net` : ''
  const tripBit = trip?.name ? ` at ${trip.name}` : ''
  return `${nick}${scoreBit}${tripBit}: ${line}${player.weakness ? ` (${player.weakness})` : ''} — The Starter on Daly Trips ⛳`
}

export async function generateRoastAsync(player: Player, trip: Trip): Promise<string> {
  const leaders = buildLeaderboard(trip)
  const row = leaders.find(l => l.id === player.id)
  const prompt = `Roast ${player.nick} in 2-3 cutting but good-natured sentences for the group chat. Weakness: ${player.weakness || 'unknown'}. Biggest choke: ${player.choke || 'unknown'}. Handicap ${player.hcp}. In character as The Starter. Respond with ONLY the roast.`
  const context = `Player ${player.nick}, handicap ${player.hcp}, this round ${row ? formatToPar(row.toParNet) + ' net' : 'no scores'}.`
  const api = await callStarterApi({
    history: [{ role: 'me', content: prompt }],
    context
  })
  if (api) return api.endsWith('⛳') || api.includes('Starter') ? api : `${api} — The Starter on Daly Trips ⛳`
  return fallbackRoast(player, trip, leaders)
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
    return "The Starter is on the first tee. Cards are clean. Wagers are live. Let's go."
  }
  return `${top.nick} leads net at ${formatScore(top.toParNet)} through ${top.thru}. Skins pot at $${skins.pot}${skins.carry ? ` with ${skins.carry} carrying` : ''}.`
}

export function starterRecap(trip: Trip, leaders: LeaderRow[]): string {
  const top = [...leaders].sort((a, b) => a.toParNet - b.toParNet).slice(0, 3)
  const lines = top.map((l, i) => `${i + 1}. ${l.nick} (${formatScore(l.toParNet)} net)`).join(' · ')
  return `${trip.name}: ${lines || 'No scores yet'}. The board is live.`
}
