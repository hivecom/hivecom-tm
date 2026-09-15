import type { MaybeRefOrGetter } from '@dolanske/pantry'
import { computed, reusable, toValue } from '@dolanske/pantry'
import { getFlagHTML } from './Icon'

interface Props {
  player: MaybeRefOrGetter<string>
  country: string
}

export default reusable<Props>('span', (ctx, props) => {
  ctx.class('player-item styled-name')
  const text = computed(() => `${getFlagHTML(props.country)} ${toValue(props.player)}`)
  ctx.html(text)
})
