import type { TrackmaniaMap, TrackmaniaPlayer, TrackmaniaRecord } from './types'
import { eru } from '@dolanske/eru'
import { ref, shallowRef } from '@vue/reactivity'

const api = eru('https://records.hivecom.net/api')

export const maps = api.route('/maps')
export const players = api.route('/players')

export async function getRecords() {
  const DAYS = 3
  const since = Math.floor(Date.now() / 1000) - (86400 * DAYS)
  const r = await api
    .route(`/records?since=${since}`)
    .get<TrackmaniaRecord[]>()
  return r.map(a => a.mapId)
}

export const FETCH_INTERVAL = 150000
export const country = eru('https://restcountries.com/v3.1/name').route('/')

// 10 minutes
const CACHE_TIMEOUT = 600000

const lastMapFetch = ref(0)
const cachedMaps = shallowRef<TrackmaniaMap[]>([])

export async function getMaps() {
  if (lastMapFetch.value && Date.now() - lastMapFetch.value < CACHE_TIMEOUT) {
    return cachedMaps.value
  }

  const data = await maps.get<TrackmaniaMap[]>()
  cachedMaps.value = data
  lastMapFetch.value = Date.now()
  return data
}

const lastPlayerFetch = ref(0)
const cachedPlayers = shallowRef<TrackmaniaPlayer[]>([])

export async function getPlayers() {
  if (lastPlayerFetch.value && Date.now() - lastPlayerFetch.value < CACHE_TIMEOUT) {
    return cachedPlayers.value
  }

  const data = await players.get<TrackmaniaPlayer[]>()
  cachedPlayers.value = data
  lastPlayerFetch.value = Date.now()
  return data
}
