import { reusable } from '@dolanske/pantry'
import { getFlagHTML } from './Icon'

interface Props {
  player: string
  country: string
}

export default reusable<Props>('span', (ctx, props) => {
  ctx.class('player-item')
  ctx.html(`${getFlagHTML(props.country)} ${props.player}`)
})
