import type { TrackmaniaRecord } from '../types'
import { convertTimeToMs } from './format'

// Percentage value out of total
export function partialPercentage(partial: number, total: number) {
  return ((100 * partial) / total).toFixed(1)
}

export const PieOptions = {
  type: 'pie',
  options: {
    plugins: {
      legend: {
        display: false,
      },
    },
  },
} as const

export function sortRecordsByLatest(records: TrackmaniaRecord[]) {
  return records.toSorted((a, b) => a.unixDate > b.unixDate ? -1 : 1)
}

export function sortRecordsByTime(records: TrackmaniaRecord[]) {
  return records.toSorted((a, b) => convertTimeToMs(a.time) > convertTimeToMs(b.time) ? -1 : 1)
}
