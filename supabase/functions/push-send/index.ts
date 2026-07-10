import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import webpush from 'https://esm.sh/web-push@3.6.7'
import { handleOptions, jsonResponse } from '../_shared/cors.ts'

serve(async req => {
  const options = handleOptions(req)
  if (options) return options

  try {
    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:invites@dalytrips.com'
    if (!vapidPublic || !vapidPrivate) {
      return jsonResponse({ error: 'VAPID not configured' }, 500)
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

    const body = await req.json()
    const toUserId = body.toUserId as string | undefined
    const tripId = body.tripId as string | undefined
    const excludeUserId = body.excludeUserId as string | undefined
    const title = body.title as string
    const text = body.body as string
    const url = (body.url as string) || '/'
    if (!title || !text) {
      return jsonResponse({ error: 'Missing fields' }, 400)
    }
    if (!toUserId && !tripId) {
      return jsonResponse({ error: 'toUserId or tripId required' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const sendOne = async (userId: string) => {
      const { data: sub, error } = await admin
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', userId)
        .maybeSingle()
      if (error || !sub) return false
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        },
        JSON.stringify({ title, body: text, url })
      )
      return true
    }

    if (toUserId) {
      const ok = await sendOne(toUserId)
      return jsonResponse({ ok })
    }

    const { data: members, error: membersError } = await admin
      .from('trip_members')
      .select('user_id')
      .eq('trip_id', tripId)
    if (membersError) return jsonResponse({ error: membersError.message }, 500)

    let sent = 0
    for (const row of members || []) {
      if (!row.user_id || row.user_id === excludeUserId) continue
      try {
        if (await sendOne(row.user_id)) sent += 1
      } catch {
        /* skip failed delivery */
      }
    }
    return jsonResponse({ ok: true, sent })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Push failed'
    return jsonResponse({ error: message }, 500)
  }
})
