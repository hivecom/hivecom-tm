import type { TrackmaniaMap } from '../../types'
import { canvas, div, h5, li, navigate, span, strong, ul } from '@dolanske/pantry'

import { Chart } from 'chart.js'
import { PieOptions } from '../../util/common'
import { convertTimeToMs } from '../../util/format'

function Cell(title: string, value: string | number, mapId?: number) {
  return li().setup((ctx) => {
    if (mapId) {
      ctx.attr('aria-role', 'button')
      ctx.class('clickable')
      ctx.click(() => {
        navigate('/records', {
          hash: mapId,
        })
      })
    }

    ctx.nest(
      strong().html(String(value)),
      span(title),
    )
  })
}

export default function ProcessMaps(data: TrackmaniaMap[]) {
  // Datasets
  const totalMaps = data.length
  const authors = data.reduce<string[]>((group, item) => {
    if (!group.includes(item.author)) {
      group.push(item.author)
    }
    return group
  }, [])
  // @ts-expect-error This will run in stable node 21
  const environments: Record<string, TrackmaniaMap[]> = Object.groupBy(data, ({ environment }) => environment)
  const sortedEnvironments = Object.values(environments).sort((a, b) => a.length > b.length ? -1 : 1)

  const sortedByRecords = data.toSorted((a, b) => a.records.length > b.records.length ? -1 : 1)

  const sortedByTime = data.toSorted((a, b) => {
    const aVg = a.records.reduce((num, item) => num += convertTimeToMs(item.time), 0) / a.records.length
    const bVg = b.records.reduce((num, item) => num += convertTimeToMs(item.time), 0) / b.records.length
    return aVg > bVg ? -1 : 1
  })

  const sortedByNameLength = data.toSorted((a, b) => a.name.length > b.name.length ? -1 : 1)
  const sortedByStyledName = data.toSorted((a, b) => a.name_styled.length > b.name_styled.length ? -1 : 1)

  const longestMap = sortedByTime[0]
  const shortestMap = sortedByTime.at(-1)!

  const longestName = sortedByNameLength[0]
  const shortestName = sortedByNameLength.at(-1)!

  return div().class('maps-wrapper').nest(
    div().class('top-level-stats').nest(
      ul().nest(
        Cell('Maps', totalMaps),
        Cell('Authors', authors.length),
        Cell('Most played', sortedByRecords[0].name, sortedByRecords[0].id),
        Cell('Shortest map', shortestMap.name, shortestMap.id),
        Cell('Longest map', longestMap.name, longestMap.id),
        Cell('Most styled name', sortedByStyledName[0].name_styled, sortedByStyledName[0].id),
        Cell('Shortest name', shortestName.name, shortestName.id),
        Cell('Longest name', longestName.name, longestName.id),
      ),
    ),
    // div().class('split-wrapper').class('normal').nest([
    //   div(),
    //   div().nest(
    //     h5('Top 10 maps'),
    //     ul().class('map-stats').for(
    //       sortedByRecords.slice(0, 10),
    //       (map, index) => {
    //         return li(
    //           map.name
    //         )
    //       }
    //     )
    //   )
    // ]),
    div().class('split-wrapper').nest(
      div(
        div().class('chart-wrap').nest(
          canvas().id('environment-chart').setup((ctx) => {
            ctx.onMount(() => {
              const chart = new Chart(
                ctx.el as HTMLCanvasElement,
                {
                  ...PieOptions,
                  data: {
                    labels: Object.keys(environments),
                    datasets: [{
                      data: Object.values(environments).map(item => item.length),
                    }],
                  },
                },
              )
              return () => chart.destroy()
            })
          }),
        ),
      ),
      div([
        h5('Environments'),
        ul().class('player-stats').for(
          sortedEnvironments,
          (env, index) => {
            const uniquePlayers = env.reduce((group, item) => {
              for (const record of item.records) {
                if (!group.includes(record.player))
                  group.push(record.player)
              }
              return group
            }, [] as string[])

            return li().nest(
              div().class('title').nest(
                span(`#${index + 1}`).style({ color: 'var(--color-text-lighter)' }),
                span(env[0].environment),
              ),
              div().class('numbers').nest(
                div().nest(
                  span('Maps'),
                  strong(env.length),
                ),
                div().nest(
                  span('Players'),
                  strong(uniquePlayers.length),
                ),
              ),
            )
          },
        ),
      ]),
    ),
  )
}
