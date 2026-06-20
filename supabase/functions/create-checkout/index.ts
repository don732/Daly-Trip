import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { corsHeaders, handleOptions, jsonResponse } from '../_shared/cors.ts'

serve(async req => {
  const options = handleOptions(req)
  if (options) return options

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const siteUrl = Deno.env.get('SITE_URL') || 'https://dalytrips.com'
    if (!stripeKey) return jsonResponse({ error: 'Stripe not configured' }, 500)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) return jsonResponse({ error: 'Unauthorized' }, 401)

    const body = await req.json()
    const headcount = Number(body.headcount)
    const amount = Number(body.amount)
    if (!Number.isFinite(headcount) || headcount < 2 || !Number.isFinite(amount) || amount <= 0) {
      return jsonResponse({ error: 'Invalid checkout request' }, 400)
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: authData.user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: 'Daly Trips event',
              description: `${headcount} players · one-time organizer fee`
            }
          }
        }
      ],
      success_url: `${siteUrl}/plan?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/plan?checkout=cancel`,
      metadata: {
        user_id: authData.user.id,
        headcount: String(headcount),
        amount: String(amount)
      }
    })

    return jsonResponse({ url: session.url, sessionId: session.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed'
    return jsonResponse({ error: message }, 500)
  }
})
