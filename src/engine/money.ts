import type { Trip } from '@/types/trip'
import { computeSkinsForRound } from '@/engine/scoring'
import { applySkinsBalances, allRoundContexts } from '@/engine/roundMoney'

export interface SettlementLine {
  from: string
  to: string
  amount: number
  note: string
}

export function TRIP_PRICE(): number {
  return 5
}

function initBalances(trip: Trip): Record<string, number> {
  const balances: Record<string, number> = {}
  trip.players.forEach(p => {
    balances[p.id] = 0
  })
  return balances
}

export function computeSettlements(trip: Trip): SettlementLine[] {
  const balances = initBalances(trip)
  allRoundContexts(trip).forEach(ctx => {
    const skins = computeSkinsForRound(trip.players, ctx.course, ctx.games, ctx.scores)
    applySkinsBalances(balances, trip.players, ctx.games, skins)
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

export function totalTripMoney(trip: Trip): Record<string, number> {
  const totals = initBalances(trip)
  allRoundContexts(trip).forEach(ctx => {
    const skins = computeSkinsForRound(trip.players, ctx.course, ctx.games, ctx.scores)
    applySkinsBalances(totals, trip.players, ctx.games, skins)
  })
  return totals
}

export function tripSkinsPot(trip: Trip): number {
  return allRoundContexts(trip).reduce((sum, ctx) => {
    const skins = computeSkinsForRound(trip.players, ctx.course, ctx.games, ctx.scores)
    return sum + skins.pot
  }, 0)
}
