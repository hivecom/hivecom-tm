import { createApp, onNavigation } from '@dolanske/pantry'
import { getMaps, getPlayers, getRecords } from './api'
import Navigation from './components/Navigation'
import RouteList from './routes/RouteList'
import RoutePlayers from './routes/RoutePlayers'
import RouteStats from './routes/RouteStats'
import './style/index.scss'

export const app = createApp({
  '/records': {
    default: true,
    component: RouteList,
    loader: () => {
      return Promise.all([
        getRecords(),
        getMaps(),
        getPlayers(),
      ])
    },
    meta: {
      title: 'Records',
    },
  },
  '/stats': {
    component: RouteStats,
    loader: () => {
      return Promise.all([
        getMaps(),
        getPlayers(),
      ])
    },
    meta: {
      title: 'Stats',
    },
  },
  '/players': {
    component: RoutePlayers,
    loader: () => getPlayers(),
    meta: {
      title: 'Players',
    },
  },
})

onNavigation((route) => {
  document.title = `${route.meta?.title} :: Hivecom Records`
})

app.run('#router')

// Mount navigation outside of the router boundary so it persists between
// page navigations.
Navigation().mount('#nav')
