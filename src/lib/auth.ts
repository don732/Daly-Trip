import { getSupabase } from '@/cloudStore'

export async function getSession() {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  return data.session
}

export async function signInWithEmailOtp(email: string) {
  const sb = getSupabase()
  if (!sb) return { error: new Error('Supabase not configured') }
  return sb.auth.signInWithOtp({ email })
}

export async function verifyEmailOtp(email: string, token: string) {
  const sb = getSupabase()
  if (!sb) return { error: new Error('Supabase not configured') }
  return sb.auth.verifyOtp({ email, token, type: 'email' })
}

export async function signInWithPhoneOtp(phone: string) {
  const sb = getSupabase()
  if (!sb) return { error: new Error('Supabase not configured') }
  return sb.auth.signInWithOtp({ phone })
}

export async function verifyPhoneOtp(phone: string, token: string) {
  const sb = getSupabase()
  if (!sb) return { error: new Error('Supabase not configured') }
  return sb.auth.verifyOtp({ phone, token, type: 'sms' })
}

export function phoneAuthEnabled(): boolean {
  return import.meta.env.VITE_PHONE_AUTH_ENABLED === 'true'
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

export async function ensureProfile(userId: string, email?: string | null, phone?: string | null) {
  const sb = getSupabase()
  if (!sb) return
  await sb.from('profiles').upsert({
    id: userId,
    display_name: email || phone || null
  })
}

export function formatEmailLabel(email: string | null | undefined): string {
  if (!email) return 'Signed in'
  const at = email.indexOf('@')
  if (at <= 0) return email
  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  const maskedLocal = local.length <= 1 ? local : `${local[0]}${'•'.repeat(Math.min(local.length - 1, 4))}`
  return `${maskedLocal}@${domain}`
}

export function formatPhoneLabel(phone: string | null | undefined): string {
  if (!phone) return 'Signed in'
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return phone
  return `••••${digits.slice(-4)}`
}
