import { useMemo, useState } from 'react'
import { buildLeaderboard, computeSkins, computeTeamBoard } from '@/engine/scoring'
import { totalTripMoney, tripSkinsPot } from '@/engine/money'
import type { Player, Trip } from '@/types/trip'
import { c, formatScore } from '@/styles'
import { ScoreChip } from '@/components/TabBar'

const VIEWS = ['Net', 'Gross', 'Skins $', 'Trip $', 'Teams'] as const

export function BoardTab({ trip, onPlayerClick }: { trip: Trip; onPlayerClick?: (player: Player) => void }) {
  const [view, setView] = useState<(typeof VIEWS)[number]>('Net')
  const leaders = useMemo(() => buildLeaderboard(trip), [trip])
  const skins = useMemo(() => computeSkins(trip), [trip])
  const money = useMemo(() => totalTripMoney(trip), [trip])
  const teams = useMemo(() => computeTeamBoard(trip), [trip])

  const sorted = useMemo(() => {
    const copy = [...leaders]
    if (view === 'Gross') return copy.sort((a, b) => a.toPar - b.toPar)
    if (view === 'Skins $' || view === 'Trip $') return copy.sort((a, b) => (money[b.id] || 0) - (money[a.id] || 0))
    return copy.sort((a, b) => a.toParNet - b.toParNet)
  }, [leaders, view, money])

  return (
    <div className="dt-fade-in" style={{ padding: '16px 16px 100px' }}>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16 }}>
        {VIEWS.map(v => (
          <button
            key={v}
            className="dt-btn"
            onClick={() => setView(v)}
            style={{
              flex: '0 0 auto',
              padding: '8px 14px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.04em',
              background: view === v ? c.surfaceGoldStrong : c.card,
              border: view === v ? `1px solid ${c.goldDim}` : `1px solid ${c.line}`,
              color: view === v ? c.gold : c.muted
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {view === 'Teams' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <TeamCard name={trip.teams.pine.name} color={trip.teams.pine.color} total={teams.pine} players={trip.players.filter(p => trip.teams.pine.ids.includes(p.id))} />
          <TeamCard name={trip.teams.sand.name} color={trip.teams.sand.color} total={teams.sand} players={trip.players.filter(p => trip.teams.sand.ids.includes(p.id))} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((row, i) => (
            <div
              key={row.id}
              className="dt-card"
              style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: onPlayerClick ? 'pointer' : 'default' }}
              onClick={() => {
                const player = trip.players.find(p => p.id === row.id)
                if (player && onPlayerClick) onPlayerClick(player)
              }}
            >
              <span className="dt-num" style={{ width: 22, color: c.muted, fontWeight: 700 }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: c.cream, fontSize: 14 }}>{row.nick}</div>
                <div style={{ fontSize: 11, color: c.muted }}>Thru {row.thru || 0}</div>
              </div>
              {view === 'Skins $' || view === 'Trip $' ? (
                <span className="dt-num" style={{ fontWeight: 800, color: (money[row.id] || 0) >= 0 ? c.green : c.red }}>
                  {(money[row.id] || 0) >= 0 ? '+' : ''}${Math.abs(money[row.id] || 0)}
                </span>
              ) : (
                <ScoreChip toPar={view === 'Gross' ? row.toPar : row.toParNet} />
              )}
            </div>
          ))}
        </div>
      )}

      {view === 'Skins $' ? (
        <div className="dt-card" style={{ padding: 12, marginTop: 12, fontSize: 12, color: c.muted }}>
          Active round pot ${skins.pot}{skins.carry ? ` · ${skins.carry} carrying` : ''} · Trip total ${tripSkinsPot(trip)}
        </div>
      ) : null}
    </div>
  )
}

function TeamCard({
  name,
  color,
  total,
  players
}: {
  name: string
  color: string
  total: number
  players: Array<{ nick: string; hcp: number }>
}) {
  return (
    <div className="dt-card" style={{ padding: 14, borderTop: `3px solid ${color}` }}>
      <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.12em', color, textTransform: 'uppercase' }}>{name}</div>
      <div className="dt-num" style={{ fontSize: 24, fontWeight: 800, color: c.cream, margin: '8px 0' }}>{formatScore(total)}</div>
      {players.map(p => (
        <div key={p.nick} style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>
          {p.nick} · {p.hcp}
        </div>
      ))}
    </div>
  )
}
