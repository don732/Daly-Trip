import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { c } from '@/styles'

export function ShareQr({ code, tripName }: { code: string; tripName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [open, setOpen] = useState(false)
  const joinUrl = `https://dalytrips.com/join?code=${code}`

  useEffect(() => {
    if (!open || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, joinUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#06170F', light: '#F5F0E6' }
    }).catch(() => undefined)
  }, [open, joinUrl])

  const share = () => {
    const text = `${tripName}\nJoin code: ${code}\n${joinUrl}`
    if (navigator.share) navigator.share({ title: 'Daly Trips', text }).catch(() => undefined)
    else navigator.clipboard.writeText(text).catch(() => undefined)
  }

  if (!open) {
    return (
      <button
        className="dt-btn dt-btn-ghost"
        onClick={() => setOpen(true)}
        style={{ width: '100%', padding: 12, borderRadius: 12, fontSize: 13 }}
      >
        Share join code · {code}
      </button>
    )
  }

  return (
    <div className="dt-card-gold" style={{ padding: 16, textAlign: 'center' }}>
      <div className="dt-cond" style={{ fontSize: 11, letterSpacing: '.12em', color: c.gold, marginBottom: 12 }}>
        Scan to join · {code}
      </div>
      <canvas ref={canvasRef} style={{ borderRadius: 12, marginBottom: 12 }} />
      <button className="dt-btn dt-btn-gold" onClick={share} style={{ width: '100%', padding: 12, borderRadius: 12, marginBottom: 8 }}>
        Copy / share link
      </button>
      <button className="dt-btn" onClick={() => setOpen(false)} style={{ width: '100%', padding: 10, background: 'transparent', color: c.muted }}>
        Close
      </button>
    </div>
  )
}
