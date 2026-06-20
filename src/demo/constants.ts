import type { Trip } from '@/types/trip'

export const DEMO_TRIP_ID = 'demo-black-cypress'
export const DEMO_SEEN_KEY = 'dt_has_seen_demo'

export function isDemoTrip(trip: Trip | null | undefined): boolean {
  if (!trip) return false
  return trip.seed === true || trip.id === DEMO_TRIP_ID
}
