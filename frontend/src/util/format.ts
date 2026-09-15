const timestampCache = new Map<string, number>()

// Convert timestampts in MM:SS.SSS to milliseconds
export function convertTimeToMs(timestamp: string): number {
  if (timestampCache.has(timestamp)) {
    return timestampCache.get(timestamp)!
  }

  const match = timestamp.match(/^(\d+):(\d{2})\.(\d{1,3})$/)
  if (!match) {
    throw new Error(`Invalid timestamp format: "${timestamp}"`)
  }
  const [, minutes, seconds, msRaw] = match
  const milliseconds = Number(msRaw.padEnd(2, '0'))

  const result = (
    Number(minutes) * 60_000
    + Number(seconds) * 1000
    + milliseconds
  )

  timestampCache.set(timestamp, result)

  return result
}

const msCache = new Map<number, string>()

export function convertMsToTime(ms: number): string {
  if (msCache.has(ms)) {
    return msCache.get(ms)!
  }

  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const milliseconds = Math.floor(ms % 1000)

  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  const mss = String(milliseconds).padStart(2, '0')

  const formatted = `${mm}:${ss}.${mss}`

  msCache.set(ms, formatted)

  return formatted
}

export function toHTML(string: string) {
  const div = document.createElement('div')
  div.innerHTML = string
  return div.firstChild
}
