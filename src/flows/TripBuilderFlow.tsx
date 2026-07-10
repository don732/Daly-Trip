import { useMemo, useState, useEffect, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Minus, Plus, X } from 'lucide-react'
import { AuthGate } from '@/components/AuthGate'
import { CoursePicker } from '@/components/CoursePicker'
import { useTripStore } from '@/context/TripContext'
import { makeTripFromForm } from '@/engine/tripFactory'
import { registerTripOrganizer, pushTripToCloud, getSupabase } from '@/cloudStore'
import { ensureProfile, getSession } from '@/lib/auth'
import { recordTripPayment, startCheckout, TRIP_PRICE, verifyCheckout } from '@/lib/checkout'
import { FORMAT_OPTIONS } from '@/engine/formats'
import type { Trip, TripBuilderForm } from '@/types/trip'
import { c, flowInput, flowShell } from '@/styles'
const STEPS = ['Players', 'Pay', 'Event Details'] as const
const PRESETS = [4, 6, 8, 10, 12, 16] as const

const INVITE_LINES = [
  'The crew has been summoned. Handicaps are already being disputed.',
  'Your trip is live. Someone will sandbag. It might be you.',
  'Invites out. The Starter is sharpening the roasts.',
  'Links sent. May the worst putter buy the first round.'
]

function defaultForm(): TripBuilderForm {
  return {
    name: '',
    location: '',
    start: new Date().toISOString().slice(0, 10),
    end: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    headcount: 4,
    players: [],
    rounds: [{ name: 'Round 1', courseName: '' }],
    mode: 'indiv',
    format: 'stroke',
    stake: 0,
    skinsOn: true,
    skinsStake: 5,
    nassauOn: false,
    nassauStake: 10,
    snakeOn: false,
    snakeStake: 1,
    ctpOn: false,
    ctpStake: 5,
    pressOn: false,
    pressStake: 5
  }
}

function shellCard(children: ReactNode) {
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
      <div style={{ maxWidth: 440, width: '100%', ...flowShell }}>{children}</div>
    </div>
  )
}

