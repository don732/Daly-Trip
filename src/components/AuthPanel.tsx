import { useAuth } from '@/context/AuthContext'
import { OtpInput } from '@/components/OtpInput'
import { signInWithEmailOtp, verifyEmailOtp } from '@/lib/auth'
import { c, flowInput } from '@/styles'
import { useCallback, useRef, useState } from 'react'

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
  const [shake, setShake] = useState(false)
  const verifyingRef = useRef(false)

  const confirmOtp = useCallback(
    async (code: string) => {
      const trimmed = code.trim()
      if (trimmed.length !== 6 || verifyingRef.current) return
      verifyingRef.current = true
      setBusy(true)
      setMessage('')
      const { error } = await verifyEmailOtp(inputEmail.trim(), trimmed)
      setBusy(false)
      verifyingRef.current = false
      if (error) {
        setShake(true)
        setMessage(error.message)
        setToken('')
        window.setTimeout(() => setShake(false), 450)
        return
      }
      await refresh()
      setMessage('')
    },
    [inputEmail, refresh]
  )

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
    setToken('')
    setStep('otp')
    setMessage('Code sent — check your email')
  }

  const successMessage = message.includes('sent') || message.includes('Verifying')

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
          onKeyDown={e => {
            if (e.key === 'Enter') sendOtp()
          }}
          placeholder="you@example.com"
          style={flowInput}
        />
      ) : (
        <div style={{ marginBottom: 4 }}>
          <OtpInput
            value={token}
            onChange={setToken}
            onComplete={confirmOtp}
            disabled={busy}
            shake={shake}
            autoFocus
          />
          <p style={{ margin: '12px 0 0', fontSize: 12, color: c.muted, textAlign: 'center' }}>
            {busy ? 'Verifying…' : 'Enter the 6-digit code from your email'}
          </p>
        </div>
      )}
      {message && step === 'email' ? (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: successMessage ? c.green : c.red }}>{message}</p>
      ) : null}
      {message && step === 'otp' && !successMessage ? (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: c.red, textAlign: 'center' }}>{message}</p>
      ) : null}
      {step === 'email' ? (
        <button
          className="dt-btn dt-glow dt-press"
          disabled={busy}
          onClick={sendOtp}
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
            SEND CODE
          </span>
        </button>
      ) : null}
      {step === 'otp' ? (
        <>
          <button
            className="dt-btn"
            disabled={busy}
            onClick={() => {
              setStep('email')
              setToken('')
              setMessage('')
              verifyingRef.current = false
            }}
            style={{ width: '100%', marginTop: 16, padding: 10, background: 'transparent', color: c.muted, border: 'none', cursor: 'pointer' }}
          >
            Use a different email
          </button>
          <button
            className="dt-btn"
            disabled={busy}
            onClick={sendOtp}
            style={{
              width: '100%',
              marginTop: 4,
              padding: 10,
              background: 'transparent',
              color: c.gold,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            Resend code
          </button>
        </>
      ) : null}
    </div>
  )
}
