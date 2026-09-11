import type { Component } from '@dolanske/pantry'

export function onClickOutside(ctx: Component<any>, onClose: () => void) {
  function handler(e: MouseEvent) {
    if (e.target && ctx.el && !ctx.el.contains(e.target as HTMLElement)) {
      onClose()
    }
  }

  ctx.onMount(() => document.addEventListener('click', handler))
  ctx.onDestroy(() => document.removeEventListener('click', handler))
}
