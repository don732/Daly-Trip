import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

serve(async req => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!stripeKey || !webhookSecret) {
    return new Response('Stripe webhook not configured', { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  const body = await req.text()
  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return new Response(message, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    const amount = Number(session.metadata?.amount || 0)
    if (userId && session.id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      const { data: existing } = await supabase
        .from('trip_payments')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle()

      if (!existing) {
        await supabase.from('trip_payments').insert({
          user_id: userId,
          amount: Number.isFinite(amount) ? amount : (session.amount_total ?? 0) / 100,
          stripe_session_id: session.id,
          status: 'paid'
        })
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
