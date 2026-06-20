import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const mockGetSupabase = vi.fn()
const mockGetSession = vi.fn()

vi.mock('@/cloudStore', () => ({
  getSupabase: () => mockGetSupabase()
}))

vi.mock('@/lib/auth', () => ({
  getSession: () => mockGetSession()
}))

describe('checkout', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGetSupabase.mockReset()
    mockGetSession.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns paid true after stub delay when supabase is missing', async () => {
    vi.useFakeTimers()
    mockGetSupabase.mockReturnValue(null)
    const { startCheckout } = await import('@/lib/checkout')
    const pending = startCheckout(4)
    await vi.advanceTimersByTimeAsync(1200)
    const result = await pending
    expect(result.ok).toBe(true)
    expect(result.paid).toBe(true)
    expect(result.sessionId).toMatch(/^local_/)
  })

  it('redirects via edge function when supabase is configured', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { url: 'https://checkout.stripe.com/test', sessionId: 'cs_test_1' },
      error: null
    })
    mockGetSupabase.mockReturnValue({ functions: { invoke } })
    mockGetSession.mockResolvedValue({ user: { id: 'user-1', email: 'a@test.com' } })
    const { startCheckout } = await import('@/lib/checkout')
    const result = await startCheckout(4)
    expect(invoke).toHaveBeenCalledWith('create-checkout', expect.objectContaining({ body: { headcount: 4, amount: 20 } }))
    expect(result).toEqual({
      ok: true,
      paid: false,
      redirectUrl: 'https://checkout.stripe.com/test',
      sessionId: 'cs_test_1'
    })
  })

  it('verifies local stub sessions without calling supabase', async () => {
    const { verifyCheckout } = await import('@/lib/checkout')
    const result = await verifyCheckout('local_abc')
    expect(result).toEqual({ ok: true, paid: true, sessionId: 'local_abc' })
  })

  it('verifies stripe sessions via edge function', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: { paid: true, sessionId: 'cs_test_1', headcount: 6, amount: 30 },
      error: null
    })
    mockGetSupabase.mockReturnValue({ functions: { invoke } })
    const { verifyCheckout } = await import('@/lib/checkout')
    const result = await verifyCheckout('cs_test_1')
    expect(invoke).toHaveBeenCalledWith('verify-checkout', { body: { sessionId: 'cs_test_1' } })
    expect(result.paid).toBe(true)
    expect(result.headcount).toBe(6)
  })
})
