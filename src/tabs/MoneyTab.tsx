import { useMemo, useState, type CSSProperties } from 'react'
import { computeSettlements, tripSkinsPot } from '@/engine/money'
import { useTripStore } from '@/context/TripContext'
import { generateSettleFeedPost } from '@/lib/starter'
import type { Trip } from '@/types/trip'
import { c } from '@/styles'
import { DollarSign, Plus, Share2 } from 'lucide-react'

export function MoneyTab({ trip }: { trip: Trip }) {
  const { addSideBet, addFeedPost, getMyPlayerId } = useTripStore()
  const lines = useMemo(() => computeSettlements(trip), [trip])
  const total = lines.reduce((s, l) => s + l.amount, 0)
  const nick = (id: string) => trip.players.find(p => p.id === id)?.nick || id
  const [showBet, setShowBet] = useState(false)
  const [fromId, setFromId] = useState(trip.players[0]?.id || '')
  const [toId, setToId] = useState(trip.players[1]?.id || '')
  const [amount, setAmount] = useState(10)
  const [note, setNote] = useState('Side bet')
  const myPlayerId = getMyPlayerId(trip.id) || trip.players[0]?.id || 'starter'
  const myNick = trip.players.find(p => p.id === myPlayerId)?.nick || 'The Starter'

  const postSettleToFeed = () => {
    const body = generateSettleFeedPost(trip, lines)
    addFeedPost(body, myPlayerId, myNick)
  }

  const submitBet = () => {
    if (!fromId || !toId || fromId === toId || amount <= 0) return
    addSideBet({ from: fromId, to: toId, amount, note })
    setShowBet(false)
  }

  return (
    <div className="dt-fade-in" style={{ padding: '16px 16px 100px' }}>
      <div className="dt-card-gold" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <DollarSign size={18} color={c.gold} />
          <span className="dt-cond" style={{ fontSize: 11, letterSpacing: '.12em', color: c.gold, textTransform: 'uppercase' }}>
            Games & Action
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {trip.games.map(g => (
            <span key={g.id} style={{ padding: '6px 10px', borderRadius: 99, background: c.surfaceSubtle, border: `1px solid ${c.line}`, fontSize: 12, color: c.cream }}>
              {g.label} · ${g.stake}
            </span>
          ))}
        </div>
        <button
          className="dt-btn dt-btn-ghost"
          onClick={() => setShowBet(v => !v)}
          style={{ width: '100%', marginTop: 12, padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}
        >
          <Plus size={16} />
          Add side bet
        </button>
      </div>

      {showBet ? (
        <div className="dt-card" style={{ padding: 14, marginBottom: 14 }}>
          <select value={fromId} onChange={e => setFromId(e.target.value)} style={selectStyle}>
            {trip.players.map(p => (
              <option key={p.id} value={p.id}>{p.nick} pays</option>
            ))}
          </select>
          <select value={toId} onChange={e => setToId(e.target.value)} style={{ ...selectStyle, marginTop: 8 }}>
            {trip.players.map(p => (
              <option key={p.id} value={p.id}>{p.nick} receives</option>
            ))}
          </select>
          <input type="number" value={amount} min={1} onChange={e => setAmount(Number(e.target.value))} style={{ ...selectStyle, marginTop: 8 }} />
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note" style={{ ...selectStyle, marginTop: 8 }} />
          <button className="dt-btn dt-btn-gold" onClick={submitBet} style={{ width: '100%', marginTop: 10, padding: 10, borderRadius: 10 }}>
            Save bet
          </button>
        </div>
      ) : null}

      {trip.bets.length > 0 ? (
        <div style={{ marginBottom: 14 }}>
          {trip.bets.filter(b => !b.settled).map(b => (
            <div key={b.id} className="dt-card" style={{ padding: 12, marginBottom: 8, fontSize: 13, color: c.cream }}>
              {nick(b.from)} → {nick(b.to)} · ${b.amount} · {b.note}
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div className="dt-cond" style={{ fontSize: 11, letterSpacing: '.12em', color: c.gold, textTransform: 'uppercase' }}>
          Settle up · ${Math.round(total)} · trip skins ${tripSkinsPot(trip)}
        </div>
        <div className="dt-cond" style={{ fontSize: 11, color: c.muted }}>
          {lines.length} request{lines.length === 1 ? '' : 's'}
        </div>
      </div>

      {lines.length === 0 ? (
        <div className="dt-card" style={{ padding: 24, textAlign: 'center', color: c.muted, fontSize: 13 }}>
          All square — for now.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lines.map((l, i) => (
            <div key={i} className="dt-card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: c.cream }}>
                <span style={{ fontWeight: 700 }}>{nick(l.from)}</span>
                <span style={{ color: c.muted }}> → </span>
                <span style={{ fontWeight: 700 }}>{nick(l.to)}</span>
              </div>
              <span className="dt-num" style={{ fontWeight: 800, color: c.gold }}>${l.amount}</span>
            </div>
          ))}
        </div>
      )}

      {lines.length > 0 ? (
        <button
          className="dt-btn dt-btn-ghost"
          onClick={postSettleToFeed}
          style={{
            width: '100%',
            marginTop: 14,
            marginBottom: 14,
            padding: 14,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '.06em',
            border: `1.5px solid ${c.gold}`,
            background: 'transparent',
            color: c.gold
          }}
        >
          <Share2 size={16} />
          POST TO THE FEED
        </button>
      ) : null}

      <div className="dt-card" style={{ padding: 14, marginTop: lines.length > 0 ? 0 : 14 }}>
        <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.12em', color: c.muted, textTransform: 'uppercase', marginBottom: 10 }}>
          Venmo handles
        </div>
        {trip.players.map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${c.line}` }}>
            <span style={{ color: c.cream }}>{p.nick}</span>
            <span style={{ color: c.muted }}>{p.venmo || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const selectStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 10,
  borderRadius: 10,
  border: `1px solid ${c.line}`,
  background: c.cardDeep,
  color: c.cream,
  fontSize: 14
}
