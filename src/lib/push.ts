import { getSupabase } from '@/cloudStore'

export type PushPermission = 'unsupported' | 'denied' | 'granted'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Safe)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i)
  return out
}

export async function requestPushPermission(): Promise<{ ok: boolean; mode: PushPermission }> {
  if (typeof Notification === 'undefined') return { ok: false, mode: 'unsupported' }
  let perm = Notification.permission
  if (perm === 'default') {
    try {
      perm = await Notification.requestPermission()
    } catch {
      return { ok: false, mode: 'denied' }
    }
  }
  if (perm !== 'granted') return { ok: false, mode: 'denied' }
  return { ok: true, mode: 'granted' }
}

export async function subscribeToPush(vapidPublicKey: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !vapidPublicKey) return false
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  const sub =
    existing ||
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    }))
  const sb = getSupabase()
  if (!sb) return false
  const { data: userData } = await sb.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return false
  const json = sub.toJSON()
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(await sb.auth.getSession()).data.session?.access_token || ''}` },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys
    })
  })
  return res.ok
}

export async function sendPush(input: {
  toUserId?: string
  tripId?: string
  excludeUserId?: string
  title: string
  body: string
  url?: string
}): Promise<void> {
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
  } catch {
    /* non-fatal */
  }
}

export async function notifyTripActivity(input: {
  tripId: string
  title: string
  body: string
  url?: string
  excludeUserId?: string
}): Promise<void> {
  await sendPush(input)
}

export async function initPushNotifications(): Promise<void> {
  const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  if (!vapid) return
  const { ok } = await requestPushPermission()
  if (!ok) return
  await subscribeToPush(vapid)
}
