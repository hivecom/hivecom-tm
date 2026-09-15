import type { MaybeRef, Ref } from '@dolanske/pantry'
import { createId, input, label, reusable } from '@dolanske/pantry'

interface Props {
  modelValue: Ref<boolean>
  icon: MaybeRef<string>
}

export default reusable<Props>('div', (ctx, props) => {
  const id = createId()
  // For this project, checkbox is a simple toggleable icon
  ctx.class('form-checkbox')
  ctx.nest(
    input('checkbox')
      .name(id)
      .id(id)
      .checked(props.modelValue)
      .on('input', (e) => {
        props.modelValue.value = (e.target as HTMLInputElement).checked
      }),
    label().attr('for', id).html(props.icon),
  )
})
