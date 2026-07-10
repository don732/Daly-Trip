import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { makeTripFromForm } from '@/engine/tripFactory'
import { askStarter, generateRoastAsync } from './starter'

const trip = makeTripFromForm({
  name: 'Test Trip',
  location: 'SC',
  start: '2026-01-01',
  end: '2026-01-03',
  players: [{ nick: 'Ace', hcp: 10, team: 'pine' }],
  paid: true,
  mode: 'indiv',
  gameFormat: 'stroke',
  stake: 0,
  skins: true,
  rounds: [{ course: 'Test', name: 'Round 1' }]
})

describe('starter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('askStarter prefers { text } from /api/starter', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'From the tee box.' })
    } as Response)

    const reply = await askStarter({
      history: [{ role: 'me', content: 'hello' }],
      trip
    })
    expect(reply).toBe('From the tee box.')
    expect(fetch).toHaveBeenCalledWith(
      '/api/starter',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('generateRoastAsync uses API text when available', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'Brutal roast.' })
    } as Response)

    const player = trip.players[0]
    const roast = await generateRoastAsync(player, trip)
    expect(roast).toContain('Brutal roast.')
  })
})
