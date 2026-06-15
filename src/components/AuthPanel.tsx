import { useAuth } from '@/context/AuthContext'
import { signInWithEmailOtp, verifyEmailOtp } from '@/lib/auth'
import { c, flowInput } from '@/styles'
import { useState } from 'react'

export function AuthPanel({
  required = false,
  title = 'Sign in with email',
  subtitle = 'We send a one-time code to your inbox to link you to your roster slot.'
}: {
  required?: boolean
  title?: string
  subtitle?: string
}) {
  const { configured, userId, email, refresh } = useAuth()
  const [inputEmail, setInputEmail] = useState('')
  const [token, setToken] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  if (!configured) return null

  if (userId) {
    return (
      <div className="dt-card" style={{ padding: 14, fontSize: 13, color: c.muted }}>
        Signed in · {email || 'account linked'}
      </div>
    )
  }

  const sendOtp = async () => {
    if (!inputEmail.trim()) return
    setBusy(true)
    setMessage('')
    const { error } = await signInWithEmailOtp(inputEmail.trim())
    setBusy(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setStep('otp')
    setMessage('Code sent — check your email')
  }

  const confirmOtp = async () => {
    if (!token.trim()) return
    setBusy(true)
    setMessage('')
    const { error } = await verifyEmailOtp(inputEmail.trim(), token.trim())
    setBusy(false)
    if (error) {
      setMessage(error.message)
      return
    }
    await refresh()
    setMessage('')
  }

  return (
    <div
      className="dt-card"
      style={{
        padding: '24px 22px',
        background: c.card,
        border: `2px solid ${c.goldBright}`,
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(13,31,60,.14)'
      }}
    >
      <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.14em', color: c.gold, marginBottom: 8, textTransform: 'uppercase' }}>
        {required ? 'Required' : 'Optional'}
      </div>
      <div className="dt-display" style={{ fontSize: 22, fontWeight: 900, color: c.creamSoft, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: c.muted, marginBottom: 20, lineHeight: 1.5 }}>{subtitle}</div>
      {step === 'email' ? (
        <input
          type="email"
          value={inputEmail}
          onChange={e => setInputEmail(e.target.value)}
          placeholder="you@example.com"
          style={flowInput}
        />
      ) : (
        <input
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="6-digit code"
          style={flowInput}
        />
      )}
      {message ? <p style={{ margin: '10px 0 0', fontSize: 12, color: message.includes('sent') ? c.green : c.red }}>{message}</p> : null}
      <button
        className="dt-btn dt-glow dt-press"
        disabled={busy}
        onClick={step === 'email' ? sendOtp : confirmOtp}
        style={{
          width: '100%',
          marginTop: 16,
          padding: 16,
          borderRadius: 13,
          cursor: 'pointer',
          background: c.felt,
          border: `2px solid ${c.goldBright}`,
          color: c.ink,
          opacity: busy ? 0.7 : 1
        }}
      >
        <span className="dt-cond" style={{ fontSize: 14, fontWeight: 800, letterSpacing: '.06em' }}>
          {step === 'email' ? 'SEND CODE' : 'VERIFY & CONTINUE'}
        </span>
      </button>
      {step === 'otp' ? (
        <button
          className="dt-btn"
          onClick={() => {
            setStep('email')
            setToken('')
            setMessage('')
          }}
          style={{ width: '100%', marginTop: 10, padding: 10, background: 'transparent', color: c.muted, border: 'none', cursor: 'pointer' }}
        >
          Use a different email
        </button>
      ) : null}
    </div>
  )
}
