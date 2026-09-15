import type { ComponentChildren } from '@dolanske/pantry'
import { button, div, ref, reusable } from '@dolanske/pantry'
import { onClickOutside } from '../hooks/onClickOutside'

interface Props {
  button: ComponentChildren<any>
  buttonClass: string
  content: ComponentChildren<any>
  contentClass: string
}

interface Emit {
  close: void
}

export default reusable<Props, Emit>('div', (ctx, props) => {
  const open = ref(false)

  onClickOutside(ctx, () => {
    open.value = false
  })

  ctx.class('form-select config')
  ctx.nest(
    button()
      .class('select-button')
      .class(props.buttonClass)
      .nest(props.button)
      .click(() => open.value = true),
    div()
      .class('form-select-dropdown')
      .if(open)
      .nest(props.content),
  )
})
