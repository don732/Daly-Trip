import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { JoinProfile } from '@/engine/joinProfile'
import { getSession } from '@/lib/auth'
import type { Trip, TripPreview } from '@/types/trip'
import { debounce } from '@/lib/debounce'

let client: SupabaseClient | null = null

export type SyncState = 'offline' | 'syncing' | 'live' | 'error'

type SyncListener = (state: SyncState, error: string | null) => void

let syncState: SyncState = 'offline'
let syncError: string | null = null
const syncListeners = new Set<SyncListener>()

function initSyncState() {
  syncState = getSupabase() ? 'live' : 'offline'
  syncError = null
}

initSyncState()

function setSyncState(state: SyncState, error: string | null = null) {
  syncState = state
  syncError = error
  syncListeners.forEach(fn => fn(state, error))
}

export function getSyncState(): { state: SyncState; error: string | null } {
  return { state: syncState, error: syncError }
}

export function onSyncStateChange(listener: SyncListener): () => void {
  syncListeners.add(listener)
  listener(syncState, syncError)
  return () => {
    syncListeners.delete(listener)
  }
}

export function resetCloudStoreForTests(): void {
  client = null
  syncState = 'offline'
  syncError = null
}

export function getSupabase(): SupabaseClient | null {
  if (client) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  client = createClient(url, key)
  setSyncState('live', null)
  return client
}

function activeRoundId(trip: Trip): string | null {
  return trip.rounds[trip.activeRoundIndex]?.id || null
}

export async function pushTripToCloud(trip: Trip): Promise<void> {
  if (trip.seed) return
  const sb = getSupabase()
  if (!sb) {
    setSyncState('offline', null)
    return
  }
  setSyncState('syncing', null)
  const session = await getSession()
  if (!session?.user?.id) {
    const message = 'Sign in required to sync trip'
    setSyncState('error', message)
    throw new Error(message)
  }
  const { error } = await sb.from('trips').upsert({
    id: trip.id,
    code: trip.code,
    name: trip.name,
    location: trip.location,
    start_date: trip.start,
    end_date: trip.end,
    paid: trip.paid,
    seed: trip.seed,
    price: trip.price,
    organizer_id: session.user.id,
    active_round_id: activeRoundId(trip),
    document: trip,
    updated_at: new Date().toISOString()
  })
  if (error) {
    setSyncState('error', error.message)
    throw error
  }
  setSyncState('live', null)
}

export async function registerTripOrganizer(tripId: string, playerId: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) return
  const session = await getSession()
  if (!session?.user?.id) return
  const { error } = await sb.rpc('register_trip_organizer', {
    p_trip_id: tripId,
    p_player_id: playerId
  })
  if (error) {
    setSyncState('error', error.message)
    throw error
  }
}

const debouncedPush = debounce((trip: Trip) => {
  pushTripToCloud(trip).catch(() => undefined)
}, 800)

export function schedulePushTripToCloud(trip: Trip): void {
  if (trip.seed) return
  debouncedPush(trip)
}

export async function pullTripFromCloud(tripId: string): Promise<Trip | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('trips').select('document').eq('id', tripId).maybeSingle()
  if (error) {
    setSyncState('error', error.message)
    return null
  }
  if (!data) return null
  return data.document as Trip
}

export async function previewTripByCodeCloud(code: string): Promise<TripPreview | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.rpc('preview_trip_by_code', { p_code: code.trim().toUpperCase() })
  if (error) {
    setSyncState('error', error.message)
    return null
  }
  if (!data) return null
  return data as TripPreview
}

export async function addPlayerToTripCloud(
  code: string,
  profile?: { nick?: string; hcp?: number; venmo?: string }
): Promise<Trip | null> {
  const sb = getSupabase()
  if (!sb) return null
  const session = await getSession()
  if (!session?.user?.id) return null
  const { data, error } = await sb.rpc('add_player_to_trip', {
    p_code: code.trim().toUpperCase(),
    p_nick: profile?.nick?.trim() ?? null,
    p_hcp: profile?.hcp ?? 18,
    p_venmo: profile?.venmo?.trim() ?? null
  })
  if (error) {
    setSyncState('error', error.message)
    return null
  }
  if (!data) return null
  return data as Trip
}

export async function joinTripByCodeCloud(code: string, profile?: JoinProfile): Promise<Trip | null> {
  const sb = getSupabase()
  if (!sb) return null
  const session = await getSession()
  if (!session?.user?.id) return null

  if (profile?.addNew) {
    return addPlayerToTripCloud(code, profile)
  }

  const { data, error } = await sb.rpc('join_trip_by_code', {
    p_code: code.trim().toUpperCase(),
    p_player_id: profile?.claimPlayerId ?? null,
    p_nick: profile?.nick?.trim() ?? null,
    p_hcp: profile?.hcp ?? 18,
    p_venmo: profile?.venmo?.trim() ?? null
  })
  if (error) {
    if (/no roster slot/i.test(error.message)) {
      return addPlayerToTripCloud(code, profile)
    }
    setSyncState('error', error.message)
    return null
  }
  if (!data) return null
  return data as Trip
}

export async function findTripByCodeCloud(code: string): Promise<Trip | null> {
  const preview = await previewTripByCodeCloud(code)
  if (!preview) return null
  return pullTripFromCloud(preview.id)
}

export function subscribeTrip(tripId: string, onUpdate: (trip: Trip) => void): (() => void) | null {
  const sb = getSupabase()
  if (!sb) return null
  const channel = sb
    .channel(`trip:${tripId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` }, payload => {
      const doc = (payload.new as { document?: Trip }).document
      if (doc) {
        setSyncState('live', null)
        onUpdate(doc)
      }
    })
    .subscribe(status => {
      if (status === 'SUBSCRIBED') setSyncState('live', null)
      if (status === 'CHANNEL_ERROR') setSyncState('error', 'Realtime connection failed')
    })
  return () => {
    sb.removeChannel(channel)
  }
}
