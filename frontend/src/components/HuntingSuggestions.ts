import type { Ref } from '@dolanske/pantry'
import type { TrackmaniaMap, TrackmaniaPlayer } from '../types'
import { div, fragment, hr, p, ref, reusable, shallowRef, span, ul, watch } from '@dolanske/pantry'
import { convertTimeToMs } from '../util/format'
import Detail from './Detail'
import InputSelect from './form/InputSelect'
import { Icon } from './Icon'
import MapItem from './MapItem'

interface Props {
  records: number[]
  maps: Ref<TrackmaniaMap[]>
  players: TrackmaniaPlayer[]
}

export default reusable<Props>('div', (ctx, props) => {
  ctx.class('hunting card')

  const player = ref<string>('')
  const playerOptions = props.players
    .reduce((group, item) => {
      group.push(item.name)
      return group
    }, [] as string[])
    .sort()

  const itemCount = ref('5')
  const itemCountOptions = ['5', '10', '20', '30']

  const closeMaps = shallowRef<TrackmaniaMap[]>([])
  const badMaps = shallowRef<TrackmaniaMap[]>([])
  const rarelyPlayed = shallowRef<TrackmaniaMap[]>([])

  // Recomputed whenever map count or player changes
  watch([player, itemCount], () => {
    const count = Number(itemCount.value)

    // Only return maps where the current player is and has more than 1 record and the player is not the WR holder
    const scope = props.maps.value
      .filter(map =>
        map.records.length > 1
        && map.records[0].player
        && map.records.some(item => item.player === player.value))

    // 1. Sort by difference between you (2nd) and the first place + when the record was taken
    closeMaps.value = scope
      .filter(map => map.records[1].player === player.value)
      .toSorted((a, b) => {
        const aDiff = convertTimeToMs(a.records[1].time) - convertTimeToMs(a.records[0].time)
        const bDiff = convertTimeToMs(b.records[1].time) - convertTimeToMs(b.records[0].time)
        return aDiff > bDiff ? 1 : -1
      })
      .slice(0, count)

    // 2. Sort by amount of records and your position
    badMaps.value = scope
      .toSorted((a, b) => a.records.length > b.records.length ? 1 : -1)
      .toSorted((a, b) => {
        const aPos = a.records.findIndex(r => r.player === player.value)
        const bPos = b.records.findIndex(r => r.player === player.value)
        return aPos > bPos ? -1 : 1
      })
      .slice(0, count)

    // 3. Sort maps by when you got your record, oldest to newest
    rarelyPlayed.value = scope
      .toSorted((a, b) => {
      // Type cast, because we alreadyt filtered the scope and we know the player is there
        const aTime = a.records.find(r => r.player === player.value)?.unixDate as number
        const bTime = b.records.find(r => r.player === player.value)?.unixDate as number
        return aTime > bTime ? 1 : -1
      })
      .slice(0, count)
  })

  ctx.nest(
    div().class('hunting-header').nest(
      p('Personalized list of suggested maps to hunt based your activity & records.'),
      div(
        InputSelect()
          .props({
            label: 'Select your username',
            options: playerOptions,
            modelValue: player,
            single: true,
          })
          .class('flex-1'),
        InputSelect()
          .props({
            options: itemCountOptions,
            modelValue: itemCount,
            showSearch: false,
            single: true,
          })
          .attr('data-title-top', 'Maps per section'),
      ).class('flex gap-8'),
    ),
    div()
      .if(() => !!player.value)
      .class('hunting-content')
      .nest(
        Detail().props({
          open: true,
          button: fragment().nest(
            span('Maps you\'re in reach of the record'),
            span().html(Icon.expand),
          ),
          content: ul().for(closeMaps, map => MapItem().key(map.id).props({ map })),
        }),
        hr(),
        Detail().props({
          button: fragment().nest(
            span('Maps you don\'t excel at'),
            span().html(Icon.expand),
          ),
          content: ul().for(badMaps, map => MapItem().key(map.id).props({ map })),
        }),
        hr(),
        Detail().props({
          button: fragment().nest(
            span('Maps you haven\'t played in a while'),
            span().html(Icon.expand),
          ),
          content: ul().for(rarelyPlayed, map => MapItem().key(map.id).props({ map })),
        }),
      ),
  )
})
