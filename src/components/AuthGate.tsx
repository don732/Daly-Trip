import { useAuth } from '@/context/AuthContext'
import { AuthPanel } from '@/components/AuthPanel'
import { c } from '@/styles'
import type { ReactNode } from 'react'

export function AuthGate({
  children,
  title,
  subtitle
}: {
  children: ReactNode
  title?: string
  subtitle?: string
}) {
  const { configured, loading, userId } = useAuth()

  if (!configured) return <>{children}</>

  if (loading) {
    return (
      <div className="dt-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg, color: c.muted }}>
        Loading…
      </div>
    )
  }

  if (!userId) {
    return (
      <div
        className="dt-root dt-fade"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          background: c.bg
        }}
      >
        <div style={{ maxWidth: 440, width: '100%' }}>
          <AuthPanel required title={title} subtitle={subtitle} />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
