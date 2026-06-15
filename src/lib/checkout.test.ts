import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('startCheckout', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('returns paid true after stub delay when no checkout API is configured', async () => {
    vi.useFakeTimers()
    const { startCheckout } = await import('@/lib/checkout')
    const pending = startCheckout('trip-1', 4)
    await vi.advanceTimersByTimeAsync(1200)
    const result = await pending
    expect(result).toEqual({ ok: true, paid: true, sessionId: 'local_trip-1' })
  })

  it('uses checkout API response when configured', async () => {
    vi.stubEnv('VITE_CHECKOUT_API_URL', 'https://checkout.example.com')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ paid: true, sessionId: 'sess_123' })
    })
    vi.stubGlobal('fetch', fetchMock)
    const { startCheckout } = await import('@/lib/checkout')
    const result = await startCheckout('trip-2', 2)
    expect(fetchMock).toHaveBeenCalledWith('https://checkout.example.com/checkout', expect.objectContaining({ method: 'POST' }))
    expect(result).toEqual({ ok: true, paid: true, sessionId: 'sess_123' })
  })

  it('returns failure when checkout API errors', async () => {
    vi.stubEnv('VITE_CHECKOUT_API_URL', 'https://checkout.example.com')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    const { startCheckout } = await import('@/lib/checkout')
    const result = await startCheckout('trip-3', 2)
    expect(result).toEqual({ ok: false, paid: false })
  })
})
