import type { MaybeRef, Ref } from '@dolanske/pantry'
import { button, computed, div, ref, reusable, span, toValue, unref } from '@dolanske/pantry'

import { onClickOutside } from '../../hooks/onClickOutside'
import { searchInStr } from '../../util/search-in'
import { Icon } from '../Icon'
import InputSearch from './InputSearch'

interface Props {
  modelValue: Ref<string[]> | Ref<string>
  options: MaybeRef<readonly string[]>
  label: MaybeRef<string>
  single?: boolean
  showSelected?: boolean
  showSearch?: boolean
}

export default reusable<Props>('div', (ctx, props) => {
  const open = ref(false)
  const search = ref('')

  // Check for clicking outside and close dropdown
  onClickOutside(ctx, () => {
    open.value = false
  })

  // Options
  const labelToShow = computed(() => {
    const _options = unref(props.options)
    const _values = props.modelValue.value

    if (_values.length > 0) {
      if (props.single || props.showSelected) {
        return _values as any as string
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
    }

    return toValue(props.label)
  })

  const filteredOptions = computed(() => toValue(props.options).filter(option => searchInStr(option, search.value)))

  // Assign search outside of the component tree, so we can get its `el` and
  // manually focus the input element when dropdown opens
  const Search = InputSearch().props({
    modelValue: search,
    placeholder: 'Search',
  }).show(() => props.showSearch !== false)

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
    div()
      .setup((ctx) => {
        ctx.onVisibilityChange((open) => {
          if (open) {
            Search.el.querySelector('input')?.focus()
          }
        })
      })
      .class('form-select-dropdown')
      .if(open)
      .nest(
        Search,
        div().for(filteredOptions, (option: string) => {
          const isActive = computed(() => props.modelValue.value.includes(option))
          return button()
            .nest(
              option,
              span().html(Icon.close).show(isActive),
            )
            .class('button')
            .class('active', isActive)
            .click(() => {
              if (props.single || !Array.isArray(props.modelValue.value)) {
                // Toggle value if `single` is set
                if (props.modelValue.value === option) {
                  props.modelValue.value = ''
                }
                else {
                  props.modelValue.value = option
                  open.value = false
                }
              }
              else if (props.modelValue.value.includes(option)) {
                props.modelValue.value = props.modelValue.value.filter(a => a !== option)
              }
              else {
                props.modelValue.value.push(option)
              }

              if (props.modelValue.value.length === 0) {
                open.value = false
              }
            })
        }),
      ),
  )
})
