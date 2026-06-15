import { buildLeaderboard } from '@/engine/scoring'
import { tripSkinsPot } from '@/engine/money'
import { starterRecap } from '@/lib/starter'
import type { Trip } from '@/types/trip'
import { c, formatScore } from '@/styles'
import { X } from 'lucide-react'

export function HighlightReel({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const leaders = buildLeaderboard(trip)
  const recap = starterRecap(trip, leaders)
  const top = [...leaders].sort((a, b) => a.toParNet - b.toParNet).slice(0, 5)
  const pot = tripSkinsPot(trip)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(0,0,0,.88)' }} onClick={onClose}>
      <div
        className="dt-card-gold dt-fade-in"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          inset: 'calc(40px + env(safe-area-inset-top)) 16px calc(40px + env(safe-area-inset-bottom))',
          maxWidth: 448,
          margin: '0 auto',
          padding: 24,
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="dt-cond" style={{ fontSize: 11, letterSpacing: '.14em', color: c.gold, textTransform: 'uppercase' }}>
            Trip Movie
          </div>
          <button className="dt-btn" onClick={onClose} style={{ background: 'none', border: 'none', color: c.cream }}>
            <X size={20} />
          </button>
        </div>
        <h2 style={{ margin: '0 0 8px', color: c.cream, fontSize: 24 }}>{trip.name}</h2>
        <p style={{ margin: '0 0 16px', color: c.muted, fontSize: 14, lineHeight: 1.5 }}>{recap}</p>
        <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.12em', color: c.gold, marginBottom: 8 }}>
          Final net board
        </div>
        {top.map((row, i) => (
          <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${c.line}` }}>
            <span style={{ color: c.cream, fontWeight: 600 }}>{i + 1}. {row.nick}</span>
            <span className="dt-num" style={{ color: c.gold }}>{formatScore(row.toParNet)}</span>
          </div>
        ))}
        <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: c.surfaceSubtle, color: c.muted, fontSize: 13 }}>
          Skins across {trip.rounds.length} round{trip.rounds.length === 1 ? '' : 's'} · ${pot} total pot
        </div>
      </div>
    </div>
  )
}
