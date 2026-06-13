import { useMemo, useState, type CSSProperties } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { strokesOnHole } from '@/engine/scoring'
import type { Trip } from '@/types/trip'
import { c, formatScore } from '@/styles'

export function PlayTab({ trip, onScore }: { trip: Trip; onScore: (playerId: string, hole: number, score: number | null) => void }) {
  const [hole, setHole] = useState(0)
  const courseHole = trip.course.holes[hole]

  const rows = useMemo(() => {
    return trip.players.map(p => {
      const gross = trip.scores[p.id]?.[hole]
      const strokes = strokesOnHole(p.hcp, courseHole.hcp)
      const net = gross != null ? gross - strokes : null
      const toPar = gross != null ? gross - courseHole.par : null
      return { player: p, gross, net, toPar, strokes }
    })
  }, [trip, hole, courseHole])

  return (
    <div className="dt-fade-in" style={{ padding: '16px 16px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button className="dt-btn dt-step" onClick={() => setHole(h => Math.max(0, h - 1))} style={navBtn}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div className="dt-num" style={{ fontSize: 28, fontWeight: 800, color: c.cream }}>Hole {courseHole.n}</div>
          <div style={{ fontSize: 12, color: c.muted }}>Par {courseHole.par} · {courseHole.yds} yds · HCP {courseHole.hcp}</div>
        </div>
        <button className="dt-btn dt-step" onClick={() => setHole(h => Math.min(17, h + 1))} style={navBtn}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(({ player, gross, net, toPar, strokes }) => (
          <div key={player.id} className="dt-card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: c.cream, fontSize: 14 }}>{player.nick}</div>
              <div style={{ fontSize: 11, color: c.muted }}>HCP {player.hcp} · {strokes} str</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Stepper value={gross} par={courseHole.par} onChange={v => onScore(player.id, hole, v)} />
              {toPar != null ? (
                <span className={`dt-chip dt-num ${toPar < 0 ? 'dt-chip-under' : toPar > 0 ? 'dt-chip-over' : 'dt-chip-even'}`} style={{ minWidth: 36 }}>
                  {formatScore(toPar)}
                </span>
              ) : null}
              {net != null ? <span className="dt-num" style={{ fontSize: 11, color: c.muted, width: 32, textAlign: 'right' }}>{net}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Stepper({ value, par, onChange }: { value: number | null | undefined; par: number; onChange: (v: number | null) => void }) {
  const v = value ?? par
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button className="dt-btn dt-step" onClick={() => onChange(Math.max(1, v - 1))} style={stepBtn}>-</button>
      <span className="dt-num" style={{ width: 28, textAlign: 'center', fontWeight: 800, fontSize: 18, color: c.cream }}>{value ?? '—'}</span>
      <button className="dt-btn dt-step" onClick={() => onChange(v + 1)} style={stepBtn}>+</button>
    </div>
  )
}

const navBtn: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 12,
  background: c.card,
  border: `1px solid ${c.line}`,
  color: c.cream,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const stepBtn: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: 'rgba(255,255,255,.06)',
  border: `1px solid ${c.line}`,
  color: c.cream,
  fontWeight: 700
}
