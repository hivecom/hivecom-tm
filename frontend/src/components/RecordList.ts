import type { TrackmaniaRecord } from '../types'
import { li, reusable, span, strong } from '@dolanske/pantry'
import { showStyledUsernames } from '../config'
import { timeAgo } from '../util/time'
import Player from './Player'

interface Props {
  records: TrackmaniaRecord[]
}

export default reusable<Props>('ul', (ctx, props) => {
  ctx.for(() => props.records, (record, index) => {
    return li()
      .key(record.mapId + record.player)
      .nest(
        span(`#${index + 1}`),
        Player().props({
          player: () => showStyledUsernames ? record.playerStyled : record.player,
          country: record.country,
        }),
        strong(record.time).attr('data-title-left', `Driven ${timeAgo(Number(`${record.unixDate}000`))}`),
      )
  })
})
