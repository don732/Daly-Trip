import { c } from '@/styles'
import { digitsOnly, OTP_LENGTH } from '@/lib/otp'
import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  shake = false,
  autoFocus = false
}: {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  shake?: boolean
  autoFocus?: boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const completedRef = useRef('')
  const [focusIndex, setFocusIndex] = useState<number | null>(null)
  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('').map(d => (d === ' ' ? '' : d))

  const focusAt = useCallback((index: number) => {
    const i = Math.max(0, Math.min(OTP_LENGTH - 1, index))
    refs.current[i]?.focus()
  }, [])

  const applyValue = useCallback(
    (next: string) => {
      const clean = digitsOnly(next)
      onChange(clean)
      if (clean.length === OTP_LENGTH && clean !== completedRef.current) {
        completedRef.current = clean
        onComplete?.(clean)
      }
      if (clean.length < OTP_LENGTH) completedRef.current = ''
    },
    [onChange, onComplete]
  )

  useEffect(() => {
    if (autoFocus && !disabled) focusAt(0)
  }, [autoFocus, disabled, focusAt])

  useEffect(() => {
    if (value.length < OTP_LENGTH) completedRef.current = ''
  }, [value])

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = digitsOnly(e.clipboardData.getData('text'))
    if (!pasted) return
    applyValue(pasted)
    focusAt(Math.min(pasted.length, OTP_LENGTH - 1))
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault()
      const next = digitsOnly(value.slice(0, index - 1) + value.slice(index))
      applyValue(next)
      focusAt(index - 1)
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      focusAt(index - 1)
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      e.preventDefault()
      focusAt(index + 1)
    }
  }

  const handleChange = (index: number, raw: string) => {
    const chunk = digitsOnly(raw)
    if (!chunk) {
      applyValue(value.slice(0, index) + value.slice(index + 1))
      return
    }
    if (chunk.length > 1) {
      applyValue(value.slice(0, index) + chunk)
      focusAt(Math.min(index + chunk.length, OTP_LENGTH - 1))
      return
    }
    const next = value.slice(0, index) + chunk + value.slice(index + 1)
    applyValue(next.slice(0, OTP_LENGTH))
    if (index < OTP_LENGTH - 1) focusAt(index + 1)
  }

  return (
    <div
      className={shake ? 'dt-otp-shake' : 'dt-pop'}
      style={{ display: 'flex', gap: 8, justifyContent: 'center', position: 'relative' }}
    >
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={e => applyValue(e.target.value)}
        disabled={disabled}
        aria-hidden
        tabIndex={-1}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 1,
          height: 1,
          pointerEvents: 'none'
        }}
      />
      {digits.map((digit, index) => {
        const filled = digit.length > 0
        const active = focusIndex === index
        return (
          <input
            key={index}
            ref={el => {
              refs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setFocusIndex(index)}
            onBlur={() => setFocusIndex(current => (current === index ? null : current))}
            aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
            className="dt-num"
            style={{
              width: 44,
              height: 52,
              padding: 0,
              textAlign: 'center',
              fontSize: 26,
              fontWeight: 800,
              borderRadius: 12,
              background: filled ? c.cardWarm : c.cardDeep,
              border: `2px solid ${active ? c.goldBright : filled ? c.goldDim : c.lineStrong}`,
              color: c.creamSoft,
              outline: 'none',
              boxShadow: active ? '0 0 0 3px rgba(201,162,75,.22)' : 'none',
              transition: 'border-color .15s, box-shadow .15s, background .15s',
              fontFamily: "'Archivo', sans-serif",
              opacity: disabled ? 0.6 : 1
            }}
          />
        )
      })}
    </div>
  )
}
