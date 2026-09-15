import type { RouteProps } from '@dolanske/pantry'
import type { TrackmaniaMap, TrackmaniaPlayer } from '../types'
import { button, computed, div, getRoute, nextTick, ref, shallowRef, span, ul, watch } from '@dolanske/pantry'
import { getMaps, getRecords, RECORDS_FETCH_TIMEOUT } from '../api'
import InputCheckbox from '../components/form/InputCheckbox'
import InputSearch from '../components/form/InputSearch'
import InputSelect from '../components/form/InputSelect'
import HuntingSuggestions from '../components/HuntingSuggestions'
import { Icon } from '../components/Icon'
import MapItem from '../components/MapItem'
import Modal from '../components/Modal'
import { sortRecordsByLatest } from '../util/common'
import { searchInStr } from '../util/search-in'

function extractKey(data: TrackmaniaMap[], key: keyof TrackmaniaMap) {
  return data
    .reduce((group, item) => {
      if (!group.includes(item[key] as string))
        group.push(item[key] as string)
      return group
    }, [] as string[])
    .sort()
}

export default div<RouteProps<[number[], TrackmaniaMap[], TrackmaniaPlayer[]]>>().setup((ctx, props) => {
  const $records = shallowRef(props.$data[0])
  const $maps = shallowRef(props.$data[1])
  const $players = props.$data[2]
  const search = ref('')

  // Environments
  const envFilters = ref<string[]>([])
  const envOptions = computed(() => extractKey($maps.value, 'environment'))

  // Players
  const plaFilter = ref<string>('')
  const plaOptions = $players
    .reduce((group, item) => {
      group.push(item.name)
      return group
    }, [] as string[])
    .sort()

  // Authors
  const autFilters = ref<string[]>([])
  const autOptions = computed(() => extractKey($maps.value, 'author'))

  // Sorting
  const sortOptions = ['Name', 'Activity', 'Most played', 'Least played']
  const sort = ref('')

  // Checkboxes
  const showFormattedNames = ref(true)

  // Apply filters
  const toRender = computed(() => $maps.value
    // Make sure every selected player is in the map's saved records
    .filter(item => (
      plaFilter.value.length > 0
        ? item.records.find(({ player }, index) => player === plaFilter.value && index === 0)
        : true
          && envFilters.value.length > 0
          ? envFilters.value.includes(item.environment)
          : true
            && autFilters.value.length > 0
            ? autFilters.value.includes(item.author)
            : true
    ))
    .filter(item => searchInStr(item.name, search.value))
    .toSorted((a, b) => {
      switch (sort.value) {
        case 'Name': return a.name
          .replace(/[^a-z0-9 ]/gi, '')
          .trim()
          .toLowerCase()
          .localeCompare(b.name.replace(/[^a-z0-9 ]/gi, '').trim().toLowerCase())
        case 'Activity': {
          const aLatest = sortRecordsByLatest(a.records)[0]
          const bLatest = sortRecordsByLatest(b.records)[0]
          return aLatest.unixDate > bLatest.unixDate ? -1 : 1
        }
        case 'Most played': return b.records.length - a.records.length
        case 'Least played': return a.records.length - b.records.length
        default: return Number($records.value.includes(b.id)) - Number($records.value.includes(a.id))
      }
    }),
  )

  const noMapsFoundMessage = computed(() => {
    if (plaFilter.value) {
      return `Looks like ${plaFilter.value} does not hold any records.`
    }

    return 'Looks like there are no maps here'
  })

  // Fetch new records every couple minutes
  const interval = setInterval(async () => {
    getRecords().then(data => $records.value = data.map(r => r.mapId))
    getMaps().then(data => $maps.value = data)
  }, RECORDS_FETCH_TIMEOUT)

  ctx.onDestroy(() => clearInterval(interval))

  let pauseUrlSync = false
  const activeMapId = ref(-1)

  // Scroll maps into view
  ctx.onMount(() => {
    nextTick(() => {
      const route = getRoute()
      activeMapId.value = Number(route?.hash.replace('#', '')) ?? -1

      nextTick(() => {
        const el = document.querySelector('.map-item.is-highlight')
        if (!el) {
          return
        }

        window.scrollTo({
          top: el.getBoundingClientRect().top - window.innerHeight / 2,
          behavior: 'instant',
        })
      })
    })

    // Update all filters if URL has any
    pauseUrlSync = true

    const params = new URLSearchParams(window.location.search)

    const urlPlayer = params.get('player')
    if (urlPlayer && plaOptions.includes(urlPlayer)) {
      plaFilter.value = urlPlayer
    }

    const urlAuthors = params.get('authors')
    if (urlAuthors) {
      const parsed: string[] = JSON.parse(urlAuthors)
      autFilters.value = parsed
    }

    const urlEnvironments = params.get('environments')
    if (urlEnvironments) {
      const parsed: string[] = JSON.parse(urlEnvironments)
      envFilters.value = parsed
    }

    nextTick(() => pauseUrlSync = false)
  })

  watch([plaFilter, autFilters, envFilters], () => {
    if (pauseUrlSync) {
      return
    }

    // const query = {}
    const params = new URLSearchParams()

    if (plaFilter.value) {
      params.set('player', plaFilter.value)
    }

    if (autFilters.value.length > 0) {
      params.set('authors', JSON.stringify(autFilters.value))
    }

    if (envFilters.value.length > 0) {
      params.set('environments', JSON.stringify(envFilters.value))
    }

    const url = `${location.pathname}${params.size > 0 ? `?${params.toString()}` : ''}${location.hash}`
    history.replaceState(history.state, '', url)
  }, { deep: true })

  const activeFilters = computed(() => plaFilter.value || autFilters.value.length || envFilters.value.length || sort.value)

  // Modal setup
  const modalOpen = ref(false)

  ctx.class('container').class('route-map-list')
  ctx.nest(
    Modal()
      .props({
        content: HuntingSuggestions()
          .props({
            records: $records.value,
            maps: $maps,
            players: $players,
          }),
        open: modalOpen,
      })
      .on('close', () => modalOpen.value = false),
    div().class('filter-wrap').nest(
      InputSearch().props({
        placeholder: 'Search maps',
        modelValue: search,
      }).class('flex-1'),
      InputSelect().props({
        label: 'Environment',
        options: envOptions,
        modelValue: envFilters,
      }),
      InputSelect().props({
        label: 'Author',
        options: autOptions,
        modelValue: autFilters,
      }),
      InputSelect().props({
        label: 'Player',
        options: plaOptions,
        modelValue: plaFilter,
        single: true,
      }).attr('data-title-left', 'Show specific player\'s records'),
      InputSelect().props({
        label: 'Sort',
        options: sortOptions,
        modelValue: sort,
        showSearch: false,
        single: true,
      }).attr('data-title-left', 'Sort maps'),
      // InputCheckbox().props({
      //   modelValue: showFormattedNames,
      //   icon: Icon.palette,
      // }).attr('data-title-left', 'Show formatted map names'),
      button()
        .html(Icon.timer)
        .class('button form-item round-btn')
        .attr('data-title-left', 'Map hunting suggestions')
        .click(() => modalOpen.value = true),
      button()
        .html(Icon.close)
        .class('button form-item round-btn')
        .disabled(() => !activeFilters.value)
        .click(() => {
          plaFilter.value = ''
          autFilters.value = []
          envFilters.value = []
          sort.value = ''
        })
        .attr('data-title-left', 'Clear filters'),
    ),
    div().class('map-list').nest(
      ul().for(toRender, (map) => {
        return MapItem()
          .key(map.id)
          .class('is-highlight', () => map.id === activeMapId.value)
          .on('interaction', () => activeMapId.value = -1)
          .props({
            map,
            showFormattedNames,
            isNewRecord: computed(() => $records.value.includes(map.id)),
          })
      }),
      div(span(noMapsFoundMessage))
        .if(() => toRender.value.length === 0)
        .class('empty-state'),
    ),
  )
})
