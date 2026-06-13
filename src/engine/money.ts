import type { LeaderRow, Trip } from '@/types/trip'
import { computeSkins } from '@/engine/scoring'

export interface SettlementLine {
  from: string
  to: string
  amount: number
  note: string
}

export function TRIP_PRICE(): number {
  return 5
}

export function computeSettlements(trip: Trip): SettlementLine[] {
  const balances: Record<string, number> = {}
  trip.players.forEach(p => {
    balances[p.id] = 0
  })
  const skins = computeSkins(trip)
  Object.entries(skins.winners).forEach(([hole, winnerId]) => {
    if (!winnerId) return
    const stake = trip.games.find(g => g.type === 'skins')?.stake || 5
    trip.players.forEach(p => {
      if (p.id === winnerId) balances[p.id] += stake * (trip.players.length - 1)
      else balances[p.id] -= stake
    })
  })
  trip.bets.forEach(b => {
    if (b.settled) return
    balances[b.from] -= b.amount
    balances[b.to] += b.amount
  })
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < 0)
    .map(([id, v]) => ({ id, amount: -v }))
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0)
    .map(([id, v]) => ({ id, amount: v }))
  const lines: SettlementLine[] = []
  let di = 0
  let ci = 0
  while (di < debtors.length && ci < creditors.length) {
    const pay = Math.min(debtors[di].amount, creditors[ci].amount)
    if (pay > 0) {
      lines.push({
        from: debtors[di].id,
        to: creditors[ci].id,
        amount: Math.round(pay * 100) / 100,
        note: 'Settle up'
      })
    }
    debtors[di].amount -= pay
    creditors[ci].amount -= pay
    if (debtors[di].amount <= 0.01) di += 1
    if (creditors[ci].amount <= 0.01) ci += 1
  }
  return lines
}

export function totalTripMoney(leaderboard: LeaderRow[], trip: Trip): Record<string, number> {
  const totals: Record<string, number> = {}
  trip.players.forEach(p => {
    totals[p.id] = 0
  })
  const skins = computeSkins(trip)
  Object.values(skins.winners).forEach(winnerId => {
    if (!winnerId) return
    const stake = trip.games.find(g => g.type === 'skins')?.stake || 5
    trip.players.forEach(p => {
      if (p.id === winnerId) totals[p.id] += stake * (trip.players.length - 1)
      else totals[p.id] -= stake
    })
  })
  return totals
}
