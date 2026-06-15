import { getSupabase } from '@/cloudStore'

export async function getSession() {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  return data.session
}

export async function signInWithOtp(phone: string) {
  const sb = getSupabase()
  if (!sb) return { error: new Error('Supabase not configured') }
  return sb.auth.signInWithOtp({ phone })
}

export async function verifyOtp(phone: string, token: string) {
  const sb = getSupabase()
  if (!sb) return { error: new Error('Supabase not configured') }
  return sb.auth.verifyOtp({ phone, token, type: 'sms' })
}

export async function signOut() {
  const sb = getSupabase()
  if (!sb) return
  await sb.auth.signOut()
}

export function onAuthStateChange(handler: (userId: string | null) => void) {
  const sb = getSupabase()
  if (!sb) return () => undefined
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    handler(session?.user?.id || null)
  })
  return () => data.subscription.unsubscribe()
}

export async function ensureProfile(userId: string, phone?: string | null) {
  const sb = getSupabase()
  if (!sb) return
  await sb.from('profiles').upsert({
    id: userId,
    display_name: phone || null
  })
}

export function formatPhoneLabel(phone: string | null | undefined): string {
  if (!phone) return 'Signed in'
  if (phone.length <= 4) return phone
  const tail = phone.slice(-4)
  const hidden = phone.slice(0, -4).replace(/\d/g, '•')
  return `${hidden}${tail}`
}
