import type { TrackmaniaMap, TrackmaniaPlayer, TrackmaniaRecord } from './types'
import { eru } from '@dolanske/eru'
import { ref, shallowRef } from '@dolanske/pantry'
import { sortRecordsByLatest } from './util/common'

const api = eru('https://records.hivecom.net/api')
const maps = api.route('/maps')
const players = api.route('/players')
export const country = eru('https://restcountries.com/v3.1/name').route('/')

interface CachedFetchOptions<T> {
  fetcher: () => Promise<T>
  /**
   * How long the cached result is considered valid, in ms.
   */
  ttl: number
}

export function createCachedFetch<T>(options: CachedFetchOptions<T>) {
  const { fetcher, ttl } = options

  const lastFetch = ref(0)
  const cached = shallowRef<T>([] as T)
  let pendingFetch: Promise<T> | null = null

  async function get(): Promise<T> {
    if (lastFetch.value && Date.now() - lastFetch.value < ttl) {
      return cached.value
    }

    if (pendingFetch) {
      return pendingFetch
    }

    pendingFetch = (async () => {
      const raw = await fetcher() as unknown as T
      cached.value = raw
      lastFetch.value = Date.now()
      return raw
    })()

    try {
      return await pendingFetch
    }
    finally {
      pendingFetch = null
    }
  }

  return { get, cached }
}

// Records
export const RECORDS_FETCH_TIMEOUT = 150000

const recordsCache = createCachedFetch({
  ttl: RECORDS_FETCH_TIMEOUT,
  async fetcher() {
    const DAYS = 7
    const since = Math.floor(Date.now() / 1000) - (86400 * DAYS)
    const records = await api
      .route(`/records?since=${since}`)
      .get<TrackmaniaRecord[]>()
    return sortRecordsByLatest(records)
  },
})

export const getRecords = recordsCache.get

// Maps & players (10 minute cachce)
const CACHE_TIMEOUT = 600000

const mapsCache = createCachedFetch({
  ttl: CACHE_TIMEOUT,
  async fetcher() {
    const items = await maps.get<TrackmaniaMap[]>()
    return items.map((map) => {
      map.records = map.records.toSorted((a, b) => a.time > b.time ? 1 : -1)
      return map
    })
  },
})

export const getMaps = mapsCache.get

const playersCache = createCachedFetch({
  ttl: CACHE_TIMEOUT,
  fetcher: async () => await players.get<TrackmaniaPlayer[]>(),
})

export const getPlayers = playersCache.get
