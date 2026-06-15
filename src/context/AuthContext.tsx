import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase } from '@/cloudStore'
import { ensureProfile, getSession, onAuthStateChange, signOut as authSignOut } from '@/lib/auth'

interface AuthContextValue {
  configured: boolean
  loading: boolean
  session: Session | null
  userId: string | null
  phone: string | null
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = !!getSupabase()
  const [loading, setLoading] = useState(configured)
  const [session, setSession] = useState<Session | null>(null)

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false)
      return
    }
    const next = await getSession()
    setSession(next)
    if (next?.user?.id) await ensureProfile(next.user.id, next.user.phone)
    setLoading(false)
  }, [configured])

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }
    refresh()
    return onAuthStateChange(async userId => {
      const next = await getSession()
      setSession(next)
      if (userId) await ensureProfile(userId, next?.user?.phone)
      setLoading(false)
    })
  }, [configured, refresh])

  const signOut = useCallback(async () => {
    await authSignOut()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      configured,
      loading,
      session,
      userId: session?.user?.id ?? null,
      phone: session?.user?.phone ?? null,
      signOut,
      refresh
    }),
    [configured, loading, session, signOut, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider required')
  return ctx
}
