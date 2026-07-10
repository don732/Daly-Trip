import { useState } from 'react'
import { buildLeaderboard } from '@/engine/scoring'
import { generateRoastAsync } from '@/lib/starter'
import type { Player, Trip } from '@/types/trip'
import { c, formatScore } from '@/styles'
import { Flame, X } from 'lucide-react'

function StatChip({ label, val, col }: { label: string; val: string; col?: string }) {
  return (
    <div className="dt-card" style={{ padding: 12, textAlign: 'center' }}>
      <div className="dt-num" style={{ fontSize: 20, fontWeight: 600, color: col || c.creamSoft }}>
        {val}
      </div>
      <div className="dt-cond" style={{ fontSize: 9.5, letterSpacing: '.1em', color: c.muted, marginTop: 2 }}>
        {label}
      </div>
    </div>
  )
}

export function PlayerProfile({
  player,
  trip,
  onClose,
  onRoast
}: {
  player: Player
  trip: Trip
  onClose: () => void
  onRoast?: (body: string) => void
}) {
  const [cooking, setCooking] = useState(false)
  const [roastText, setRoastText] = useState<string | null>(null)
  const leaders = buildLeaderboard(trip)
  const row = leaders.find(l => l.id === player.id)
  const roastLabel = (player.nick.split(' ').pop() || player.nick).toUpperCase()

  const roast = async () => {
    if (!onRoast || cooking) return
    setCooking(true)
    setRoastText(null)
    try {
      const body = await generateRoastAsync(player, trip)
      setRoastText(body)
      onRoast(body)
    } finally {
      setCooking(false)
    }
  }

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
            <p style={{ margin: '4px 0 0', color: c.muted, fontSize: 13 }}>
              {player.name} · HCP {player.hcp}
              {player.club ? ` · ${player.club}` : ''}
            </p>
          </div>
          <button className="dt-btn" onClick={onClose} style={{ background: 'none', border: 'none', color: c.cream }}>
            <X size={20} />
          </button>
        </div>

        {row && row.thru > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
            <StatChip label="Net" val={formatScore(row.toParNet)} col={row.toParNet < 0 ? c.win : c.red} />
            {player.record ? <StatChip label="Record" val={player.record} /> : <StatChip label="Thru" val={String(row.thru)} />}
            {player.winnings != null ? (
              <StatChip label="Winnings" val={`$${player.winnings.toLocaleString()}`} col={c.gold} />
            ) : (
              <StatChip label="Gross" val={formatScore(row.toPar)} />
            )}
          </div>
        ) : null}

        {player.strength ? <Row label="Strength" value={player.strength} /> : null}
        {player.weakness ? <Row label="Weakness" value={player.weakness} /> : null}
        {player.choke ? <Row label="Biggest choke" value={player.choke} /> : null}
        {!row?.thru && player.record ? <Row label="Record" value={player.record} /> : null}
        {player.winnings != null && !row?.thru ? (
          <Row label="Lifetime winnings" value={`$${player.winnings.toLocaleString()}`} />
        ) : null}
        {player.rival ? <Row label="Rival" value={player.rival} /> : null}
        {player.venmo ? <Row label="Venmo" value={player.venmo} /> : null}
        {player.badges?.length ? (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {player.badges.map(b => (
              <span
                key={b}
                style={{
                  padding: '4px 10px',
                  borderRadius: 99,
                  background: c.surfaceGold,
                  fontSize: 12,
                  color: c.gold
                }}
              >
                {b}
              </span>
            ))}
          </div>
        ) : null}
        {roastText ? (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 12,
              background: 'rgba(220,38,38,.08)',
              border: `1px solid ${c.red}`,
              fontSize: 14,
              color: c.cream,
              lineHeight: 1.5,
              fontStyle: 'italic'
            }}
          >
            &quot;{roastText}&quot;
          </div>
        ) : null}
        {onRoast ? (
          <button
            className="dt-btn dt-glow dt-press"
            onClick={roast}
            disabled={cooking}
            style={{
              width: '100%',
              marginTop: 20,
              padding: 12,
              borderRadius: 12,
              cursor: cooking ? 'default' : 'pointer',
              opacity: cooking ? 0.6 : 1,
              background: 'rgba(220,38,38,.14)',
              border: `1px solid ${c.red}`,
              color: '#FCA5A5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Flame size={15} />
            <span className="dt-cond" style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.05em' }}>
              {cooking ? 'THE STARTER IS COOKING…' : `ROAST ${roastLabel} (AI)`}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.1em', color: c.muted, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: c.cream, marginTop: 4, lineHeight: 1.45 }}>{value}</div>
    </div>
  )
}
