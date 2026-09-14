import type { TrackmaniaRecord } from '../types'
import { button, computed, div, effect, fragment, img, Link, nav, onRouteResolve, p, ref, shallowRef, span, strong } from '@dolanske/pantry'
import { getMaps, getRecords, RECORDS_FETCH_TIMEOUT } from '../api'
import { timeAgo } from '../util/time'
import { throttle } from '../util/timing'
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

  return fragment().nest(
    LoadingBar().prop('active', loading),
    nav().class('navigation').nest(
      Link('/records').class('logo-wrap').nest(
        img('/logo.svg').alt('Hivecom Records Logo'),
      ),
      // Latest record fetching & display
      div().setup((ctx) => {
        const record = shallowRef<TrackmaniaRecord>()
        const mapName = ref()

        async function check() {
          const item = await getRecords().then(data => record.value = data[0])
          mapName.value = (await getMaps()).find(m => m.id === item.mapId)?.name
        }

        check()
        setInterval(check, RECORDS_FETCH_TIMEOUT)

        ctx.class('nav-latest')
        ctx.show(() => !!mapName.value)
        ctx.nest(
          span('Newest record!'),
          p(
            strong(() => record.value?.player),
            'drove',
            strong(() => record.value?.time),
            'on',
            strong(() => mapName.value),
          ),
          p(() => timeAgo(Number(`${record.value?.unixDate}000`))),
        )
      }),
      div().class('flex-1'),
      button().setup((ctx) => {
        const isDark = ref(isDefaultDark())

        effect(() => {
          localStorage.setItem('dark-theme', String(isDark.value))
          if (isDark.value)
            document.documentElement.classList.add('dark-theme')
          else
            document.documentElement.classList.remove('dark-theme')
        })

        const buttonIcon = computed(() => isDark.value ? Icon.sun : Icon.moon)

        ctx.class('nav-theme')
        ctx.class('active', isDark)
        ctx.click(() => isDark.value = !isDark.value)
        ctx.html(buttonIcon)
        ctx.attr('data-title-left', 'Switch Theme')
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
