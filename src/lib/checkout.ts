export const TRIP_PRICE = 5

export interface CheckoutResult {
  ok: boolean
  paid: boolean
  sessionId?: string
}

export async function startCheckout(tripId: string, headcount: number): Promise<CheckoutResult> {
  const apiBase = import.meta.env.VITE_CHECKOUT_API_URL
  if (apiBase) {
    try {
      const res = await fetch(`${apiBase}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, headcount, amount: headcount * TRIP_PRICE })
      })
      if (res.ok) {
        const data = (await res.json()) as { paid?: boolean; sessionId?: string }
        return { ok: true, paid: !!data.paid, sessionId: data.sessionId }
      }
    } catch {
      return { ok: false, paid: false }
    }
  }
  await new Promise(r => setTimeout(r, 1200))
  return { ok: true, paid: true, sessionId: `local_${tripId}` }
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
