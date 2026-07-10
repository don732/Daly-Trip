import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { notifyTripActivity, requestPushPermission, sendPush } from './push'

describe('push', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sendPush posts to /api/push/send', async () => {
    await sendPush({ toUserId: 'u1', title: 'Hi', body: 'Test' })
    expect(fetch).toHaveBeenCalledWith(
      '/api/push/send',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ toUserId: 'u1', title: 'Hi', body: 'Test' })
      })
    )
  })

  it('notifyTripActivity broadcasts by tripId', async () => {
    await notifyTripActivity({
      tripId: 'trip_1',
      title: 'Score',
      body: 'Updated',
      excludeUserId: 'me'
    })
    expect(fetch).toHaveBeenCalledWith(
      '/api/push/send',
      expect.objectContaining({
        body: JSON.stringify({
          tripId: 'trip_1',
          title: 'Score',
          body: 'Updated',
          excludeUserId: 'me'
        })
      })
    )
  })

  it('requestPushPermission returns unsupported when Notification missing', async () => {
    const result = await requestPushPermission()
    expect(result.ok).toBe(false)
    expect(result.mode).toBe('unsupported')
  })
})
