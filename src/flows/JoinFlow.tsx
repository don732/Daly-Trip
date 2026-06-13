import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTripStore } from '@/context/TripContext'
import { c } from '@/styles'

export function JoinFlow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { joinByCodeAsync } = useTripStore()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fromUrl = searchParams.get('code')?.trim().toUpperCase()
    if (!fromUrl || fromUrl.length < 4) return
    setCode(fromUrl)
    let cancelled = false
    setLoading(true)
    joinByCodeAsync(fromUrl).then(found => {
      if (cancelled) return
      setLoading(false)
      if (found) navigate(`/trip/${found.id}`)
      else setError('Trip not found. Try BOYS26 for the demo.')
    })
    return () => {
      cancelled = true
    }
  }, [searchParams, joinByCodeAsync, navigate])

  const submit = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('Enter a join code')
      return
    }
    setLoading(true)
    setError('')
    const found = await joinByCodeAsync(trimmed)
    setLoading(false)
    if (found) {
      navigate(`/trip/${found.id}`)
      return
    }
    setError('Trip not found. Try BOYS26 for the demo.')
  }

  return (
    <div className="dt-root dt-fade-in" style={{ minHeight: '100%', background: c.bg }}>
      <div className="dt-shell" style={{ padding: 'calc(20px + env(safe-area-inset-top)) 20px 40px' }}>
        <button
          className="dt-btn"
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', color: c.muted, padding: 0, marginBottom: 24 }}
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <h2 style={{ margin: '0 0 8px', fontSize: 26, color: c.cream }}>Join a trip</h2>
        <p style={{ margin: '0 0 24px', color: c.muted, fontSize: 14 }}>Enter the 6-character code from your organizer.</p>
        <input
          value={code}
          onChange={e => {
            setCode(e.target.value.toUpperCase())
            setError('')
          }}
          placeholder="BOYS26"
          maxLength={6}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: 16,
            borderRadius: 14,
            border: `1px solid ${c.goldDim}`,
            background: c.card,
            color: c.cream,
            fontSize: 22,
            letterSpacing: '.2em',
            textAlign: 'center',
            fontWeight: 700
          }}
        />
        {error ? <p style={{ color: c.red, fontSize: 13, marginTop: 10 }}>{error}</p> : null}
        <button
          className="dt-btn dt-btn-gold"
          onClick={submit}
          disabled={loading}
          style={{ width: '100%', padding: 16, borderRadius: 14, marginTop: 20, fontSize: 14, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Looking up…' : 'Join trip'}
        </button>
      </div>
    </div>
  )
}
