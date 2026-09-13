import type { Country } from '../../countries'
import type { TrackmaniaPlayer } from '../../types'
import { canvas, computed, div, li, p, ref, span, strong, ul, watch } from '@dolanske/pantry'

import Chart from 'chart.js/auto'
import { getCountry } from '../../countries'
import { partialPercentage, PieOptions } from '../../util/common'
import InputSelect from '../form/InputSelect'
import { getFlagHTML } from '../Icon'

type CountryStats = Record<string, {
  country: Country
  records: number
  players: TrackmaniaPlayer[]
}>

export default function ProcessPlayers(data: TrackmaniaPlayer[]) {
  // Sorting and rendering
  const sortingOptions = ['Players', 'Records'] as const
  const sortingOn = ref<'Players' | 'Records'>(sortingOptions[1])
  //

  const countriesRaw = data.reduce<CountryStats>((group, item) => {
    if (group[item.country]) {
      group[item.country].players.push(item)
      group[item.country].records += item.records
    }
    else {
      group[item.country] = {
        country: getCountry(item.country.toUpperCase() as any),
        records: item.records,
        players: [item],
      }
    }
    return group
  }, {})

  // Sort dataset and remove invalid countries
  const countriesSorted = computed(() => Object
    .values(countriesRaw)
    .filter(item => item.country)
    .sort((a, b) => {
      if (sortingOn.value === 'Players') {
        return a.players.length > b.players.length ? -1 : 1
      }
      return a.records > b.records ? -1 : 1
    }),
  )
  // Summed up totals from the dataset
  const total = computed(() => {
    return countriesSorted.value.reduce((group, item) => {
      group.players += item.players.length
      group.records += item.records
      return group
    }, { records: 0, players: 0 })
  })

  return div().class('split-wrapper').nest(
    div(
      div().class('chart-wrap').nest(
        canvas().id('player-chart').setup((ctx) => {
          let chart: Chart<'pie'> | undefined
          ctx.onMount(() => {
            chart = new Chart(
              ctx.el as HTMLCanvasElement,
              {
                ...PieOptions,
                data: {
                  labels: countriesSorted.value.map(item => item.country.name),
                  datasets: [{
                    label: 'Players',
                    data: countriesSorted.value.map(item => item.players.length),
                  }],
                },
              },
            )
            return () => {
              chart?.destroy()
              chart = undefined
            }
          })

          // Update chart when datasets change
          watch(sortingOn, (on) => {
            if (chart) {
              if (on === 'Players') {
                chart.data = {
                  labels: countriesSorted.value.map(item => item.country.name),
                  datasets: [{
                    label: 'Players',
                    data: countriesSorted.value.map(item => item.players.length),
                  }],
                }
              }
              else {
                chart.data = {
                  labels: countriesSorted.value.map(item => item.country.name),
                  datasets: [{
                    label: 'Records',
                    data: countriesSorted.value.map(item => item.records),
                  }],
                }
              }

              chart.update()
            }
          })
        }),
        p().html(`<b>${data.length}</b> players from <b>${countriesSorted.value.length}</b> countries`),
      ),
    ),
    ul().class('player-stats').for(countriesSorted, (country) => {
      return li().key(country.country.code).nest(
        div().class('title').nest(
          span().html(getFlagHTML(country.country.code, 32)),
          span(country.country.name),
        ),
        div().class('numbers').nest(
          div().nest(
            span('Players'),
            strong().html(`${country.players.length} <i>(${partialPercentage(country.players.length, total.value.players)}%)</i>`),
          ),
          div().nest(
            span('Records'),
            strong().html(`${country.records} <i>(${partialPercentage(country.records, total.value.records)}%)</i>`),
          ),
        ),
      )
    }),
    InputSelect().style('width', '116px').props({
      label: 'Sorting on',
      options: sortingOptions,
      modelValue: sortingOn,
      single: true,
      showSelected: true,
    }).attr('data-title-left', 'Sort by'),
  )
}
