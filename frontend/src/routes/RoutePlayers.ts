import type { RouteProps } from '@dolanske/pantry'
import type { TrackmaniaPlayer } from '../types'
import { computed, div, Link, p, ref, span, strong, table, tbody, td, th, thead, tr } from '@dolanske/pantry'

import InputSearch from '../components/form/InputSearch'
import Player from '../components/Player'
import { searchInStr } from '../util/search-in'
import { timeAgo } from '../util/time'

export default div<RouteProps<TrackmaniaPlayer[]>>().setup((ctx, props) => {
  const $players = props.$data
  const search = ref('')
  const toRender = computed(() => {
    return $players
      .filter(item => searchInStr([item.name], search.value))
      .sort((a, b) => a.records > b.records ? -1 : 1)
  })

  ctx.class('container').class('route-players')
  ctx.nest(
    div().class('filter-wrap').class('players').nest(
      InputSearch().props({
        placeholder: 'Search players',
        modelValue: search,
      }),
    ),
    div().class('route-players-container').nest(
      table().nest(
        thead(
          tr([
            th('Player'),
            th('Latest record'),
            th('Maps played'),
            th('Records'),
          ]),
        ),
        tbody().for(toRender, (item, index) => {
          const { name, country, records, maps, latest } = item
          return tr().key(name).nest([
            td().nest([
              span(`#${index + 1}`).class('player-position'),
              Player().props({ player: name, country }),
            ]),
            latest
              ? td().nest(
                  Link('/records', [
                    p().class('latest-record').nest(
                      strong(latest.time),
                      span(latest.map_name),
                    ),
                    span(timeAgo(Number(`${latest.unix_date}000`))),
                  ], { hash: latest.id }),
                )
              : td(),
            td(maps),
            latest
              ? td().nest(Link('/records', records, { query: {
                  player: name,
                } }))
              : td(records),
          ])
        }),
      ),
    ),
  )
})
