// @hmr-enabled
import xs, { Stream } from 'xstream'
import { isMemoryStream } from './util'

export const switchover = <
  S extends any,
  R extends Record<string, Stream<any>>,
  K extends string | number
>(
  switchKey$: Stream<K>,
  sw: { [P in K]: (arg: S, ...args: any[]) => any },
  defaultSinks: R
): ((arg: S, ...args: any[]) => R) => {
  const SwitchedCycle = (...sources: any[]) => {
    const cycle$ = switchKey$.map((key) => (sw[key] as any)(...sources))
    return Object.keys(defaultSinks).reduce((newSinks, sinkKey) => {
      const sink$ = cycle$
        .map((cycle) => cycle[sinkKey] || defaultSinks[sinkKey])
        .flatten()
      const defaultSink$ = defaultSinks[sinkKey]
      return {
        ...newSinks,
        [sinkKey]: isMemoryStream(defaultSink$) ? sink$.remember() : sink$,
      }
    }, {} as any)
  }

  return SwitchedCycle as any
}
