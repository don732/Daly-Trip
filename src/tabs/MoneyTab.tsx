import { useMemo } from 'react'
import { computeSettlements } from '@/engine/money'
import type { Trip } from '@/types/trip'
import { c } from '@/styles'
import { DollarSign } from 'lucide-react'

export function MoneyTab({ trip }: { trip: Trip }) {
  const lines = useMemo(() => computeSettlements(trip), [trip])
  const total = lines.reduce((s, l) => s + l.amount, 0)
  const nick = (id: string) => trip.players.find(p => p.id === id)?.nick || id

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
            <span key={g.id} style={{ padding: '6px 10px', borderRadius: 99, background: 'rgba(255,255,255,.05)', border: `1px solid ${c.line}`, fontSize: 12, color: c.cream }}>
              {g.label} · ${g.stake}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div className="dt-cond" style={{ fontSize: 11, letterSpacing: '.12em', color: c.gold, textTransform: 'uppercase' }}>
          Settle up · ${Math.round(total)}
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

      <div className="dt-card" style={{ padding: 14, marginTop: 14 }}>
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
