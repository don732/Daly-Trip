import type { Trip } from '@/types/trip'

export interface JoinProfile {
  nick?: string
  hcp?: number
  venmo?: string
  claimPlayerId?: string
}

export function applyJoinProfile(trip: Trip, profile?: JoinProfile): Trip {
  if (!profile) return trip
  if (!profile.claimPlayerId && !profile.nick?.trim() && profile.hcp === undefined && !profile.venmo?.trim()) {
    return trip
  }
  const players = trip.players.map(p => ({ ...p }))
  if (profile.claimPlayerId) {
    const i = players.findIndex(p => p.id === profile.claimPlayerId)
    if (i >= 0) {
      players[i] = {
        ...players[i],
        nick: profile.nick?.trim() || players[i].nick,
        hcp: profile.hcp ?? players[i].hcp,
        venmo: profile.venmo?.trim() || players[i].venmo
      }
    }
    return { ...trip, players }
  }
  if (profile.nick?.trim()) {
    const i = players.findIndex(p => /^Player \d+$/i.test(p.nick) || p.nick === 'Organizer')
    const idx = i >= 0 ? i : 0
    if (players[idx]) {
      players[idx] = {
        ...players[idx],
        nick: profile.nick.trim(),
        hcp: profile.hcp ?? players[idx].hcp,
        venmo: profile.venmo?.trim() || players[idx].venmo
      }
    }
  }
  return { ...trip, players }
}
