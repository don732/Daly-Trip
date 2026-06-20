import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { handleOptions, jsonResponse } from '../_shared/cors.ts'

serve(async req => {
  const options = handleOptions(req)
  if (options) return options

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return jsonResponse({ error: 'Stripe not configured' }, 500)

    const body = await req.json()
    const sessionId = String(body.sessionId || '').trim()
    if (!sessionId) return jsonResponse({ error: 'Missing sessionId' }, 400)

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    const paid = session.payment_status === 'paid'
    const headcount = Number(session.metadata?.headcount || 0)
    const amount = Number(session.metadata?.amount || 0)

    return jsonResponse({
      paid,
      sessionId: session.id,
      headcount: Number.isFinite(headcount) ? headcount : undefined,
      amount: Number.isFinite(amount) ? amount : undefined
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed'
    return jsonResponse({ error: message }, 500)
  }
})
