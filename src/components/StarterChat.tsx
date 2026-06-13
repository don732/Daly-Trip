import { useState } from 'react'
import { askStarter } from '@/lib/starter'
import type { Trip } from '@/types/trip'
import { buildLeaderboard } from '@/engine/scoring'
import { c } from '@/styles'
import { MessageSquare, X } from 'lucide-react'

export function StarterChat({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'me' | 'starter'; text: string }>>([
    { role: 'starter', text: 'The Starter is on the bag. Ask me about the board, teams, or who to roast.' }
  ])
  const [loading, setLoading] = useState(false)

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const next = [...messages, { role: 'me' as const, text }]
    setMessages(next)
    setLoading(true)
    const leaders = buildLeaderboard(trip)
    const top = leaders.sort((a, b) => a.toParNet - b.toParNet)[0]
    const context = `Trip ${trip.name}. Leader: ${top?.nick || 'none'}.`
    const reply = await askStarter({ history: [{ role: 'me', content: text }], context })
    setMessages([...next, { role: 'starter', text: reply || 'The committee is reviewing the tape. Check the Board tab for live numbers. — The Starter ⛳' }])
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 130, background: 'rgba(0,0,0,.82)' }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          height: '70vh',
          background: 'linear-gradient(170deg,#0D2B1F,#06170F)',
          borderRadius: '24px 24px 0 0',
          borderTop: `1px solid ${c.goldDim}`,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${c.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={18} color={c.gold} />
            <span style={{ fontWeight: 700, color: c.cream }}>The Starter</span>
          </div>
          <button className="dt-btn" onClick={onClose} style={{ background: 'none', border: 'none', color: c.cream }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === 'me' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: 14,
                background: m.role === 'me' ? 'rgba(201,162,75,.16)' : 'rgba(255,255,255,.05)',
                border: `1px solid ${m.role === 'me' ? c.goldDim : c.line}`,
                fontSize: 14,
                lineHeight: 1.5,
                color: c.cream
              }}
            >
              {m.text}
            </div>
          ))}
          {loading ? <div style={{ color: c.muted, fontSize: 13 }}>THE STARTER IS COOKING…</div> : null}
        </div>
        <div style={{ padding: 12, display: 'flex', gap: 8, borderTop: `1px solid ${c.line}` }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Teams, wagers, roasts…"
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${c.line}`,
              background: c.card,
              color: c.cream,
              fontSize: 14
            }}
          />
          <button className="dt-btn dt-btn-gold" onClick={send} disabled={loading} style={{ padding: '12px 16px', borderRadius: 12 }}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
