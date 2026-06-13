export const TRIP_PRICE = 5

export async function startCheckout(_tripId: string, _headcount: number): Promise<{ ok: boolean; paid: boolean }> {
  await new Promise(r => setTimeout(r, 1200))
  return { ok: true, paid: true }
}
