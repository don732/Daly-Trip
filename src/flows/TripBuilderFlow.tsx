import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, CreditCard, Plus, Trash2 } from 'lucide-react'
import { useTripStore } from '@/context/TripContext'
import { makeTripFromForm } from '@/engine/tripFactory'
import { getSession } from '@/lib/auth'
import { recordTripPayment, startCheckout, TRIP_PRICE } from '@/lib/checkout'
import type { TeamKey, TripBuilderForm } from '@/types/trip'
import { c } from '@/styles'
import { Modal, SheetHeader } from '@/components/Modal'
import { CoursePicker } from '@/components/CoursePicker'

const STEPS = ['Players', 'Pay', 'Event Details'] as const

function defaultForm(): TripBuilderForm {
  return {
    name: '',
    location: '',
    start: new Date().toISOString().slice(0, 10),
    end: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    headcount: 4,
    players: Array.from({ length: 4 }, (_, i) => ({
      nick: i === 0 ? 'Organizer' : `Player ${i + 1}`,
      hcp: 18,
      team: (i % 2 === 0 ? 'pine' : 'sand') as TeamKey,
      venmo: ''
    })),
    rounds: [{ name: 'Round 1', courseName: 'Black Cypress National' }],
    mode: 'indiv',
    format: 'stroke',
    stake: 0,
    skinsOn: true,
    skinsStake: 5
  }
}

