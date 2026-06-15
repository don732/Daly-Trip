import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { ShareQr } from '@/components/ShareQr'
import type { Trip } from '@/types/trip'
import { c } from '@/styles'

export function FeedTab({
  trip,
  onPost,
  onReact
}: {
  trip: Trip
  onPost: (body: string) => void
  onReact: (postId: string, emoji: string) => void
}) {
  const [draft, setDraft] = useState('')
  const me = trip.players[0]

  return (
    <div className="dt-fade-in" style={{ padding: '16px 16px 100px' }}>
      <ShareQr code={trip.code} tripName={trip.name} />

      <div className="dt-card" style={{ padding: 12, marginTop: 14, marginBottom: 14 }}>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Post to the feed…"
          rows={3}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: 'transparent',
            border: 'none',
            color: c.cream,
            resize: 'none',
            fontSize: 14,
            fontFamily: 'inherit'
          }}
        />
        <button
          className="dt-btn dt-btn-gold"
          disabled={!draft.trim()}
          onClick={() => {
            onPost(draft.trim())
            setDraft('')
          }}
          style={{ width: '100%', padding: 10, borderRadius: 10, marginTop: 8, fontSize: 13 }}
        >
          Post to the feed
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {trip.feed.map(post => (
          <div key={post.id} className="dt-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <MessageCircle size={14} color={c.gold} />
              <span style={{ fontWeight: 700, fontSize: 13, color: c.cream }}>{post.authorNick}</span>
              <span style={{ fontSize: 11, color: c.muted, marginLeft: 'auto' }}>
                {new Date(post.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 14, lineHeight: 1.5, color: c.cream }}>{post.body}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['🔥', '😂', '⛳'].map(emoji => {
                const count = post.reactions[emoji]?.length || 0
                const mine = me && post.reactions[emoji]?.includes(me.id)
                return (
                  <button
                    key={emoji}
                    className="dt-btn"
                    onClick={() => onReact(post.id, emoji)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 99,
                      background: mine ? c.surfaceGold : c.surfaceSubtle,
                      border: `1px solid ${c.line}`,
                      color: c.cream,
                      fontSize: 12
                    }}
                  >
                    {emoji} {count || ''}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
