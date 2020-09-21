import xs, { Stream } from 'xstream'

export const plug = <
  C extends Function,
  //R extends { [N: string]: Stream<any> | (() => Stream<any>) }
  R extends Record<string, Stream<any> | (() => Stream<any>)>
>(
  on$: Stream<boolean>,
  dataflow: C,
  offSinks?: R
): C => {
  return ((sources: any) => {
    const sinks = dataflow(sources)
    return Object.keys(sinks).reduce((newSinks, sinkKey) => {
      const getOffSink = (key: string) => {
        const val = offSinks && offSinks[key]
        return val ? (typeof val === 'function' ? val() : val) : xs.empty()
      }

      return {
        ...newSinks,
        [sinkKey]: on$
          .map((on) => (on ? sinks[sinkKey] : getOffSink(sinkKey)))
          .flatten(),
      }
    }, {}) as any
  }) as any
}
