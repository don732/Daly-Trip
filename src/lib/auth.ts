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
