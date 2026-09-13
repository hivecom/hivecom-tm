import type { MaybeRef, Ref } from '@dolanske/pantry'
import { button, computed, input, reusable, span } from '@dolanske/pantry'
import { Icon } from '../Icon'

interface Props {
  disabled?: MaybeRef<boolean>
  placeholder?: MaybeRef<string>
  modelValue: Ref<string>
  noIcon?: boolean
}

export default reusable<Props>('div', (ctx, props) => {
  const hasInput = computed(() => props.modelValue.value.length > 0)
  const Input = input('text')
    .placeholder(props.placeholder)
    .model(props.modelValue)
    .attr('disabled', props.disabled === true)

  ctx.class('form-item').class('form-search').class({ 'has-input': hasInput })

  ctx.nest(
    span().class('form-search-icon').html(Icon.search),
    Input,
    button().class('form-clear-icon').html(Icon.close).show(hasInput).click(() => {
      props.modelValue.value = ''
    }),
  )
})
