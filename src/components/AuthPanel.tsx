import { getSupabase } from '@/cloudStore'
import { getSession, signInWithOtp, verifyOtp } from '@/lib/auth'
import { c } from '@/styles'
import { useEffect, useState, type CSSProperties } from 'react'

export function AuthPanel() {
  const configured = !!getSupabase()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [token, setToken] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [userId, setUserId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getSession().then(s => setUserId(s?.user?.id || null))
  }, [])

  if (!configured) return null

  const sendOtp = async () => {
    if (!phone.trim()) return
    setBusy(true)
    setMessage('')
    const { error } = await signInWithOtp(phone.trim())
    setBusy(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setStep('otp')
    setMessage('Code sent — check your phone')
  }

  const confirmOtp = async () => {
    if (!token.trim()) return
    setBusy(true)
    setMessage('')
    const { error } = await verifyOtp(phone.trim(), token.trim())
    setBusy(false)
    if (error) {
      setMessage(error.message)
      return
    }
    const session = await getSession()
    setUserId(session?.user?.id || null)
    setMessage('Signed in')
    setOpen(false)
  }

  if (userId) {
    return (
      <div className="dt-card" style={{ padding: 12, marginBottom: 16, fontSize: 12, color: c.muted }}>
        Signed in · account linked for cloud sync
      </div>
    )
  }

  if (!open) {
    return (
      <button
        className="dt-btn dt-btn-ghost"
        onClick={() => setOpen(true)}
        style={{ width: '100%', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 13 }}
      >
        Sign in with phone (optional)
      </button>
    )
  }

  return (
    <div className="dt-card" style={{ padding: 14, marginBottom: 16 }}>
      <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.12em', color: c.gold, marginBottom: 10, textTransform: 'uppercase' }}>
        Sign in
      </div>
      {step === 'phone' ? (
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+1 phone number"
          style={fieldStyle}
        />
      ) : (
        <input
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="6-digit code"
          style={fieldStyle}
        />
      )}
      {message ? <p style={{ margin: '8px 0 0', fontSize: 12, color: c.muted }}>{message}</p> : null}
      <button
        className="dt-btn dt-btn-gold"
        disabled={busy}
        onClick={step === 'phone' ? sendOtp : confirmOtp}
        style={{ width: '100%', marginTop: 10, padding: 10, borderRadius: 10, opacity: busy ? 0.6 : 1 }}
      >
        {step === 'phone' ? 'Send code' : 'Verify'}
      </button>
      <button className="dt-btn" onClick={() => setOpen(false)} style={{ width: '100%', marginTop: 8, padding: 8, background: 'transparent', color: c.muted }}>
        Cancel
      </button>
    </div>
  )
}

const fieldStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 12,
  borderRadius: 10,
  border: `1px solid ${c.line}`,
  background: c.cardDeep,
  color: c.cream,
  fontSize: 14
}
