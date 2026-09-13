import type { Ref } from '@dolanske/pantry'
import type { TrackmaniaMap } from '../types'
import { computed, div, fragment, reusable, span, strong, table, td, th, toValue, tr } from '@dolanske/pantry'
import { timeAgo } from '../util/time'
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

  ctx.nest(
    Detail()
      .on('interaction', (_, isOpen: boolean) => {
        const url = new URL(window.location.href)
        url.hash = isOpen ? props.map.id.toString() : ''
        history.replaceState(null, '', url.toString())
      })
      .props({
        button: fragment([
          span().class('map-name').html(name),
          strong(wr.player).class('map-player'),
          strong(wr.time).class('map-time'),
        ]),
        content: div().class('map-content').nest(
          div().class('map-details').nest(
            table([
              tr([th('Environment'), td(props.map.environment)]),
              tr([th('Author'), td(props.map.author)]),
              tr([th('Records'), td(props.map.records.length)]),
              tr([th('Latest time'), td().setup((ctx) => {
                const latest = props.map.records[0]
                ctx.text(`${latest.player}, ${timeAgo(Number(`${latest.unixDate}000`))}`)
              })]),
            ]),
          ),
          div().class('map-players').nest(RecordList().props({
            records: props.map.records,
          })),
        ),
      }),
  )
})
