import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleOptions, jsonResponse } from '../_shared/cors.ts'

const ROAST_LINES = [
  'That swing had more moving parts than a PGA Tour rules decision.',
  'Your handicap is a suggestion. Your ego wrote it.',
  'The committee reviewed the tape. We are still reviewing.',
  'If sand saves were currency, you would be broke.',
  'You putt like the hole owes you money.'
]

function keywordReply(last: string): string {
  if (/roast/.test(last)) {
    return `${ROAST_LINES[Math.floor(Math.random() * ROAST_LINES.length)]} — The Starter on Daly Trips ⛳`
  }
  if (/win|lead|first|board/.test(last)) {
    return 'Someone leads net. Dr. Sandbag\'s "net" lead remains under formal review. — The Starter'
  }
  if (/team|pair|fair/.test(last)) {
    return 'Fairest teams by handicap are being calculated. Classic Ryder setup. — The Starter'
  }
  if (/settle|money|venmo|pay/.test(last)) {
    return 'The ledger is sacred. Settle like adults — or let Venmo be the witness. — The Starter'
  }
  return 'The Starter is on the bag. Ask about teams, the board, or who to roast. — The Starter ⛳'
}

serve(async req => {
  const options = handleOptions(req)
  if (options) return options

  try {
    const body = await req.json()
    const history = (body.history || []) as Array<{ role: string; content: string }>
    const context = (body.context || '') as string
    const last = history[history.length - 1]?.content?.toLowerCase() || ''

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (openaiKey) {
      const messages = [
        {
          role: 'system',
          content:
            'You are The Starter, the AI commissioner for Daly Trips golf trips. Be witty, cutting but good-natured, like a tour caddie with a podcast. Keep replies to 2-4 sentences.'
        },
        ...(context ? [{ role: 'system', content: `Context: ${context}` }] : []),
        ...history.map(h => ({ role: h.role === 'me' ? 'user' : 'assistant', content: h.content }))
      ]
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini',
          messages,
          max_tokens: 200
        })
      })
      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content?.trim()
        if (text) return jsonResponse({ text })
      }
    }

    return jsonResponse({ text: keywordReply(last) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Starter unavailable'
    return jsonResponse({ error: message }, 500)
  }
})
