import { describe, expect, it } from 'vitest'
import { formatPhoneLabel } from '@/lib/auth'

describe('formatPhoneLabel', () => {
  it('returns fallback when phone is missing', () => {
    expect(formatPhoneLabel(null)).toBe('Signed in')
    expect(formatPhoneLabel(undefined)).toBe('Signed in')
  })

  it('masks all but last four digits', () => {
    expect(formatPhoneLabel('+15551234567')).toBe('+•••••••4567')
  })
})
