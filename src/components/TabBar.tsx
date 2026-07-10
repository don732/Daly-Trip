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
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <div
        style={{
          margin: '0 10px 10px',
          padding: '6px 8px',
          borderRadius: 16,
          background: 'rgba(245,243,238,.94)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${c.line}`,
          boxShadow: '0 -4px 24px rgba(13,31,60,.08)',
          display: 'flex',
          gap: 4
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
                padding: '10px 4px 9px',
                borderRadius: 12,
                background: on ? c.surfaceGold : 'transparent',
                border: on ? `1px solid ${c.goldDim}` : '1px solid transparent',
                color: on ? c.gold : c.muted,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                transition: 'background .15s, color .15s, border-color .15s'
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
