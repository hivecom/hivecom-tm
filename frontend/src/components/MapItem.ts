import type { Ref } from '@dolanske/pantry'
import type { TrackmaniaMap } from '../types'
import { computed, div, fragment, getRoute, ref, reusable, span, strong, table, td, th, tr } from '@dolanske/pantry'

import { timeAgo } from '../util/time'
import Detail from './Detail'
import RecordList from './RecordList'

interface Props {
  map: TrackmaniaMap
  showFormattedNames: Ref<boolean>
  isNewRecord: Ref<boolean>
}

export default reusable<Props>('li', (ctx, props) => {
  const wr = props.map.records.toSorted((a, b) => a.time > b.time ? 1 : -1)[0]
  const name = computed(() => props.showFormattedNames.value ? props.map.name_styled : props.map.name)
  const active = ref(false)

  ctx.onMount(() => {
    const route = getRoute()
    if (route && Number(route.hash) === props.map.id) {
      active.value = true
    }
  })

  ctx.class('new-record', props.isNewRecord)
  ctx.class('map-item').class('is-highlight', active)

  ctx.id(props.map.id)

  ctx.nest(
    Detail().props({
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
              const latest = props.map.records.sort((a, b) => a.unixDate > b.unixDate ? -1 : 1)[0]
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
