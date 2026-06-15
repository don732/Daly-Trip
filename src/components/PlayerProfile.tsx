import { buildLeaderboard } from '@/engine/scoring'
import type { Player, Trip } from '@/types/trip'
import { c, formatScore } from '@/styles'
import { X } from 'lucide-react'

export function PlayerProfile({ player, trip, onClose }: { player: Player; trip: Trip; onClose: () => void }) {
  const leaders = buildLeaderboard(trip)
  const row = leaders.find(l => l.id === player.id)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,.8)' }} onClick={onClose}>
      <div
        className="dt-card-gold dt-fade-in"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: 440,
          padding: 24,
          maxHeight: '85vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 22, color: c.cream }}>{player.nick}</h3>
            <p style={{ margin: '4px 0 0', color: c.muted, fontSize: 13 }}>{player.name} · HCP {player.hcp}</p>
          </div>
          <button className="dt-btn" onClick={onClose} style={{ background: 'none', border: 'none', color: c.cream }}>
            <X size={20} />
          </button>
        </div>
        {row && row.thru > 0 ? (
          <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: c.surfaceSubtle }}>
            <span style={{ fontSize: 13, color: c.cream }}>
              This round: {formatScore(row.toParNet)} net · {formatScore(row.toPar)} gross thru {row.thru}
            </span>
          </div>
        ) : null}
        {player.strength ? <Row label="Strength" value={player.strength} /> : null}
        {player.weakness ? <Row label="Weakness" value={player.weakness} /> : null}
        {player.choke ? <Row label="Biggest choke" value={player.choke} /> : null}
        {player.record ? <Row label="Record" value={player.record} /> : null}
        {player.venmo ? <Row label="Venmo" value={player.venmo} /> : null}
        {player.badges?.length ? (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {player.badges.map(b => (
              <span key={b} style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(201,162,75,.12)', fontSize: 12, color: c.gold }}>
                {b}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.1em', color: c.muted, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 14, color: c.cream, marginTop: 4, lineHeight: 1.45 }}>{value}</div>
    </div>
  )
}
