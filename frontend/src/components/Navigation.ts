import type { TrackmaniaMap, TrackmaniaRecord } from '../types'
import { button, computed, div, effect, fragment, hr, img, Link, nav, onRouteResolve, p, ref, shallowRef, span, strong } from '@dolanske/pantry'
import { getMaps, getRecords, RECORDS_FETCH_TIMEOUT } from '../api'
import { showStyledMapnames, showStyledUsernames } from '../config'
import { timeAgo } from '../util/time'
import { throttle } from '../util/timing'
import Dropdown from './Dropdown'
import InputCheckbox from './form/InputCheckbox'
import { Icon } from './Icon'
import LoadingBar from './LoadingBar'

function isDefaultDark() {
  const defaultState = localStorage.getItem('dark-theme')
  if (defaultState === 'true')
    return true
  if (defaultState === 'false')
    return false
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function () {
  const buttons = ['records', 'stats', 'players']

  // Loading only runs once on first load
  const loading = ref(true)

  onRouteResolve(async () => {
    loading.value = false
  })

  // Theme
  const isDark = ref(isDefaultDark())

  effect(() => {
    localStorage.setItem('dark-theme', String(isDark.value))
    if (isDark.value)
      document.documentElement.classList.add('dark-theme')
    else
      document.documentElement.classList.remove('dark-theme')
  })

  const buttonIcon = computed(() => isDark.value ? Icon.sun : Icon.moon)

  return fragment().nest(
    LoadingBar().prop('active', loading),
    nav().class('navigation').nest(
      Link('/records').class('logo-wrap').nest(
        img('/logo.svg').alt('Hivecom Records Logo'),
      ),
      // Latest record fetching & display
      div().setup((ctx) => {
        const record = shallowRef<TrackmaniaRecord>()
        const map = ref<TrackmaniaMap>()

        async function check() {
          const item = await getRecords().then(data => record.value = data[0])
          map.value = (await getMaps()).find(m => m.id === item.mapId)
        }

        check()
        setInterval(check, RECORDS_FETCH_TIMEOUT)

        ctx.class('nav-latest')
        ctx.show(() => !!map.value)
        ctx.nest(
          span('Newest record!'),
          p(
            // @ts-expect-error Undefined won't be shown to the UI
            strong().html(() => showStyledUsernames ? record.value?.playerStyled : record.value?.player),
            'drove',
            strong(() => record.value?.time),
            'on',
            // @ts-expect-error Undefined won't be shown to the UI
            strong().html(() => showStyledMapnames ? map.value?.name_styled : map.value.name),
          ),
          p(() => timeAgo(Number(`${record.value?.unixDate}000`))),
        )
      }),
      div().class('flex-1'),
      Dropdown().props({
        button: 'Config',
        buttonClass: 'form-item',
        content: fragment().nest([
          div().class('flex between align w-100').nest(
            span(() => isDark.value ? 'Use light theme' : 'Use dark theme'),
            InputCheckbox().props({
              modelValue: isDark,
              icon: buttonIcon,
            }),
          ),
          hr(),
          div().class('flex between align w-100').nest(
            span('Show styled player names'),
            InputCheckbox().props({
              modelValue: showStyledUsernames,
              icon: Icon.checkmark,
            }),
          ),
          hr(),
          div().class('flex between align w-100').nest(
            span('Show styled map names'),
            InputCheckbox().props({
              modelValue: showStyledMapnames,
              icon: Icon.checkmark,
            }),
          ),
        ]),
      }),
      div()
        .class('nav-links')
        .style('grid-template-columns', `repeat(${buttons.length}, 1fr)`)
        .for(buttons, link => Link(`/${link}`, link, { activeClass: 'active' })),
      button()
        .setup((ctx) => {
          // Scrolling check
          const showScrollUp = ref(false)
          window.addEventListener('scroll', throttle(() => {
            showScrollUp.value = window.scrollY > 256
          }, 50))
          ctx.class({ active: showScrollUp })
        })
        .class('scroll-up')
        .html(Icon.arrowUp)
        .attr('data-title-top', 'Scroll up')
        .click(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth',
          })
        }),
    ),
  )
}
