interface ThrottleOptions {
  leading?: boolean // default false
}

export function throttle(
  // eslint-disable-next-line ts/no-unsafe-function-type
  mainFunction: Function,
  delay: number,
  options: ThrottleOptions = {},
) {
  const { leading = false } = options
  let timerFlag: ReturnType<typeof setTimeout> | null = null
  let pendingArgs: any[] | null = null

  return (...args: any[]) => {
    if (timerFlag === null) {
      if (leading) {
        mainFunction(...args)
      }
      else {
        pendingArgs = args
      }

      timerFlag = setTimeout(() => {
        timerFlag = null
        if (!leading && pendingArgs) {
          mainFunction(...pendingArgs)
          pendingArgs = null
        }
      }, delay)
    }
    else if (!leading) {
      // capture the latest args to use once the delay elapses
      pendingArgs = args
    }
  }
}