export function TripBuilderFlow() {
  const navigate = useNavigate()
  const { upsertTrip } = useTripStore()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<TripBuilderForm>(defaultForm)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)

  const total = useMemo(() => form.headcount * TRIP_PRICE, [form.headcount])

  const syncHeadcount = (count: number) => {
    const n = Math.max(2, Math.min(12, count))
    const players = Array.from({ length: n }, (_, i) => {
      const existing = form.players[i]
      return (
        existing || {
          nick: i === 0 ? 'Organizer' : `Player ${i + 1}`,
          hcp: 18,
          team: (i % 2 === 0 ? 'pine' : 'sand') as TeamKey,
          venmo: ''
        }
      )
    })
    setForm(f => ({ ...f, headcount: n, players }))
  }

  const finish = async () => {
    const trip = makeTripFromForm({
      name: form.name || 'Untitled Trip',
      location: form.location,
      start: form.start,
      end: form.end,
      players: form.players.map(p => ({ nick: p.nick, hcp: p.hcp, team: p.team, venmo: p.venmo })),
      paid: paid,
      mode: form.mode,
      gameFormat: form.format,
      stake: form.stake,
      skins: form.skinsOn,
      skinsStake: form.skinsStake,
      rounds: form.rounds.map(r => ({ course: r.courseName, name: r.name }))
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
    navigate(`/trip/${trip.id}`)
  }

  const handlePay = async () => {
    setPaying(true)
    const result = await startCheckout('new', form.headcount)
    setPaid(result.paid)
    setPaying(false)
    setStep(2)
  }

  return (
    <div className="dt-root dt-fade-in" style={{ minHeight: '100%', background: c.bg }}>
      <div className="dt-shell" style={{ padding: 'calc(20px + env(safe-area-inset-top)) 20px 40px' }}>
        <button
          className="dt-btn"
          onClick={() => (step > 0 ? setStep(step - 1) : navigate('/'))}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', color: c.muted, padding: 0, marginBottom: 20 }}
        >
          <ArrowLeft size={18} />
          {step > 0 ? STEPS[step - 1] : 'Welcome'}
        </button>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {STEPS.map((label, i) => (
            <div
              key={label}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 99,
                background: i <= step ? c.gold : 'rgba(255,255,255,.08)'
              }}
            />
          ))}
        </div>

        <h2 style={{ margin: '0 0 4px', fontSize: 24, color: c.cream }}>{STEPS[step]}</h2>
        <p className="dt-cond" style={{ margin: '0 0 20px', fontSize: 11, color: c.gold, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          Step {step + 1} of {STEPS.length}
        </p>

        {step === 0 ? (
          <div>
            <label style={{ display: 'block', fontSize: 12, color: c.muted, marginBottom: 8 }}>Players</label>
            <input
              type="number"
              min={2}
              max={12}
              value={form.headcount}
              onChange={e => syncHeadcount(Number(e.target.value))}
              style={inputStyle}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              {form.players.map((p, i) => (
                <div key={i} className="dt-card" style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 72px 80px', gap: 8 }}>
                  <input
                    value={p.nick}
                    onChange={e => {
                      const players = [...form.players]
                      players[i] = { ...players[i], nick: e.target.value }
                      setForm(f => ({ ...f, players }))
                    }}
                    placeholder="Nickname"
                    style={{ ...inputStyle, margin: 0 }}
                  />
                  <input
                    type="number"
                    value={p.hcp}
                    onChange={e => {
                      const players = [...form.players]
                      players[i] = { ...players[i], hcp: Number(e.target.value) }
                      setForm(f => ({ ...f, players }))
                    }}
                    style={{ ...inputStyle, margin: 0 }}
                  />
                  <select
                    value={p.team}
                    onChange={e => {
                      const players = [...form.players]
                      players[i] = { ...players[i], team: e.target.value as TeamKey }
                      setForm(f => ({ ...f, players }))
                    }}
                    style={{ ...inputStyle, margin: 0 }}
                  >
                    <option value="pine">Pine</option>
                    <option value="sand">Sand</option>
                  </select>
                  <input
                    value={p.venmo}
                    onChange={e => {
                      const players = [...form.players]
                      players[i] = { ...players[i], venmo: e.target.value }
                      setForm(f => ({ ...f, players }))
                    }}
                    placeholder={i === 0 ? 'Your Venmo @handle' : 'Venmo (optional)'}
                    style={{ ...inputStyle, margin: 0, gridColumn: '1 / -1' }}
                  />
                </div>
              ))}
            </div>
            <button className="dt-btn dt-btn-gold" onClick={() => setStep(1)} style={btnStyle}>
              Continue
            </button>
          </div>
        ) : null}

        {step === 1 ? (
          <div>
            <div className="dt-card-gold" style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
              <CreditCard size={32} color={c.gold} style={{ marginBottom: 12 }} />
              <div className="dt-num" style={{ fontSize: 36, fontWeight: 800, color: c.cream }}>
                ${total}
              </div>
              <p style={{ margin: '8px 0 0', color: c.muted, fontSize: 13 }}>
                ${TRIP_PRICE}/head × {form.headcount} players — unlocks the full trip
              </p>
            </div>
            <button
              className="dt-btn dt-btn-gold dt-glow"
              disabled={paying}
              onClick={handlePay}
              style={{ ...btnStyle, opacity: paying ? 0.6 : 1 }}
            >
              {paying ? 'Processing…' : 'Pay with Apple Pay'}
            </button>
            <button className="dt-btn dt-btn-ghost" onClick={() => { setPaid(true); setStep(2) }} style={{ ...btnStyle, marginTop: 10 }}>
              Skip for now
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <Field label="Trip name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <Field label="Location" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Start" value={form.start} type="date" onChange={v => setForm(f => ({ ...f, start: v }))} />
              <Field label="End" value={form.end} type="date" onChange={v => setForm(f => ({ ...f, end: v }))} />
            </div>

            <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.12em', color: c.muted, textTransform: 'uppercase', margin: '16px 0 8px' }}>
              Rounds
            </div>
            {form.rounds.map((r, ri) => (
              <div key={ri} className="dt-card" style={{ padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <input
                    value={r.name}
                    onChange={e => {
                      const rounds = [...form.rounds]
                      rounds[ri] = { ...rounds[ri], name: e.target.value }
                      setForm(f => ({ ...f, rounds }))
                    }}
                    style={{ ...inputStyle, margin: 0, flex: 1 }}
                  />
                  {form.rounds.length > 1 ? (
                    <button
                      className="dt-btn"
                      onClick={() => setForm(f => ({ ...f, rounds: f.rounds.filter((_, j) => j !== ri) }))}
                      style={{ marginLeft: 8, padding: 8, background: 'transparent', color: c.muted, border: 'none' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
                <CoursePicker
                  value={r.courseName}
                  onChange={v => {
                    const rounds = [...form.rounds]
                    rounds[ri] = { ...rounds[ri], courseName: v }
                    setForm(f => ({ ...f, rounds }))
                  }}
                />
              </div>
            ))}
            <button
              className="dt-btn dt-btn-ghost"
              onClick={() =>
                setForm(f => ({
                  ...f,
                  rounds: [...f.rounds, { name: `Round ${f.rounds.length + 1}`, courseName: '' }]
                }))
              }
              style={{ width: '100%', padding: 10, borderRadius: 10, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}
            >
              <Plus size={16} />
              Add round
            </button>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <label style={{ flex: 1, fontSize: 12, color: c.muted }}>
                Format
                <select
                  value={form.format}
                  onChange={e => setForm(f => ({ ...f, format: e.target.value as TripBuilderForm['format'] }))}
                  style={{ ...inputStyle, marginTop: 6 }}
                >
                  <option value="stroke">Stroke</option>
                  <option value="bestball">Best ball</option>
                  <option value="stableford">Stableford</option>
                  <option value="scramble">Scramble</option>
                </select>
              </label>
              <label style={{ flex: 1, fontSize: 12, color: c.muted }}>
                Skins
                <select
                  value={form.skinsOn ? 'on' : 'off'}
                  onChange={e => setForm(f => ({ ...f, skinsOn: e.target.value === 'on' }))}
                  style={{ ...inputStyle, marginTop: 6 }}
                >
                  <option value="on">On</option>
                  <option value="off">Off</option>
                </select>
              </label>
            </div>
            <label style={{ display: 'block', fontSize: 12, color: c.muted, marginTop: 8 }}>
              Skins stake per hole
              <input
                type="number"
                min={0}
                value={form.skinsStake}
                disabled={!form.skinsOn}
                onChange={e => setForm(f => ({ ...f, skinsStake: Number(e.target.value) }))}
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </label>
            <button className="dt-btn dt-btn-gold dt-glow" onClick={finish} disabled={!form.name.trim()} style={btnStyle}>
              Launch trip
              <ChevronRight size={18} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text'
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label style={{ display: 'block', fontSize: 12, color: c.muted, marginBottom: 12 }}>
      {label}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
    </label>
  )
}

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 12,
  borderRadius: 12,
  border: `1px solid ${c.line}`,
  background: c.card,
  color: c.cream,
  fontSize: 14
}

const btnStyle: CSSProperties = {
  width: '100%',
  padding: 16,
  borderRadius: 14,
  marginTop: 20,
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

export function TripBuilderModal({ onClose, onCreated }: { onClose: () => void; onCreated: (tripId: string) => void }) {
  const { upsertTrip } = useTripStore()
  const [form, setForm] = useState(defaultForm())

  const finish = () => {
    const trip = makeTripFromForm({
      name: form.name,
      location: form.location,
      start: form.start,
      end: form.end,
      players: form.players.map(p => ({ nick: p.nick, hcp: p.hcp, team: p.team })),
      paid: true,
      mode: form.mode,
      gameFormat: form.format,
      stake: form.stake,
      skins: form.skinsOn,
      skinsStake: form.skinsStake,
      rounds: form.rounds.map(r => ({ course: r.courseName, name: r.name }))
    })
    upsertTrip(trip)
    onCreated(trip.id)
    onClose()
  }

  return (
    <Modal onClose={onClose} center>
      <div style={{ background: 'linear-gradient(170deg, #0D2B1F, #06170F)', borderRadius: 24, padding: '24px 24px 36px', maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${c.goldDim}` }}>
        <SheetHeader title="Quick trip" onClose={onClose} />
        <Field label="Trip name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <Field label="Location" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} />
        <label style={{ display: 'block', fontSize: 12, color: c.muted, marginBottom: 12 }}>
          Course
          <div style={{ marginTop: 6 }}>
            <CoursePicker
              value={form.rounds[0]?.courseName || ''}
              onChange={v =>
                setForm(f => ({
                  ...f,
                  rounds: [{ ...f.rounds[0], courseName: v, name: f.rounds[0]?.name || 'Round 1' }]
                }))
              }
            />
          </div>
        </label>
        <button className="dt-btn dt-btn-gold" onClick={finish} disabled={!form.name.trim()} style={{ width: '100%', padding: 14, borderRadius: 12, marginTop: 8 }}>
          Create
        </button>
      </div>
    </Modal>
  )
}
