import type { MaybeRef, Ref } from '@vue/reactivity'
import { button, div, reusable, span } from '@dolanske/cascade'
import { computed, ref, unref } from '@vue/reactivity'
import { onClickOutside } from '../../hooks/onClickOutside'
import { Icon } from '../Icon'

// Maybe in the future:
// showSelected=true when single=false (not used in the app, not needed)

interface Props {
  modelValue: Ref<string[]>
  options: MaybeRef<string[]>
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
    const _values = unref(props.modelValue)

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
          if (props.single) {
            // @ts-expect-error We are working in a single context
            props.modelValue.value = option
            open.value = false
          }
          else {
            if (props.modelValue.value.includes(option))
              props.modelValue.value = props.modelValue.value.filter(a => a !== option)
            else
              props.modelValue.value.push(option)
          }
        })
    }),
  )
})
