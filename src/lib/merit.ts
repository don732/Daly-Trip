import { getSupabase } from '@/cloudStore'
import { buildLeaderboard } from '@/engine/scoring'
import type { Trip } from '@/types/trip'

export type MeritRow = { nick: string; points: number; trips: number }

const AWARDS = [10, 6, 3]

export async function fetchMeritStandings(): Promise<MeritRow[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb
    .from('merit_standings')
    .select('nick, points, trips_count')
    .order('points', { ascending: false })
    .limit(50)
  if (error || !data) return []
  return data.map(row => ({
    nick: row.nick,
    points: Number(row.points) || 0,
    trips: row.trips_count || 0
  }))
}

export async function recordTripMerit(trip: Trip): Promise<void> {
  const sb = getSupabase()
  if (!sb || trip.seed) return

  const { data: members } = await sb
    .from('trip_members')
    .select('user_id, player_id')
    .eq('trip_id', trip.id)

  const userByPlayer = new Map<string, string>()
  members?.forEach(m => {
    if (m.user_id && m.player_id) userByPlayer.set(m.player_id, m.user_id)
  })

  const leaders = buildLeaderboard(trip)
    .filter(l => l.thru >= 9)
    .sort((a, b) => a.toParNet - b.toParNet)
    .slice(0, 3)

  for (let i = 0; i < leaders.length; i += 1) {
    const leader = leaders[i]
    const userId = userByPlayer.get(leader.id)
    if (!userId) continue
    const points = AWARDS[i] || 1
    const { data: existing } = await sb
      .from('merit_standings')
      .select('points, trips_count')
      .eq('user_id', userId)
      .eq('nick', leader.nick)
      .maybeSingle()
    await sb.from('merit_standings').upsert({
      user_id: userId,
      nick: leader.nick,
      points: (Number(existing?.points) || 0) + points,
      trips_count: (existing?.trips_count || 0) + 1,
      updated_at: new Date().toISOString()
    })
  }
}
