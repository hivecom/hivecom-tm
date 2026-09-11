import type { RouteProps } from '@dolanske/pantry'
import type { TrackmaniaMap, TrackmaniaPlayer } from '../types'
import { div, h2 } from '@dolanske/pantry'
import CountryStatistics from '../components/stats/CountryStats'
import MapStatistics from '../components/stats/MapStats'

type Props = RouteProps<[
  TrackmaniaMap[],
  TrackmaniaPlayer[],
]>

export default div<Props>().setup((ctx, props) => {
  const [$maps, $players] = props.$data

  ctx.class('container').class('route-stats')
  ctx.nest(
    h2('Countries'),
    CountryStatistics($players),
    h2('Maps'),
    MapStatistics($maps),
  )
})
