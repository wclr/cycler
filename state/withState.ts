import xs, { Stream, MemoryStream } from 'xstream'
import { Options, Reducer, makeStateDriver } from '.'

export type Omit<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P] }

export type Forbid<T, K extends keyof T> = Omit<T, K> & { [P in K]?: never }

export type OSo<T, N extends string> = { [P in N]: MemoryStream<T> }
export type OSi<T, N extends string> = { [P in N]: Stream<Reducer<T>> }

type Component<So, Si> = (sources: So, ...rest: any[]) => Si

export type ComponentWithState<
  So extends OSo<T, N>,
  Si extends OSi<T, N>,
  T,
  N extends string
> = Component<Forbid<So, N>, Omit<Si, N>>

const defaultStateSinkName = 'state'

export const withState = <
  So extends OSo<T, N>,
  Si extends OSi<T, N>,
  T = any,
  N extends string = typeof defaultStateSinkName
>(
  component: Component<So, Si>,
  options: ({ name?: string } & Options<T>) | N = {}
): ComponentWithState<So, Si, T, N> => {
  const name = (typeof options === 'string'
    ? options
    : options.name || defaultStateSinkName) as N
  const opts = typeof options === 'string' ? {} : options
  const driver = makeStateDriver({
    initialValue: opts.initialValue,
    scheduleUpdate: opts.scheduleUpdate,
  })
  type State = T
  return (sources, ...rest) => {
    const state$ = xs.createWithMemory<State>()
    const innerSources = {
      ...sources,
      [name]: state$,
    }
    const sinks = component(innerSources as any, ...rest)
    const reducer$: Stream<Reducer<State>> = sinks[name] as any
    driver(reducer$).subscribe({
      next: (val) => state$._n(val),
      error: (err) => state$._e(err),
      complete: () => state$._c(),
    })

    const oSinks = Object.keys(sinks).reduce((oSinks, sinkName) => {
      if (sinkName !== name) {
        ;(oSinks as any)[sinkName] = sinks[sinkName as keyof Si]
      }
      return oSinks
    }, {} as Omit<Si, N>)

    return oSinks
  }
}
