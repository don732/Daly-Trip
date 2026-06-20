import type { RoundFormat } from '@/types/trip'

export const FORMAT_OPTIONS: Array<{ value: RoundFormat; label: string }> = [
  { value: 'stroke', label: 'Stroke play' },
  { value: 'stableford', label: 'Stableford' },
  { value: 'bestball', label: 'Best ball' },
  { value: 'fourball', label: 'Fourball' },
  { value: 'scramble', label: 'Scramble' },
  { value: 'shamble', label: 'Shamble' },
  { value: 'chapman', label: 'Chapman' },
  { value: 'alternate', label: 'Alternate shot' },
  { value: 'match', label: 'Match play' },
  { value: 'nassau', label: 'Nassau format' }
]

export const FORMAT_LABELS: Record<string, string> = Object.fromEntries(
  FORMAT_OPTIONS.map(o => [o.value, o.label])
)
