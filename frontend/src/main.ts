import { createApp } from '@dolanske/pantry'
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
  },
  '/stats': {
    component: RouteStats,
    loader: () => {
      return Promise.all([
        getMaps(),
        getPlayers(),
      ])
    },
  },
  '/players': {
    component: RoutePlayers,
    loader: () => getPlayers(),
  },
})

app.run('#router')

// Mount navigation outside of the router boundary so it persists between
// page navigations.
Navigation().mount('#nav')
