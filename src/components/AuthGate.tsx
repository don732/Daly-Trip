import { useAuth } from '@/context/AuthContext'
import { AuthPanel } from '@/components/AuthPanel'
import { c, flowShell } from '@/styles'
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
      <div className="dt-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.muted }}>
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
          padding: '24px 16px'
        }}
      >
        <div style={{ maxWidth: 440, width: '100%', ...flowShell }}>
          <AuthPanel required title={title} subtitle={subtitle} />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
