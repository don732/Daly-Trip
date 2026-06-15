import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Minus, Plus, X } from 'lucide-react'
import { useTripStore } from '@/context/TripContext'
import { makeTripFromForm } from '@/engine/tripFactory'
import { getSession } from '@/lib/auth'
import { recordTripPayment, startCheckout, TRIP_PRICE } from '@/lib/checkout'
import type { TeamKey, Trip, TripBuilderForm } from '@/types/trip'
import { c, flowInput } from '@/styles'
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
    skinsStake: 5
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
        padding: '24px 16px',
        background: c.bg
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: '100%',
          background: c.card,
          border: `2px solid ${c.goldBright}`,
          borderRadius: 24,
          padding: '24px 22px 32px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 12px 48px rgba(13,31,60,.22)'
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function TripBuilderFlow() {
  const navigate = useNavigate()
  const { upsertTrip } = useTripStore()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<TripBuilderForm>(defaultForm)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [createdTrip, setCreatedTrip] = useState<Trip | null>(null)
  const [invited, setInvited] = useState(false)
  const [starterLine, setStarterLine] = useState('')

  const total = useMemo(() => form.headcount * TRIP_PRICE, [form.headcount])
  const stepLabel = STEPS[step] || ''
  const canCreate = form.name.trim().length > 0

  const setHeadcount = (n: number) => {
    const count = Math.max(2, Math.min(24, n))
    setForm(f => ({ ...f, headcount: count }))
  }

  const createTrip = async () => {
    const players = Array.from({ length: form.headcount }, (_, i) => ({
      nick: i === 0 ? 'Organizer' : `Player ${i + 1}`,
      hcp: 18,
      team: (i % 2 === 0 ? 'pine' : 'sand') as TeamKey,
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
      rounds: [{ course: form.location || form.name || 'Round 1', name: 'Round 1' }]
    })
    upsertTrip(trip)
    if (paid) {
      const session = await getSession()
      await recordTripPayment({
        tripId: trip.id,
        userId: session?.user?.id || null,
        amount: form.headcount * TRIP_PRICE,
        sessionId: `local_${trip.id}`,
        status: 'paid'
      })
    }
    setCreatedTrip(trip)
    setStep(3)
  }

  const handlePay = async () => {
    setPaying(true)
    const result = await startCheckout('new', form.headcount)
    setPaid(result.paid)
    setPaying(false)
    setStep(2)
  }

  const inviteCrew = () => {
    if (!createdTrip) return
    const joinUrl = `https://dalytrips.com/join?code=${createdTrip.code}`
    const text = `${createdTrip.name}\nJoin code: ${createdTrip.code}\n${joinUrl}\nGet the app: https://dalytrips.app`
    if (navigator.share) navigator.share({ title: 'Daly Trips', text }).catch(() => undefined)
    else navigator.clipboard.writeText(text).catch(() => undefined)
    setInvited(true)
    setStarterLine(INVITE_LINES[Math.floor(Math.random() * INVITE_LINES.length)])
  }

  return shellCard(
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div className="dt-display" style={{ fontSize: 22, fontWeight: 900, color: c.creamSoft }}>
            {step < 3 ? 'New Event' : "You're in"}
          </div>
          {step < 3 ? (
            <div className="dt-cond" style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>
              Step {step + 1} of 3 · {stepLabel}
            </div>
          ) : null}
        </div>
        <button
          onClick={() => (step > 0 && step < 3 ? setStep(step - 1) : navigate('/'))}
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

      {step < 3 ? (
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 99,
                background: i < step ? c.gold : i === step ? c.goldBright : c.line
              }}
            />
          ))}
        </div>
      ) : null}

      {step === 0 ? (
        <div style={{ textAlign: 'center' }}>
          <div className="dt-display" style={{ fontSize: 26, fontWeight: 900, color: c.creamSoft, marginBottom: 6 }}>
            How many players?
          </div>
          <div className="dt-cond" style={{ fontSize: 13, color: c.muted, marginBottom: 32 }}>
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
                background: c.cardDeep,
                border: `2px solid ${c.line}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Minus size={24} color={c.cream} />
            </button>
            <div
              className="dt-num"
              style={{ minWidth: 100, textAlign: 'center', fontSize: 88, fontWeight: 900, color: c.creamSoft, lineHeight: 1 }}
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
                border: `2px solid ${c.creamSoft}`,
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
                  border: `1.5px solid ${form.headcount === n ? c.gold : c.line}`,
                  background: form.headcount === n ? c.gold : c.cardDeep,
                  color: form.headcount === n ? c.ink : c.cream
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
                border: `2px solid ${c.creamSoft}`,
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
          <div className="dt-cond" style={{ fontSize: 22, fontWeight: 900, color: c.creamSoft, marginBottom: 6 }}>
            Unlock your trip
          </div>
          <div style={{ fontSize: 13.5, color: c.muted, marginBottom: 24, lineHeight: 1.5 }}>
            One-time fee for the organizer. Every player&apos;s scoring, money, and bets — covered for the whole trip.
          </div>
          <div
            style={{
              padding: '22px 18px',
              marginBottom: 20,
              textAlign: 'center',
              background: c.cardFeature,
              border: `2px solid ${c.goldBright}`,
              borderRadius: 16
            }}
          >
            <div className="dt-num" style={{ fontSize: 56, fontWeight: 900, color: c.creamSoft }}>
              ${total}
            </div>
            <div className="dt-cond" style={{ fontSize: 13, color: c.muted, marginTop: 4 }}>
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
          <div style={{ fontSize: 11, color: c.muted, lineHeight: 1.6, marginTop: 12, textAlign: 'center' }}>
            Secure payment · Organizer pays once · Players join free
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="dt-cond" style={{ fontSize: 22, fontWeight: 900, color: c.creamSoft, marginBottom: 2 }}>
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
              disabled={!canCreate}
              className="dt-btn dt-glow dt-press"
              style={{
                flex: 1,
                padding: 15,
                borderRadius: 14,
                cursor: 'pointer',
                background: canCreate ? c.gold : 'rgba(154,124,26,.3)',
                border: 'none',
                color: canCreate ? c.creamSoft : 'rgba(7,18,12,.5)',
                opacity: canCreate ? 1 : 0.7
              }}
            >
              <span className="dt-cond" style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: '.04em' }}>
                CREATE EVENT
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 && createdTrip ? (
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
  )
}
