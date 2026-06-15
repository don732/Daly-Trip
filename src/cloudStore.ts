import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Trip } from '@/types/trip'
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
  const sb = getSupabase()
  if (!sb) {
    setSyncState('offline', null)
    return
  }
  setSyncState('syncing', null)
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

const debouncedPush = debounce((trip: Trip) => {
  pushTripToCloud(trip).catch(() => undefined)
}, 800)

export function schedulePushTripToCloud(trip: Trip): void {
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

export async function findTripByCodeCloud(code: string): Promise<Trip | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('trips').select('document').eq('code', code.toUpperCase()).maybeSingle()
  if (error) {
    setSyncState('error', error.message)
    return null
  }
  if (!data) return null
  return data.document as Trip
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
