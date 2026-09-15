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
  playerStyled: string
  country: string
  time: string
  date: string
  unixDate: number
}

export interface TrackmaniaPlayer {
  name: string
  name_styled: string
  country: string
  maps: number
  records: number
  latest: {
    id: number
    date: string
    map_name: string
    map_name_styled: string
    time: string
    unix_date: number
  }
}
