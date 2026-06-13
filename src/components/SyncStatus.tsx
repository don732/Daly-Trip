import { useEffect, useState } from 'react'
import { getSyncState, onSyncStateChange, type SyncState } from '@/cloudStore'
import { c } from '@/styles'

const LABELS: Record<SyncState, string> = {
  offline: 'Local only',
  syncing: 'Syncing…',
  live: 'Live',
  error: 'Sync error'
}

const COLORS: Record<SyncState, string> = {
  offline: c.muted,
  syncing: c.gold,
  live: c.green,
  error: c.red
}

export function SyncStatus() {
  const [state, setState] = useState<SyncState>(() => getSyncState().state)
  const [error, setError] = useState<string | null>(() => getSyncState().error)

  useEffect(() => onSyncStateChange((next, err) => {
    setState(next)
    setError(err)
  }), [])

  return (
    <span
      title={error || undefined}
      className="dt-cond"
      style={{
        fontSize: 9,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        color: COLORS[state],
        padding: '3px 8px',
        borderRadius: 99,
        border: `1px solid ${COLORS[state]}44`,
        background: `${COLORS[state]}14`
      }}
    >
      {LABELS[state]}
    </span>
  )
}
