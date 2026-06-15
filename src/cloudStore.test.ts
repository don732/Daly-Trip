import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createTestTrip } from '@/test/fixtures'

const mockUpsert = vi.fn()
const mockMaybeSingle = vi.fn()
const mockRpc = vi.fn()
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({
  upsert: mockUpsert,
  select: mockSelect
}))

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn().mockResolvedValue({ user: { id: 'user-abc-123' } })
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
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
    mockRpc.mockReset()
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

  it('pushTripToCloud upserts organizer_id when session exists', async () => {
    const trip = createTestTrip()
    const { pushTripToCloud } = await loadCloudStore()
    await pushTripToCloud(trip)
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: trip.id,
        organizer_id: 'user-abc-123',
        document: trip
      })
    )
  })

  it('previewTripByCodeCloud calls preview RPC', async () => {
    const preview = { id: 't1', code: 'ABC123', name: 'Test', location: 'X', players: [] }
    mockRpc.mockResolvedValue({ data: preview, error: null })
    const { previewTripByCodeCloud } = await loadCloudStore()
    const found = await previewTripByCodeCloud('abc123')
    expect(mockRpc).toHaveBeenCalledWith('preview_trip_by_code', { p_code: 'ABC123' })
    expect(found).toEqual(preview)
  })

  it('joinTripByCodeCloud calls join RPC with profile', async () => {
    const trip = createTestTrip()
    mockRpc.mockResolvedValue({ data: trip, error: null })
    const { joinTripByCodeCloud } = await loadCloudStore()
    const joined = await joinTripByCodeCloud('ABC123', {
      claimPlayerId: trip.players[0].id,
      nick: 'Ace',
      hcp: 10,
      venmo: '@ace'
    })
    expect(mockRpc).toHaveBeenCalledWith('join_trip_by_code', {
      p_code: 'ABC123',
      p_player_id: trip.players[0].id,
      p_nick: 'Ace',
      p_hcp: 10,
      p_venmo: '@ace'
    })
    expect(joined).toEqual(trip)
  })

  it('registerTripOrganizer calls register RPC', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })
    const { registerTripOrganizer } = await loadCloudStore()
    await registerTripOrganizer('trip-1', 'player-1')
    expect(mockRpc).toHaveBeenCalledWith('register_trip_organizer', {
      p_trip_id: 'trip-1',
      p_player_id: 'player-1'
    })
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
