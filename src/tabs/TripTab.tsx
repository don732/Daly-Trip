import { starterDailyDrop } from '@/lib/starter'
import { buildLeaderboard } from '@/engine/scoring'
import type { Trip } from '@/types/trip'
import { c, formatScore } from '@/styles'
import { ScoreChip } from '@/components/TabBar'
import { ShareQr } from '@/components/ShareQr'
import { MapPin, Play, Trophy } from 'lucide-react'

export function TripTab({
  trip,
  onRoundChange,
  onShowMovie
}: {
  trip: Trip
  onRoundChange: (index: number) => void
  onShowMovie?: () => void
}) {
  const leaders = buildLeaderboard(trip)
  const top = [...leaders].sort((a, b) => a.toParNet - b.toParNet).find(l => l.thru > 0)
  const drop = starterDailyDrop(trip, leaders)

  return (
    <div className="dt-fade-in" style={{ padding: '16px 16px 100px' }}>
      <div className="dt-card-gold" style={{ padding: 16, marginBottom: 14 }}>
        <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.14em', color: c.gold, textTransform: 'uppercase', marginBottom: 8 }}>
          The Starter · Daily drop
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: c.cream }}>{drop}</p>
      </div>

      <div className="dt-card" style={{ padding: 18, marginBottom: 14, background: 'linear-gradient(160deg,#0D2B1F 0%,#081912 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: c.cream }}>{trip.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: c.muted, fontSize: 12 }}>
              <MapPin size={14} />
              {trip.location || 'TBD'}
            </div>
          </div>
          <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.12em', color: c.gold, textAlign: 'right' }}>
            CODE
            <div className="dt-num" style={{ fontSize: 18, fontWeight: 800, color: c.cream, marginTop: 2 }}>{trip.code}</div>
          </div>
        </div>
        <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: `1px solid ${c.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={16} color={c.gold} />
            <span style={{ fontSize: 13, color: c.cream }}>
              {top ? `${top.nick} leads net ${formatScore(top.toParNet)} thru ${top.thru}` : 'Round ready — cards are open'}
            </span>
            {top ? <ScoreChip toPar={top.toParNet} /> : null}
          </div>
        </div>
      </div>

      <ShareQr code={trip.code} tripName={trip.name} />

      {onShowMovie ? (
        <button
          className="dt-btn dt-btn-ghost"
          onClick={onShowMovie}
          style={{ width: '100%', marginTop: 12, marginBottom: 14, padding: 12, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Play size={16} color={c.gold} />
          Trip Movie
        </button>
      ) : null}

      <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.12em', color: c.muted, textTransform: 'uppercase', marginBottom: 8 }}>
        Rounds
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {trip.rounds.map((r, i) => {
          const active = i === trip.activeRoundIndex
          return (
            <button
              key={r.id}
              className="dt-btn dt-step"
              onClick={() => onRoundChange(i)}
              style={{
                flex: '0 0 auto',
                padding: '12px 16px',
                borderRadius: 14,
                background: active ? 'rgba(201,162,75,.16)' : c.card,
                border: active ? `1px solid ${c.goldDim}` : `1px solid ${c.line}`,
                color: active ? c.gold : c.cream,
                textAlign: 'left',
                minWidth: 120
              }}
            >
              <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.1em', opacity: 0.7 }}>{r.name}</div>
              <div style={{ fontSize: 12, marginTop: 4, fontWeight: 600 }}>{r.course.name}</div>
              <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{r.format} · skins {r.sides.skins.on ? '$' + r.sides.skins.stake : 'off'}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
