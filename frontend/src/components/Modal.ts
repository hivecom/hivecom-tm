import type { Component, Ref } from '@dolanske/pantry'
import { div, ref, reusable } from '@dolanske/pantry'

interface Props {
  open: Ref<boolean>
  content: Component
}

interface Emits {
  close: void
}

export default reusable<Props, Emits>('div', (ctx, props) => {
  const mouseDownOnBackdrop = ref(false)

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      ctx.emit('close')
    }
  }

  ctx.onMount(() => {
    window.addEventListener('keydown', onKeydown)
  })

  ctx.onBeforeDestroy(() => {
    window.removeEventListener('keydown', onKeydown)
  })

  ctx.class('modal-backdrop')
  ctx.on('mousedown', (e: MouseEvent) => {
    mouseDownOnBackdrop.value = e.target === e.currentTarget
  })

  ctx.click((e: MouseEvent) => {
    if (e.target === e.currentTarget && mouseDownOnBackdrop.value) {
      ctx.emit('close')
    }
    mouseDownOnBackdrop.value = false
  })

  ctx.if(() => props.open.value)

  ctx.nest(
    div(
      props.content,
    ).class('modal-content'),
  )
})
