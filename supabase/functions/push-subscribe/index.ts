import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { handleOptions, jsonResponse } from '../_shared/cors.ts'

serve(async req => {
  const options = handleOptions(req)
  if (options) return options

  try {
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
    const endpoint = body.endpoint as string
    const keys = body.keys as { p256dh?: string; auth?: string }
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return jsonResponse({ error: 'Invalid subscription' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const { error } = await admin.from('push_subscriptions').upsert({
      user_id: authData.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      updated_at: new Date().toISOString()
    })
    if (error) return jsonResponse({ error: error.message }, 500)
    return jsonResponse({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Subscribe failed'
    return jsonResponse({ error: message }, 500)
  }
})
