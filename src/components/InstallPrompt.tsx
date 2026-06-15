import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { DalyLogo } from '@/components/DalyLogo'
import { c } from '@/styles'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setPrompt(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  if (!prompt || dismissed) return null

  const install = async () => {
    await prompt.prompt()
    try {
      await prompt.userChoice
    } catch {
      /* ignore */
    }
    setPrompt(null)
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 88,
        zIndex: 60,
        maxWidth: 456,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 16,
        background: 'linear-gradient(160deg, #103527, #0D1F3C)',
        border: `1px solid ${c.gold}`,
        boxShadow: '0 12px 30px rgba(0,0,0,.4)'
      }}
    >
      <DalyLogo size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: 13.5, fontWeight: 600, color: '#F5F2EA' }}>
          Install Daly Trips
        </div>
        <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: 11.5, color: 'rgba(239,230,205,.55)' }}>
          Add to your home screen for the course.
        </div>
      </div>
      <button
        onClick={install}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 13px',
          borderRadius: 999,
          background: c.gold,
          border: 'none',
          color: c.ink,
          cursor: 'pointer',
          fontFamily: "'Archivo', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '.04em'
        }}
      >
        <Download size={14} />
        INSTALL
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        aria-label="Dismiss"
      >
        <X size={18} color="rgba(239,230,205,.55)" />
      </button>
    </div>
  )
}
