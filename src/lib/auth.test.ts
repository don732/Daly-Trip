import { describe, expect, it } from 'vitest'
import { formatEmailLabel } from '@/lib/auth'

describe('formatEmailLabel', () => {
  it('returns fallback when email is missing', () => {
    expect(formatEmailLabel(null)).toBe('Signed in')
    expect(formatEmailLabel(undefined)).toBe('Signed in')
  })

  it('masks the local part of an email', () => {
    expect(formatEmailLabel('player@example.com')).toBe('p••••@example.com')
  })
})