export function TripBuilderFlow() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { upsertTrip, setMyPlayerId } = useTripStore()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<TripBuilderForm>(defaultForm)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [payError, setPayError] = useState('')
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null)
  const [createdTrip, setCreatedTrip] = useState<Trip | null>(null)
  const [invited, setInvited] = useState(false)
  const [starterLine, setStarterLine] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    const status = searchParams.get('checkout')
    const sessionId = searchParams.get('session_id')
    if (status === 'cancel') {
      setPayError('Payment cancelled')
      setSearchParams({})
      return
    }
    if (status !== 'success' || !sessionId) return

    let cancelled = false
    setPaying(true)
    verifyCheckout(sessionId).then(result => {
      if (cancelled) return
      setPaying(false)
      if (result.paid) {
        setPaid(true)
        setCheckoutSessionId(result.sessionId || sessionId)
        const storedHeadcount = sessionStorage.getItem('dt_checkout_headcount')
        if (result.headcount) setForm(prev => ({ ...prev, headcount: result.headcount! }))
        else if (storedHeadcount) setForm(prev => ({ ...prev, headcount: Number(storedHeadcount) || prev.headcount }))
        sessionStorage.removeItem('dt_checkout_headcount')
        setStep(2)
        setPayError('')
      } else {
        setPayError(result.error || 'Payment not completed')
      }
      setSearchParams({})
    })
    return () => {
      cancelled = true
    }
  }, [searchParams, setSearchParams])

  const total = useMemo(() => form.headcount * TRIP_PRICE, [form.headcount])
  const stepLabel = STEPS[step] || ''
  const canCreate = form.name.trim().length > 0

  const setHeadcount = (n: number) => {
    const count = Math.max(2, Math.min(24, n))
    setForm(f => ({ ...f, headcount: count }))
  }

  const createTrip = async () => {
    setCreating(true)
    setCreateError('')
    try {
      const players = Array.from({ length: form.headcount }, (_, i) => ({
        nick: `Player ${i + 1}`,
        hcp: 18,
        team: 'pine' as const,
        venmo: ''
      }))
      const trip = makeTripFromForm({
        name: form.name.trim(),
        location: form.location,
        start: form.start,
        end: form.end,
        players,
        paid,
        mode: form.mode,
        gameFormat: form.format,
        stake: form.stake,
        skins: form.skinsOn,
        skinsStake: form.skinsStake,
        nassau: form.nassauOn,
        nassauStake: form.nassauStake,
        snake: form.snakeOn,
        snakeStake: form.snakeStake,
        ctp: form.ctpOn,
        ctpStake: form.ctpStake,
        press: form.pressOn,
        pressStake: form.pressStake,
        rounds: form.rounds.map((r, i) => ({
          course: r.courseName || form.location || form.name || `Round ${i + 1}`,
          name: r.name || `Round ${i + 1}`
        }))
      })
      upsertTrip(trip)
      setMyPlayerId(trip.id, trip.players[0].id)

      if (getSupabase()) {
        const session = await getSession()
        if (!session?.user?.id) {
          throw new Error('Sign in required to create a synced trip')
        }
        await ensureProfile(session.user.id, session.user.email)
        await pushTripToCloud(trip)
        await registerTripOrganizer(trip.id, trip.players[0].id)
        if (paid) {
          await recordTripPayment({
            tripId: trip.id,
            userId: session.user.id,
            amount: form.headcount * TRIP_PRICE,
            sessionId: checkoutSessionId || `local_${trip.id}`,
            status: 'paid'
          })
        }
      }

      setCreatedTrip(trip)
      setStep(3)
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Could not create trip'
      setCreateError(message)
    } finally {
      setCreating(false)
    }
  }

  const handlePay = async () => {
    setPaying(true)
    setPayError('')
    const result = await startCheckout(form.headcount)
    if (result.redirectUrl) {
      sessionStorage.setItem('dt_checkout_headcount', String(form.headcount))
      window.location.href = result.redirectUrl
      return
    }
    setPaying(false)
    if (!result.ok) {
      setPayError(result.error || 'Payment failed')
      return
    }
    setPaid(result.paid)
    if (result.sessionId) setCheckoutSessionId(result.sessionId)
    if (result.paid) setStep(2)
  }

  const successStep = 3

  const inviteCrew = () => {
    if (!createdTrip) return
    const joinUrl = `https://dalytrips.com/join?code=${createdTrip.code}`
    const text = `${createdTrip.name}\nJoin code: ${createdTrip.code}\n${joinUrl}\nGet the app: https://dalytrips.app`
    if (navigator.share) navigator.share({ title: 'Daly Trips', text }).catch(() => undefined)
    else navigator.clipboard.writeText(text).catch(() => undefined)
    setInvited(true)
    setStarterLine(INVITE_LINES[Math.floor(Math.random() * INVITE_LINES.length)])
  }

  return (
    <AuthGate title="Organizer sign-in" subtitle="Sign in with your email before creating a trip. Your account becomes the organizer.">
      {shellCard(
        <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div className="dt-display" style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF' }}>
            {step < successStep ? 'New Event' : "You're in"}
          </div>
          {step < successStep ? (
            <div className="dt-cond" style={{ fontSize: 12, color: 'rgba(245,245,242,.55)', marginTop: 2 }}>
              Step {step + 1} of 3 · {stepLabel}
            </div>
          ) : null}
        </div>
        <button
          onClick={() => (step > 0 && step < successStep ? setStep(step - 1) : navigate('/'))}
          style={{
            background: 'none',
            border: `1.5px solid ${c.line}`,
            borderRadius: 999,
            cursor: 'pointer',
            padding: 6,
            display: 'flex'
          }}
        >
          <X size={18} color={c.muted} />
        </button>
      </div>

      {step < successStep ? (
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 99,
                background: i < step ? c.gold : i === step ? c.goldBright : 'rgba(245,245,242,.15)'
              }}
            />
          ))}
        </div>
      ) : null}

      {step === 0 ? (
        <div style={{ textAlign: 'center' }}>
          <div className="dt-display" style={{ fontSize: 26, fontWeight: 900, color: c.onDark, marginBottom: 6 }}>
            How many players?
          </div>
          <div className="dt-cond" style={{ fontSize: 13, color: c.onDarkMuted, marginBottom: 32 }}>
            You can add names and handicaps after you pay.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 28 }}>
            <button
              onClick={() => setHeadcount(form.headcount - 1)}
              className="dt-step"
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.08)',
                border: `2px solid rgba(200,16,46,0.25)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Minus size={24} color={c.onDark} />
            </button>
            <div
              className="dt-num"
              style={{ minWidth: 100, textAlign: 'center', fontSize: 88, fontWeight: 900, color: c.onDark, lineHeight: 1 }}
            >
              {form.headcount}
            </div>
            <button
              onClick={() => setHeadcount(form.headcount + 1)}
              className="dt-step"
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: c.gold,
                border: `2px solid ${c.goldBright}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Plus size={24} color="#FFFFFF" />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
            {PRESETS.map(n => (
              <button
                key={n}
                onClick={() => setHeadcount(n)}
                className="dt-btn dt-press"
                style={{
                  padding: '9px 16px',
                  borderRadius: 999,
                  cursor: 'pointer',
                  border: `1.5px solid ${form.headcount === n ? c.goldBright : 'rgba(200,16,46,0.25)'}`,
                  background: form.headcount === n ? c.gold : 'rgba(255,255,255,0.08)',
                  color: form.headcount === n ? c.ink : c.onDark
                }}
              >
                <span className="dt-cond" style={{ fontSize: 14, fontWeight: form.headcount === n ? 800 : 500 }}>
                  {n}
                </span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 28 }}>
            <button
              onClick={() => setStep(1)}
              className="dt-btn dt-glow dt-press"
              style={{
                width: '100%',
                padding: 15,
                borderRadius: 14,
                cursor: 'pointer',
                background: c.gold,
                border: `2px solid ${c.goldBright}`,
                color: c.ink
              }}
            >
              <span className="dt-cond" style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: '.04em' }}>
                NEXT →
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div>
          <div className="dt-cond" style={{ fontSize: 22, fontWeight: 900, color: c.onDark, marginBottom: 6 }}>
            Unlock your trip
          </div>
          <div style={{ fontSize: 13.5, color: c.onDarkMuted, marginBottom: 24, lineHeight: 1.5 }}>
            One-time fee for the organizer. Every player&apos;s scoring, money, and bets — covered for the whole trip.
          </div>
          <div
            style={{
              padding: '22px 18px',
              marginBottom: 20,
              textAlign: 'center',
              background: 'rgba(255,255,255,0.08)',
              border: `2px solid ${c.goldBright}`,
              borderRadius: 16
            }}
          >
            <div className="dt-num" style={{ fontSize: 56, fontWeight: 900, color: c.onDark }}>
              ${total}
            </div>
            <div className="dt-cond" style={{ fontSize: 13, color: c.onDarkMuted, marginTop: 4 }}>
              {form.headcount} players × ${TRIP_PRICE} · one-time
            </div>
          </div>
          <button
            onClick={handlePay}
            disabled={paying}
            className="dt-btn dt-glow dt-press"
            style={{
              width: '100%',
              padding: 18,
              borderRadius: 14,
              cursor: 'pointer',
              background: c.felt,
              border: `2px solid ${c.goldBright}`,
              color: c.ink,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: paying ? 0.7 : 1
            }}
          >
            <span className="dt-cond" style={{ fontSize: 15, fontWeight: 800, letterSpacing: '.06em' }}>
              {paying ? 'PROCESSING…' : `PAY $${total}`}
            </span>
          </button>
          {payError ? (
            <p style={{ margin: '12px 0 0', fontSize: 12, color: c.red, textAlign: 'center' }}>{payError}</p>
          ) : null}
          <div style={{ fontSize: 11, color: c.muted, lineHeight: 1.6, marginTop: 12, textAlign: 'center' }}>
            Secure payment · Organizer pays once · Players join free
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="dt-cond" style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF', marginBottom: 2 }}>
            Event details
          </div>
          {(
            [
              { label: 'EVENT NAME', key: 'name' as const, placeholder: 'Myrtle Beach 2026' },
              { label: 'LOCATION', key: 'location' as const, placeholder: 'Kiawah Island, SC' }
            ] as const
          ).map(({ label, key, placeholder }) => (
            <div key={key}>
              <div
                className="dt-cond"
                style={{ fontSize: 10.5, letterSpacing: '.14em', color: c.gold, fontWeight: 700, marginBottom: 7 }}
              >
                {label}
              </div>
              <input
                type="text"
                style={flowInput}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div>
            <div
              className="dt-cond"
              style={{ fontSize: 10.5, letterSpacing: '.14em', color: c.gold, fontWeight: 700, marginBottom: 7 }}
            >
              DATES
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="date"
                value={form.start}
                onChange={e => setForm(f => ({ ...f, start: e.target.value }))}
                style={{ ...flowInput, flex: 1, marginBottom: 0 }}
              />
              <span className="dt-cond" style={{ color: c.gold, flexShrink: 0, fontWeight: 700 }}>
                →
              </span>
              <input
                type="date"
                value={form.end}
                onChange={e => setForm(f => ({ ...f, end: e.target.value }))}
                style={{ ...flowInput, flex: 1, marginBottom: 0 }}
              />
            </div>
          </div>
          <div>
            <div className="dt-cond" style={{ fontSize: 10.5, letterSpacing: '.14em', color: c.gold, fontWeight: 700, marginBottom: 7 }}>
              COURSE
            </div>
            <CoursePicker
              value={form.rounds[0]?.courseName || form.location}
              onChange={name =>
                setForm(f => ({
                  ...f,
                  location: f.location || name,
                  rounds: f.rounds.map((r, i) => (i === 0 ? { ...r, courseName: name } : r))
                }))
              }
            />
          </div>
          <div>
            <div className="dt-cond" style={{ fontSize: 10.5, letterSpacing: '.14em', color: c.gold, fontWeight: 700, marginBottom: 7 }}>
              ROUNDS
            </div>
            {form.rounds.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  value={r.name}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      rounds: f.rounds.map((row, j) => (j === i ? { ...row, name: e.target.value } : row))
                    }))
                  }
                  placeholder={`Round ${i + 1}`}
                  style={{ ...flowInput, flex: 1, marginBottom: 0 }}
                />
                {i > 0 ? (
                  <button
                    type="button"
                    className="dt-btn"
                    onClick={() => setForm(f => ({ ...f, rounds: f.rounds.filter((_, j) => j !== i) }))}
                    style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${c.line}`, background: c.cardDeep, color: c.muted }}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              className="dt-btn"
              onClick={() =>
                setForm(f => ({
                  ...f,
                  rounds: [...f.rounds, { name: `Round ${f.rounds.length + 1}`, courseName: f.rounds[0]?.courseName || f.location }]
                }))
              }
              style={{ width: '100%', padding: 10, borderRadius: 10, border: `1.5px dashed ${c.line}`, background: 'transparent', color: c.gold, fontSize: 13, marginBottom: 12 }}
            >
              + Add round
            </button>
          </div>
          <div>
            <div className="dt-cond" style={{ fontSize: 10.5, letterSpacing: '.14em', color: c.gold, fontWeight: 700, marginBottom: 7 }}>
              FORMAT
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {(['indiv', 'teams'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, mode }))}
                  className="dt-btn"
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: `1.5px solid ${form.mode === mode ? c.gold : c.line}`,
                    background: form.mode === mode ? 'rgba(200,16,46,.14)' : 'rgba(255,255,255,0.08)',
                    color: c.cream,
                    fontSize: 13
                  }}
                >
                  {mode === 'indiv' ? 'Individual' : 'Teams'}
                </button>
              ))}
            </div>
            <select
              value={form.format}
              onChange={e => setForm(f => ({ ...f, format: e.target.value as TripBuilderForm['format'] }))}
              style={{ ...flowInput, marginBottom: 10 }}
            >
              {FORMAT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="dt-cond" style={{ fontSize: 10.5, letterSpacing: '.14em', color: c.gold, fontWeight: 700, marginBottom: 7 }}>
              GAMES
            </div>
            {(
              [
                { key: 'skinsOn' as const, stakeKey: 'skinsStake' as const, label: 'Skins', defaultStake: 5 },
                { key: 'nassauOn' as const, stakeKey: 'nassauStake' as const, label: 'Nassau (front / back / overall)', defaultStake: 10 },
                { key: 'pressOn' as const, stakeKey: 'pressStake' as const, label: 'Press (2× back nine)', defaultStake: 5 },
                { key: 'snakeOn' as const, stakeKey: 'snakeStake' as const, label: 'Snake (3-putts)', defaultStake: 1 },
                { key: 'ctpOn' as const, stakeKey: 'ctpStake' as const, label: 'CTP (par 3s)', defaultStake: 5 }
              ] as const
            ).map(({ key, stakeKey, label, defaultStake }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13, color: c.cream }}>
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                />
                {label}
                {form[key] ? (
                  <input
                    type="number"
                    min={1}
                    value={form[stakeKey]}
                    onChange={e => setForm(f => ({ ...f, [stakeKey]: Number(e.target.value) || defaultStake }))}
                    style={{ ...flowInput, width: 72, marginBottom: 0, padding: '6px 8px' }}
                  />
                ) : null}
              </label>
            ))}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep(1)}
              className="dt-btn dt-press"
              style={{
                flex: '0 0 auto',
                padding: '14px 18px',
                borderRadius: 12,
                cursor: 'pointer',
                background: 'rgba(13,31,60,.05)',
                border: `1.5px solid ${c.lineStrong}`,
                color: c.cream
              }}
            >
              <span className="dt-cond" style={{ fontSize: 13 }}>
                Back
              </span>
            </button>
            <button
              onClick={createTrip}
              disabled={!canCreate || creating}
              className="dt-btn dt-glow dt-press"
              style={{
                flex: 1,
                padding: 15,
                borderRadius: 14,
                cursor: canCreate && !creating ? 'pointer' : 'default',
                background: canCreate ? c.gold : 'rgba(154,124,26,.3)',
                border: 'none',
                color: canCreate ? c.creamSoft : 'rgba(7,18,12,.5)',
                opacity: canCreate && !creating ? 1 : 0.7
              }}
            >
              <span className="dt-cond" style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: '.04em' }}>
                {creating ? 'CREATING…' : 'CREATE EVENT'}
              </span>
            </button>
          </div>
          {createError ? (
            <p style={{ margin: '12px 0 0', fontSize: 12, color: c.red, textAlign: 'center' }}>{createError}</p>
          ) : null}
        </div>
      ) : null}

      {step === successStep && createdTrip ? (
        <div style={{ textAlign: 'center', paddingTop: 4 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🏌️</div>
          <div
            className="dt-display"
            style={{ fontSize: 26, fontWeight: 900, color: c.creamSoft, marginBottom: 4, lineHeight: 1.1 }}
          >
            {createdTrip.name}
          </div>
          <div className="dt-cond" style={{ fontSize: 13, color: c.muted, marginBottom: 20 }}>
            {form.headcount} players · code{' '}
            <span style={{ color: c.gold, fontWeight: 800 }}>{createdTrip.code}</span>
          </div>
          <button
            onClick={inviteCrew}
            className="dt-btn dt-glow dt-press"
            style={{
              width: '100%',
              padding: 18,
              borderRadius: 14,
              cursor: 'pointer',
              background: c.felt,
              border: `2px solid ${c.goldBright}`,
              color: c.ink,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 10
            }}
          >
            <span style={{ fontSize: 20 }}>📲</span>
            <span className="dt-cond" style={{ fontSize: 15, fontWeight: 800, letterSpacing: '.04em' }}>
              {invited ? 'INVITE SENT! 🎉' : 'INVITE THE CREW'}
            </span>
          </button>
          {invited && starterLine ? (
            <div
              style={{
                padding: '14px 16px',
                marginBottom: 14,
                textAlign: 'left',
                background: c.cardFeature,
                border: `1.5px solid ${c.goldBright}`,
                borderRadius: 14
              }}
            >
              <div
                className="dt-cond"
                style={{ fontSize: 10, letterSpacing: '.14em', color: c.gold, marginBottom: 5, fontWeight: 700 }}
              >
                THE STARTER
              </div>
              <div style={{ fontSize: 14, color: c.cream, lineHeight: 1.5, fontStyle: 'italic' }}>
                &quot;{starterLine}&quot;
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '14px 16px',
                marginBottom: 14,
                textAlign: 'left',
                background: c.cardDeep,
                border: `1.5px solid ${c.line}`,
                borderRadius: 14
              }}
            >
              <div
                className="dt-cond"
                style={{ fontSize: 10.5, letterSpacing: '.14em', color: c.gold, fontWeight: 700, marginBottom: 10 }}
              >
                NEXT STEPS
              </div>
              {['Invite the crew above', 'Add players and handicaps', 'Set up rounds and courses'].map((line, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    padding: '8px 0',
                    borderTop: i > 0 ? `1px solid ${c.line}` : 'none'
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: c.gold,
                      border: `2px solid ${c.cardWarm}`,
                      color: c.ink,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13.5, color: c.cream, fontWeight: 500 }}>{line}</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => navigate(`/trip/${createdTrip.id}`)}
            className="dt-btn dt-press"
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 14,
              cursor: 'pointer',
              background: 'rgba(13,31,60,.06)',
              border: `1.5px solid ${c.lineStrong}`,
              color: c.cream
            }}
          >
            <span className="dt-cond" style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.04em' }}>
              ENTER THE TRIP →
            </span>
          </button>
        </div>
      ) : null}
        </>
      )}
    </AuthGate>
  )
}
