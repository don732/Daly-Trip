import { useCallback, useEffect, useRef, useState } from 'react'
import { buildLeaderboard } from '@/engine/scoring'
import { tripSkinsPot } from '@/engine/money'
import { recordTripMerit } from '@/lib/merit'
import { starterRecap } from '@/lib/starter'
import type { Trip } from '@/types/trip'
import { formatScore } from '@/styles'
import { Download, X } from 'lucide-react'

export function HighlightReel({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [recording, setRecording] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const autoStarted = useRef(false)
  const leaders = buildLeaderboard(trip)
  const recap = starterRecap(trip, leaders)
  const top = [...leaders].sort((a, b) => a.toParNet - b.toParNet).slice(0, 5)
  const pot = tripSkinsPot(trip)
  const canRecord =
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    !!HTMLCanvasElement.prototype.captureStream

  useEffect(() => {
    recordTripMerit(trip).catch(() => undefined)
  }, [trip])

  const drawFrame = useCallback(
    (ctx: CanvasRenderingContext2D, frame: number) => {
      const w = ctx.canvas.width
      const h = ctx.canvas.height
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#C8102E'
      ctx.fillRect(0, 0, w, 4)
      ctx.fillStyle = '#F5F5F2'
      ctx.font = 'bold 32px Archivo, sans-serif'
      ctx.fillText(trip.name, 28, 56)
      ctx.font = '15px Archivo, sans-serif'
      ctx.fillStyle = 'rgba(245,245,242,.65)'
      const recapLine = recap.length > 72 ? `${recap.slice(0, 72)}…` : recap
      ctx.fillText(recapLine, 28, 88)
      const visible = Math.min(top.length, Math.floor(frame / 10) + 1)
      ctx.fillStyle = '#C8102E'
      ctx.font = 'bold 11px Archivo, sans-serif'
      ctx.fillText('FINAL NET BOARD', 28, 124)
      top.slice(0, visible).forEach((row, i) => {
        ctx.fillStyle = '#F5F0E6'
        ctx.font = '20px Archivo, sans-serif'
        ctx.fillText(`${i + 1}. ${row.nick}`, 28, 158 + i * 36)
        ctx.fillStyle = '#C8102E'
        ctx.textAlign = 'right'
        ctx.fillText(formatScore(row.toParNet), w - 28, 158 + i * 36)
        ctx.textAlign = 'left'
      })
      ctx.fillStyle = 'rgba(245,240,230,.55)'
      ctx.font = '14px Archivo, sans-serif'
      ctx.fillText(`Skins $${pot} · ${trip.rounds.length} round(s)`, 28, h - 36)
      ctx.fillStyle = '#C8102E'
      ctx.font = 'bold 12px Archivo, sans-serif'
      ctx.fillText('DALY TRIPS', 28, h - 14)
    },
    [trip.name, recap, top, pot, trip.rounds.length]
  )

  const recordMovie = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || recording || !canRecord) return
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
      const url = URL.createObjectURL(blob)
      setVideoUrl(url)
      setRecording(false)
    }
    recorder.start()
    let frame = 0
    const totalFrames = 150
    const tick = () => {
      drawFrame(ctx, frame)
      frame += 1
      if (frame < totalFrames) requestAnimationFrame(tick)
      else recorder.stop()
    }
    tick()
  }, [canRecord, drawFrame, recording])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) drawFrame(ctx, 150)
  }, [drawFrame])

  useEffect(() => {
    if (autoStarted.current || !canRecord) return
    autoStarted.current = true
    recordMovie()
  }, [canRecord, recordMovie])

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.src = videoUrl
      videoRef.current.play().catch(() => undefined)
    }
  }, [videoUrl])

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    }
  }, [videoUrl])

  return (
    <div
      className="dt-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: 'calc(14px + env(safe-area-inset-top))',
          right: 16,
          zIndex: 5,
          width: 40,
          height: 40,
          borderRadius: 999,
          border: 'none',
          background: 'rgba(0,0,0,.5)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <X size={20} />
      </button>

      {videoUrl ? (
        <div style={{ width: '100%', maxWidth: 480, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <video
            ref={videoRef}
            controls
            playsInline
            style={{ width: '100%', maxHeight: '70vh', borderRadius: 8, background: '#000' }}
          />
          <a
            href={videoUrl}
            download={`${trip.code}-trip-movie.webm`}
            style={{
              marginTop: 16,
              padding: '12px 20px',
              borderRadius: 12,
              background: 'rgba(200,16,46,.2)',
              border: '1px solid #C9A24B',
              color: '#F5F0E6',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 600
            }}
          >
            <Download size={16} />
            Download trip movie
          </a>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 480, padding: 16, textAlign: 'center' }}>
          <canvas
            ref={canvasRef}
            width={480}
            height={640}
            style={{ width: '100%', maxHeight: '75vh', borderRadius: 4 }}
          />
          <p style={{ color: 'rgba(245,240,230,.7)', fontSize: 14, marginTop: 16 }}>
            {recording ? 'Recording your trip movie…' : canRecord ? 'Preparing…' : 'Video capture not supported in this browser.'}
          </p>
          {!recording && canRecord ? (
            <button
              onClick={recordMovie}
              style={{
                marginTop: 12,
                padding: '12px 20px',
                borderRadius: 12,
                background: '#C9A24B',
                border: 'none',
                color: '#0D1F3C',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Record again
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
