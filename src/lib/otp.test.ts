import { describe, expect, it } from 'vitest'
import { digitsOnly, OTP_LENGTH } from '@/lib/otp'

describe('digitsOnly', () => {
  it('strips non-digits and caps length', () => {
    expect(digitsOnly('12a34b56c78')).toBe('123456')
    expect(digitsOnly('1234567890').length).toBe(OTP_LENGTH)
  })

  it('returns empty for non-numeric input', () => {
    expect(digitsOnly('abc')).toBe('')
  })
})
