import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { c } from '@/styles'

export function Modal({ children, onClose, center }: { children: ReactNode; onClose: () => void; center?: boolean }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,.72)',
        display: 'flex',
        alignItems: center ? 'center' : 'flex-end',
        justifyContent: 'center',
        padding: center ? 16 : 0
      }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480 }}>
        {children}
      </div>
    </div>
  )
}

export function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <div className="dt-cond" style={{ fontSize: 11, letterSpacing: '.14em', color: c.gold, textTransform: 'uppercase' }}>
        {title}
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="dt-btn"
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          background: 'rgba(13,31,60,.06)',
          border: `1px solid ${c.line}`,
          color: c.cream,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <X size={18} />
      </button>
    </div>
  )
}
