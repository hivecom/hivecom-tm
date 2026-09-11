import type { MaybeRef, Ref } from '@dolanske/pantry'
import { button, computed, div, ref, reusable, span, unref } from '@dolanske/pantry'

import { onClickOutside } from '../../hooks/onClickOutside'
import { Icon } from '../Icon'

// Maybe in the future:
// showSelected=true when single=false (not used in the app, not needed)

interface Props {
  modelValue: Ref<string[]> | Ref<string>
  options: MaybeRef<readonly string[]>
  label: MaybeRef<string>
  single?: boolean
  showSelected?: boolean
}

export default reusable<Props>('div', (ctx, props) => {
  const open = ref(false)

  // Check for clicking outside and close dropdown
  onClickOutside(ctx, () => {
    open.value = false
  })

  // Options
  const labelToShow = computed(() => {
    const _options = unref(props.options)
    const _values = props.modelValue.value

    if (props.showSelected) {
      if (props.single) {
        return _values as any as string
      }
    }

    if (_options.some(option => _values.includes(option))) {
      const count = _options.reduce((group, item) => {
        if (_values.includes(item)) {
          group += 1
        }
        return group
      }, 0)
      return `${count} selected`
    }
    return unref(props.label)
  })

  ctx.class('form-item').class('form-select').class({
    'has-input': computed(() => props.modelValue.value.length > 0),
  })
  ctx.nest(
    button()
      .class('select-button')
      .click(() => open.value = !open.value)
      .nest(
        span().text(labelToShow),
        span().html(Icon.chevronDown),
      ),
    div().if(open).class('form-select-dropdown').for(props.options, (option: string) => {
      const isActive = computed(() => props.modelValue.value.includes(option))
      return button(option)
        .class('button')
        .class('active', isActive)
        .click(() => {
          const model = props.modelValue
          if (props.single || !Array.isArray(model.value)) {
            model.value = option
            open.value = false
          }
          else if (model.value.includes(option)) {
            model.value = model.value.filter(a => a !== option)
          }
          else {
            model.value.push(option)
          }
        })
    }),
  )
})
