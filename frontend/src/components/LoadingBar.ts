import type { Ref } from '@dolanske/pantry'
import { div, effect, ref, reusable } from '@dolanske/pantry'

interface Props {
  active: Ref<boolean>
}

export default reusable<Props>('div', (ctx, props) => {
  ctx.class('loading-bar')
  const offsetActive = ref(false)

  effect(() => {
    if (props.active.value) {
      offsetActive.value = true
    }
    else {
      setTimeout(() => {
        offsetActive.value = false
      }, 300)
    }
  })

  ctx.nest(
    div()
      .class('bar')
      .class('animate', offsetActive),
  )
})
