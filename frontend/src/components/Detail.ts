import type { Component, MaybeRef } from '@dolanske/pantry'
import { button, div, isRef, ref, reusable, watch } from '@dolanske/pantry'

interface Props {
  button: Component<any>
  content: Component<any>
  open?: MaybeRef<boolean>
}

interface Emits {
  interaction: boolean
}

export default reusable<Props, Emits>('div', (ctx, props) => {
  const open = isRef(props.open) ? props.open : ref(props.open || false)

  ctx.class('details')

  ctx.nest(
    button(props.button)
      .if(() => props.button)
      .class('details-button')
      .class({ active: open })
      .click(() => {
        open.value = !open.value
        ctx.emit('interaction', open.value)
      }),
    div().setup((ctx) => {
      ctx.class('details-content')

      const setHeight = () => {
        ctx.el.style.maxHeight = open.value ? `${ctx.el.scrollHeight}px` : '0px'
      }

      const release = watch(open, setHeight, { immediate: true })
      ctx.onDestroy(release)

      ctx.nest(
        div().setup((inner) => {
          inner.nest(props.content)

          const observer = new ResizeObserver(() => {
            if (open.value)
              ctx.el.style.maxHeight = `${ctx.el.scrollHeight}px`
          })

          observer.observe(inner.el)
          inner.onDestroy(() => observer.disconnect())
        }),
      )
    }),
  )
})
