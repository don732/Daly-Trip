import { useAuth } from '@/context/AuthContext'
import { OtpInput } from '@/components/OtpInput'
import {
  formatPhoneLabel,
  phoneAuthEnabled,
  signInWithEmailOtp,
  signInWithPhoneOtp,
  verifyEmailOtp,
  verifyPhoneOtp
} from '@/lib/auth'
import { c, flowInput } from '@/styles'
import { useCallback, useRef, useState } from 'react'

type AuthMethod = 'email' | 'phone'

export function AuthPanel({
  required = false,
  title = 'Sign in with email',
  subtitle = 'We send a one-time code to your inbox to link you to your roster slot.'
}: {
  required?: boolean
  title?: string
  subtitle?: string
}) {
  const { configured, userId, email, session, refresh } = useAuth()
  const phoneEnabled = phoneAuthEnabled()
  const [method, setMethod] = useState<AuthMethod>('email')
  const [inputEmail, setInputEmail] = useState('')
  const [inputPhone, setInputPhone] = useState('')
  const [token, setToken] = useState('')
  const [step, setStep] = useState<'input' | 'otp'>('input')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(false)
  const verifyingRef = useRef(false)

  const contact = method === 'email' ? inputEmail.trim() : inputPhone.trim()

  const confirmOtp = useCallback(
    async (code: string) => {
      const trimmed = code.trim()
      if (trimmed.length !== 6 || verifyingRef.current || !contact) return
      verifyingRef.current = true
      setBusy(true)
      setMessage('')
      const { error } =
        method === 'email'
          ? await verifyEmailOtp(contact, trimmed)
          : await verifyPhoneOtp(contact, trimmed)
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
    [contact, method, refresh]
  )

  if (!configured) return null

  if (userId) {
    const label = email || formatPhoneLabel(session?.user?.phone) || 'account linked'
    return (
      <div className="dt-card" style={{ padding: 14, fontSize: 13, color: c.muted }}>
        Signed in · {label}
      </div>
    )
  }

  const sendOtp = async () => {
    if (!contact) return
    setBusy(true)
    setMessage('')
    const { error } =
      method === 'email' ? await signInWithEmailOtp(contact) : await signInWithPhoneOtp(contact)
    setBusy(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setToken('')
    setStep('otp')
    setMessage(method === 'email' ? 'Code sent — check your email' : 'Code sent — check your texts')
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
        {phoneEnabled && method === 'phone' ? 'Sign in with phone' : title}
      </div>
      <div style={{ fontSize: 13, color: c.muted, marginBottom: 20, lineHeight: 1.5 }}>
        {phoneEnabled && method === 'phone'
          ? 'We text a one-time code when SMS auth is enabled in Supabase (Twilio).'
          : subtitle}
      </div>
      {phoneEnabled && step === 'input' ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['email', 'phone'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMethod(m)
                setMessage('')
              }}
              className="dt-btn"
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 10,
                cursor: 'pointer',
                border: `1.5px solid ${method === m ? c.gold : c.line}`,
                background: method === m ? 'rgba(201,162,75,.12)' : c.cardDeep,
                color: c.cream,
                fontSize: 12
              }}
            >
              {m === 'email' ? 'Email' : 'SMS'}
            </button>
          ))}
        </div>
      ) : null}
      {step === 'input' ? (
        method === 'email' ? (
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
          <input
            type="tel"
            value={inputPhone}
            onChange={e => setInputPhone(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') sendOtp()
            }}
            placeholder="+1 555 123 4567"
            style={flowInput}
          />
        )
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
            {busy ? 'Verifying…' : method === 'email' ? 'Enter the 6-digit code from your email' : 'Enter the 6-digit code from your text'}
          </p>
        </div>
      )}
      {message && step === 'input' ? (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: successMessage ? c.green : c.red }}>{message}</p>
      ) : null}
      {message && step === 'otp' && !successMessage ? (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: c.red, textAlign: 'center' }}>{message}</p>
      ) : null}
      {step === 'input' ? (
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
              setStep('input')
              setToken('')
              setMessage('')
              verifyingRef.current = false
            }}
            style={{ width: '100%', marginTop: 16, padding: 10, background: 'transparent', color: c.muted, border: 'none', cursor: 'pointer' }}
          >
            {method === 'email' ? 'Use a different email' : 'Use a different number'}
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
