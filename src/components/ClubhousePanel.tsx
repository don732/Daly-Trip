import { useTripStore } from '@/context/TripContext'
import { c } from '@/styles'
import { Trophy } from 'lucide-react'
import { useEffect } from 'react'

export function ClubhousePanel({ onClose }: { onClose: () => void }) {
  const { state, refreshMerit } = useTripStore()

  useEffect(() => {
    refreshMerit()
  }, [refreshMerit])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(0,0,0,.75)' }} onClick={onClose}>
      <div
        className="dt-sheet dt-fade-in"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          padding: 20,
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Trophy size={18} color={c.gold} />
          <span className="dt-cond" style={{ fontSize: 11, letterSpacing: '.12em', color: c.gold, textTransform: 'uppercase' }}>
            Order of Merit · Clubhouse
          </span>
        </div>
        {state.merit.length === 0 ? (
          <div className="dt-card" style={{ padding: 20, marginBottom: 8, textAlign: 'center', color: c.muted, fontSize: 14 }}>
            No standings yet
          </div>
        ) : null}
        {state.merit.map((row, i) => (
          <div key={row.nick} className="dt-card" style={{ padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="dt-num" style={{ width: 24, fontWeight: 800, color: i === 0 ? c.gold : c.muted }}>{i + 1}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: c.cream }}>{row.nick}</div>
              <div style={{ fontSize: 11, color: c.muted }}>{row.trips} trips</div>
            </div>
            <span className="dt-num" style={{ fontWeight: 800, color: c.gold }}>{row.points} pts</span>
          </div>
        ))}
        <button className="dt-btn dt-btn-ghost" onClick={onClose} style={{ width: '100%', padding: 14, borderRadius: 12, marginTop: 8 }}>
          Close
        </button>
      </div>
    </div>
  )
}
