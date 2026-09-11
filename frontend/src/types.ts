export interface TrackmaniaMap {
  id: number
  name: string
  name_styled: string
  author: string
  records: TrackmaniaRecord[]
  environment: string
}

export interface TrackmaniaRecord {
  mapId: number
  player: string
  country: string
  time: string
  date: string
  unixDate: number
}

export interface TrackmaniaPlayer {
  name: string
  country: string
  maps: number
  records: number
  latest: {
    id: number
    date: string
    map_name: string
    time: string
    unix_date: number
  }
}
