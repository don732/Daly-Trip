import { c, formatScore } from '@/styles'

export function ScoreChip({ toPar }: { toPar: number }) {
  const cls = toPar < 0 ? 'dt-chip-under' : toPar > 0 ? 'dt-chip-over' : 'dt-chip-even'
  return <span className={`dt-chip dt-num ${cls}`}>{formatScore(toPar)}</span>
}

export function TabBar({
  tabs,
  active,
  onChange
}: {
  tabs: Array<{ id: string; label: string }>
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: 'linear-gradient(180deg, transparent, rgba(6,23,15,.96) 24%)',
        padding: '8px 12px calc(10px + env(safe-area-inset-bottom))',
        display: 'flex',
        gap: 4,
        zIndex: 50
      }}
    >
      {tabs.map(tab => {
        const on = tab.id === active
        return (
          <button
            key={tab.id}
            className="dt-btn dt-tab"
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              padding: '10px 4px',
              borderRadius: 12,
              background: on ? 'rgba(201,162,75,.14)' : 'transparent',
              border: on ? `1px solid ${c.goldDim}` : '1px solid transparent',
              color: on ? c.gold : c.muted,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.06em'
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
