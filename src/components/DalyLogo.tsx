import { Flag } from 'lucide-react'
import { c } from '@/styles'

export function DalyLogo({
  size = 40,
  emoji,
  color,
  photo
}: {
  size?: number
  emoji?: string | null
  color?: string | null
  photo?: string | null
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(145deg, ${color || c.felt}, #0A241A)`,
        border: `1.5px solid ${c.gold}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 1px 0 rgba(13,31,60,.08)'
      }}
    >
      {photo ? (
        <img src={photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : emoji ? (
        <span style={{ fontSize: size * 0.5 }}>{emoji}</span>
      ) : (
        <Flag size={size * 0.5} color={c.goldBright} strokeWidth={2.2} />
      )}
    </div>
  )
}
