import { useCallback, useEffect, useRef, useState } from 'react'
import { buildLeaderboard } from '@/engine/scoring'
import { tripSkinsPot } from '@/engine/money'
import { recordTripMerit } from '@/lib/merit'
import { starterRecap } from '@/lib/starter'
import type { Trip } from '@/types/trip'
import { c, formatScore } from '@/styles'
import { Download, Play, X } from 'lucide-react'

export function HighlightReel({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [recording, setRecording] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const leaders = buildLeaderboard(trip)
  const recap = starterRecap(trip, leaders)
  const top = [...leaders].sort((a, b) => a.toParNet - b.toParNet).slice(0, 5)
  const pot = tripSkinsPot(trip)

  useEffect(() => {
    recordTripMerit(trip).catch(() => undefined)
  }, [trip])

  const drawFrame = useCallback(
    (ctx: CanvasRenderingContext2D, frame: number) => {
      const w = ctx.canvas.width
      const h = ctx.canvas.height
      ctx.fillStyle = '#0D1629'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#C9A24B'
      ctx.fillRect(0, 0, w, 6)
      ctx.fillStyle = '#F5F0E6'
      ctx.font = 'bold 28px Archivo, sans-serif'
      ctx.fillText(trip.name, 24, 48)
      ctx.font = '16px Archivo, sans-serif'
      ctx.fillStyle = '#9AA8BC'
      ctx.fillText(recap.slice(0, 80) + (recap.length > 80 ? '…' : ''), 24, 78)
      const visible = Math.min(top.length, Math.floor(frame / 8) + 1)
      ctx.fillStyle = '#C9A24B'
      ctx.font = 'bold 12px Archivo, sans-serif'
      ctx.fillText('FINAL NET BOARD', 24, 110)
      top.slice(0, visible).forEach((row, i) => {
        ctx.fillStyle = '#F5F0E6'
        ctx.font = '18px Archivo, sans-serif'
        ctx.fillText(`${i + 1}. ${row.nick}`, 24, 140 + i * 32)
        ctx.fillStyle = '#C9A24B'
        ctx.textAlign = 'right'
        ctx.fillText(formatScore(row.toParNet), w - 24, 140 + i * 32)
        ctx.textAlign = 'left'
      })
      ctx.fillStyle = '#9AA8BC'
      ctx.font = '14px Archivo, sans-serif'
      ctx.fillText(`Skins pot $${pot} · ${trip.rounds.length} round(s)`, 24, h - 32)
    },
    [trip.name, recap, top, pot, trip.rounds.length]
  )

  const recordMovie = async () => {
    const canvas = canvasRef.current
    if (!canvas || recording) return
    setRecording(true)
    setVideoUrl(null)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setRecording(false)
      return
    }
    const stream = canvas.captureStream(30)
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'
    const recorder = new MediaRecorder(stream, { mimeType: mime })
    const chunks: Blob[] = []
    recorder.ondataavailable = e => {
      if (e.data.size) chunks.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime })
      setVideoUrl(URL.createObjectURL(blob))
      setRecording(false)
    }
    recorder.start()
    let frame = 0
    const totalFrames = 120
    const tick = () => {
      drawFrame(ctx, frame)
      frame += 1
      if (frame < totalFrames) requestAnimationFrame(tick)
      else recorder.stop()
    }
    tick()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) drawFrame(ctx, 120)
  }, [drawFrame])

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    }
  }, [videoUrl])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(0,0,0,.88)' }} onClick={onClose}>
      <div
        className="dt-card-gold dt-fade-in"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          inset: 'calc(40px + env(safe-area-inset-top)) 16px calc(40px + env(safe-area-inset-bottom))',
          maxWidth: 448,
          margin: '0 auto',
          padding: 24,
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="dt-cond" style={{ fontSize: 11, letterSpacing: '.14em', color: c.gold, textTransform: 'uppercase' }}>
            Trip Movie
          </div>
          <button className="dt-btn" onClick={onClose} style={{ background: 'none', border: 'none', color: c.cream }}>
            <X size={20} />
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={400}
          height={320}
          style={{ width: '100%', borderRadius: 12, border: `1px solid ${c.line}`, marginBottom: 12, background: c.cardDeep }}
        />
        <h2 style={{ margin: '0 0 8px', color: c.cream, fontSize: 24 }}>{trip.name}</h2>
        <p style={{ margin: '0 0 16px', color: c.muted, fontSize: 14, lineHeight: 1.5 }}>{recap}</p>
        <div className="dt-cond" style={{ fontSize: 10, letterSpacing: '.12em', color: c.gold, marginBottom: 8 }}>
          Final net board
        </div>
        {top.map((row, i) => (
          <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${c.line}` }}>
            <span style={{ color: c.cream, fontWeight: 600 }}>{i + 1}. {row.nick}</span>
            <span className="dt-num" style={{ color: c.gold }}>{formatScore(row.toParNet)}</span>
          </div>
        ))}
        <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: c.surfaceSubtle, color: c.muted, fontSize: 13, marginBottom: 12 }}>
          Skins across {trip.rounds.length} round{trip.rounds.length === 1 ? '' : 's'} · ${pot} total pot
        </div>
        <button
          className="dt-btn dt-btn-gold"
          onClick={recordMovie}
          disabled={recording}
          style={{ width: '100%', padding: 12, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}
        >
          <Play size={16} />
          {recording ? 'Recording…' : 'Record trip movie'}
        </button>
        {videoUrl ? (
          <a
            href={videoUrl}
            download={`${trip.code}-trip-movie.webm`}
            className="dt-btn dt-btn-ghost"
            style={{ width: '100%', padding: 12, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', color: c.cream }}
          >
            <Download size={16} />
            Download video
          </a>
        ) : null}
      </div>
    </div>
  )
}
