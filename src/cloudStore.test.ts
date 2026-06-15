import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createTestTrip } from '@/test/fixtures'

const mockUpsert = vi.fn()
const mockMaybeSingle = vi.fn()
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({
  upsert: mockUpsert,
  select: mockSelect
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    })),
    removeChannel: vi.fn()
  }))
}))

async function loadCloudStore() {
  return import('@/cloudStore')
}

describe('cloudStore', () => {
  beforeEach(() => {
    vi.resetModules()
    mockUpsert.mockReset()
    mockMaybeSingle.mockReset()
    mockEq.mockClear()
    mockSelect.mockClear()
    mockFrom.mockClear()
    mockUpsert.mockResolvedValue({ error: null })
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('getSupabase returns null when env vars are missing', async () => {
    vi.unstubAllEnvs()
    const { getSupabase, getSyncState, resetCloudStoreForTests } = await loadCloudStore()
    resetCloudStoreForTests()
    expect(getSupabase()).toBeNull()
    expect(getSyncState().state).toBe('offline')
  })

  it('pushTripToCloud upserts expected columns and document', async () => {
    const trip = createTestTrip()
    const { pushTripToCloud } = await loadCloudStore()
    await pushTripToCloud(trip)
    expect(mockFrom).toHaveBeenCalledWith('trips')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: trip.id,
        code: trip.code,
        name: trip.name,
        location: trip.location,
        start_date: trip.start,
        end_date: trip.end,
        paid: trip.paid,
        seed: trip.seed,
        price: trip.price,
        document: trip
      })
    )
  })

  it('findTripByCodeCloud returns parsed trip document', async () => {
    const trip = createTestTrip()
    mockMaybeSingle.mockResolvedValue({ data: { document: trip }, error: null })
    const { findTripByCodeCloud } = await loadCloudStore()
    const found = await findTripByCodeCloud(trip.code.toLowerCase())
    expect(mockEq).toHaveBeenCalledWith('code', trip.code.toUpperCase())
    expect(found).toEqual(trip)
  })

  it('transitions sync state from syncing to live on successful push', async () => {
    const trip = createTestTrip()
    const { pushTripToCloud, getSyncState, onSyncStateChange } = await loadCloudStore()
    const states: string[] = []
    onSyncStateChange(state => states.push(state))
    await pushTripToCloud(trip)
    expect(states).toContain('syncing')
    expect(getSyncState().state).toBe('live')
  })

  it('sets error state when push fails', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'upsert failed' } })
    const trip = createTestTrip()
    const { pushTripToCloud, getSyncState } = await loadCloudStore()
    await expect(pushTripToCloud(trip)).rejects.toEqual({ message: 'upsert failed' })
    expect(getSyncState().state).toBe('error')
    expect(getSyncState().error).toBe('upsert failed')
  })
})
