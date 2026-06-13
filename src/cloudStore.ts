import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Trip } from '@/types/trip'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (client) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  client = createClient(url, key)
  return client
}

export async function pushTripToCloud(trip: Trip): Promise<void> {
  const sb = getSupabase()
  if (!sb) return
  await sb.from('trips').upsert({
    id: trip.id,
    code: trip.code,
    name: trip.name,
    location: trip.location,
    start_date: trip.start,
    end_date: trip.end,
    paid: trip.paid,
    seed: trip.seed,
    price: trip.price,
    document: trip,
    updated_at: new Date().toISOString()
  })
}

export async function pullTripFromCloud(tripId: string): Promise<Trip | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('trips').select('document').eq('id', tripId).maybeSingle()
  if (error || !data) return null
  return data.document as Trip
}

export async function findTripByCodeCloud(code: string): Promise<Trip | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('trips').select('document').eq('code', code.toUpperCase()).maybeSingle()
  if (error || !data) return null
  return data.document as Trip
}

export function subscribeTrip(tripId: string, onUpdate: (trip: Trip) => void): (() => void) | null {
  const sb = getSupabase()
  if (!sb) return null
  const channel = sb
    .channel(`trip:${tripId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` }, payload => {
      const doc = (payload.new as { document?: Trip }).document
      if (doc) onUpdate(doc)
    })
    .subscribe()
  return () => {
    sb.removeChannel(channel)
  }
}
