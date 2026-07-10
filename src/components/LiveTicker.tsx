import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { buildLeaderboard, computeSkins } from '@/engine/scoring'
import type { Trip } from '@/types/trip'
import { c, formatScore } from '@/styles'

export function LiveTicker({ trip, onClick }: { trip: Trip; onClick?: () => void }) {
  const items = useMemo(() => {
    const board = buildLeaderboard(trip)
    const skins = computeSkins(trip)
    const round = trip.rounds[trip.activeRoundIndex]
    const tags: string[] = []
    tags.push(`${(round?.name || 'Round').toUpperCase()} · ${trip.course.name.toUpperCase()}`)
    const sorted = [...board].sort((a, b) => a.toParNet - b.toParNet)
    sorted.slice(0, 4).forEach((row, i) => {
      tags.push(`#${i + 1} ${row.nick} ${formatScore(row.toParNet)} net`)
    })
    tags.push(`SKINS POT $${skins.pot}${skins.carry ? ` · ${skins.carry} CARRYING` : ''}`)
    return tags
  }, [trip])

  const doubled = [...items, ...items]

  return (
    <div className="dt-ticker" onClick={onClick} style={{ height: 36 }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 14px 0 12px',
          background: `linear-gradient(90deg, ${c.felt} 65%, transparent)`
        }}
      >
        <span
          className="dt-live-dot"
          style={{ width: 7, height: 7, borderRadius: 9, background: c.gold, boxShadow: `0 0 6px ${c.gold}` }}
        />
        <span className="dt-cond" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.18em', color: c.gold }}>
          LIVE
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '0 11px 0 22px',
          background: `linear-gradient(270deg, ${c.felt} 55%, transparent)`
        }}
      >
        <ChevronRight size={13} color={c.goldBright} />
      </div>
      <div className="dt-ticker-track" style={{ height: '100%', paddingLeft: 88, paddingRight: 36 }}>
        {doubled.map((text, i) => (
          <span
            key={i}
            className="dt-cond"
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: '.12em',
              color: c.goldBright,
              padding: '0 16px',
              borderLeft: '1px solid rgba(200,16,46,.25)',
              lineHeight: '36px'
            }}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}
