import type { TrackmaniaRecord } from '../types'
import { li, reusable, span, strong } from '@dolanske/pantry'
import { timeAgo } from '../util/time'
import Player from './Player'

interface Props {
  records: TrackmaniaRecord[]
}

export default reusable<Props>('ul', (ctx, props) => {
  const sorted = props.records.sort((a, b) => a.time > b.time ? 1 : -1)
  ctx.for(sorted, (record, index) => {
    return li().nest(
      span(`#${index + 1}`),
      Player().props({
        player: record.player,
        country: record.country,
      }),
      strong(record.time).attr('data-title-left', `Driven ${timeAgo(Number(`${record.unixDate}000`))}`),
    )
  })
})
