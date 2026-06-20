import type { TeamKey } from '@/types/trip'
import { c, flowInput } from '@/styles'

export type RosterRow = { nick: string; hcp: number; team: TeamKey; venmo: string }

export function RosterEditor({
  rows,
  onChange
}: {
  rows: RosterRow[]
  onChange: (rows: RosterRow[]) => void
}) {
  const update = (index: number, patch: Partial<RosterRow>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((row, i) => (
        <div
          key={i}
          className="dt-card"
          style={{ padding: 12, background: c.cardFeature, border: `1.5px solid ${c.line}` }}
        >
          <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.12em', color: c.gold, marginBottom: 8 }}>
            {i === 0 ? 'ORGANIZER' : `PLAYER ${i + 1}`}
          </div>
          <input
            value={row.nick}
            onChange={e => update(i, { nick: e.target.value })}
            placeholder="Nickname"
            style={{ ...flowInput, marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              min={0}
              max={54}
              value={row.hcp}
              onChange={e => update(i, { hcp: Number(e.target.value) || 0 })}
              placeholder="HCP"
              style={{ ...flowInput, flex: 1, marginBottom: 0 }}
            />
            <input
              value={row.venmo}
              onChange={e => update(i, { venmo: e.target.value })}
              placeholder="Venmo @handle"
              style={{ ...flowInput, flex: 2, marginBottom: 0 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function rosterFromHeadcount(count: number): RosterRow[] {
  return Array.from({ length: count }, (_, i) => ({
    nick: i === 0 ? 'Organizer' : `Player ${i + 1}`,
    hcp: 18,
    team: (i % 2 === 0 ? 'pine' : 'sand') as TeamKey,
    venmo: ''
  }))
}

export function resizeRoster(rows: RosterRow[], count: number): RosterRow[] {
  const next = rosterFromHeadcount(count)
  return next.map((slot, i) => ({
    ...slot,
    ...(rows[i] ? { nick: rows[i].nick, hcp: rows[i].hcp, venmo: rows[i].venmo, team: rows[i].team } : {})
  }))
}
