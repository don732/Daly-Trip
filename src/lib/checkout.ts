export const TRIP_PRICE = 5

export interface CheckoutResult {
  ok: boolean
  paid: boolean
  sessionId?: string
  redirectUrl?: string
  error?: string
}

export interface VerifyCheckoutResult {
  ok: boolean
  paid: boolean
  sessionId?: string
  headcount?: number
  amount?: number
  error?: string
}

export async function startCheckout(headcount: number): Promise<CheckoutResult> {
  const { getSupabase } = await import('@/cloudStore')
  const { getSession } = await import('@/lib/auth')
  const sb = getSupabase()

  if (!sb) {
    await new Promise(r => setTimeout(r, 1200))
    return { ok: true, paid: true, sessionId: `local_${Date.now()}` }
  }

  const session = await getSession()
  if (!session?.user) {
    return { ok: false, paid: false, error: 'Sign in required' }
  }

  try {
    const { data, error } = await sb.functions.invoke('create-checkout', {
      body: { headcount, amount: headcount * TRIP_PRICE }
    })
    if (error) return { ok: false, paid: false, error: error.message }
    const payload = data as { url?: string; sessionId?: string; error?: string }
    if (payload?.error) return { ok: false, paid: false, error: payload.error }
    if (payload?.url) {
      return { ok: true, paid: false, redirectUrl: payload.url, sessionId: payload.sessionId }
    }
    return { ok: false, paid: false, error: 'Checkout unavailable' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed'
    return { ok: false, paid: false, error: message }
  }
}

export async function verifyCheckout(sessionId: string): Promise<VerifyCheckoutResult> {
  if (sessionId.startsWith('local_')) {
    return { ok: true, paid: true, sessionId }
  }

  const { getSupabase } = await import('@/cloudStore')
  const sb = getSupabase()
  if (!sb) return { ok: false, paid: false, error: 'Supabase not configured' }

  try {
    const { data, error } = await sb.functions.invoke('verify-checkout', {
      body: { sessionId }
    })
    if (error) return { ok: false, paid: false, error: error.message }
    const payload = data as VerifyCheckoutResult & { error?: string }
    if (payload?.error) return { ok: false, paid: false, error: payload.error }
    return {
      ok: !!payload?.paid,
      paid: !!payload?.paid,
      sessionId: payload.sessionId || sessionId,
      headcount: payload.headcount,
      amount: payload.amount
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed'
    return { ok: false, paid: false, error: message }
  }
}

export async function recordTripPayment(input: {
  tripId: string
  userId: string | null
  amount: number
  sessionId: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
}): Promise<void> {
  const sb = (await import('@/cloudStore')).getSupabase()
  if (!sb || !input.userId) return
  await sb.from('trip_payments').insert({
    trip_id: input.tripId,
    user_id: input.userId,
    amount: input.amount,
    stripe_session_id: input.sessionId,
    status: input.status
  })
}
