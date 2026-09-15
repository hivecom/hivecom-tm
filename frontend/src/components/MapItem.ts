import type { Ref } from '@dolanske/pantry'
import type { TrackmaniaMap } from '../types'
import { computed, div, fragment, reusable, span, strong, table, td, th, toValue, tr } from '@dolanske/pantry'
import { sortRecordsByLatest, sortRecordsByTime } from '../util/common'
import { convertMsToTime, convertTimeToMs } from '../util/format'
import { formatDate, timeAgo } from '../util/time'
import Detail from './Detail'
import RecordList from './RecordList'

interface Props {
  map: TrackmaniaMap
  showFormattedNames?: Ref<boolean>
  isNewRecord?: Ref<boolean>
}

export default reusable<Props>('li', (ctx, props) => {
  const wr = props.map.records[0]
  const name = computed(() => props.showFormattedNames?.value ? props.map.name_styled : props.map.name)

  ctx.class({ 'new-record': () => toValue(props.isNewRecord) === true })
  ctx.class('map-item')
  ctx.id(props.map.id)

  const sortedRecords = computed(() => sortRecordsByLatest(props.map.records))

  ctx.nest(
    Detail()
      .on('interaction', (_, isOpen: boolean) => {
        const url = new URL(window.location.href)
        url.hash = isOpen ? props.map.id.toString() : ''
        history.replaceState(null, '', url.toString())
      })
      .props({
        button: fragment([
          span().class('map-name styled-name').html(name),
          strong(wr.player).class('map-player'),
          strong(wr.time).class('map-time'),
        ]),
        content: div().class('map-content').nest(
          div().class('map-details').nest(
            table([
              tr([th('Environment'), td(props.map.environment)]),
              tr([th('Author'), td(props.map.author)]),
              tr([th('Players'), td(props.map.records.length)]),
              tr([
                th('Latest play'),
                td().setup((ctx) => {
                  const record = sortedRecords.value[0]
                  const time = Number(`${record.unixDate}000`)
                  ctx.text(`${record.player} (${timeAgo(time)})`)
                  ctx.attr('data-title-top', formatDate(time))
                }),
              ]),
              tr([
                th('First-last gap'),
                td().setup((ctx) => {
                  const sorted = sortRecordsByTime(props.map.records)
                  const first = convertTimeToMs(sorted[0].time)
                  const last = convertTimeToMs(sorted.at(-1)!.time)
                  const formatted = convertMsToTime(first - last)
                  ctx.text(formatted)
                }),
              ]),
              tr([
                th('Average time'),
                td().setup((ctx) => {
                  const totalMs = props.map.records.reduce((group, item) => {
                    return group += convertTimeToMs(item.time)
                  }, 0)
                  ctx.text(convertMsToTime(totalMs / props.map.records.length))
                }),
              ]),
            ]),
          ),
          div().class('map-players').nest(RecordList().props({
            records: props.map.records,
          })),
        ),
      }),
  )
})
