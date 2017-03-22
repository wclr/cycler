import { Observable as O, Subject } from 'rxjs'
import { hmrProxy as proxy } from '../.'
import { run } from '@cycle/run'
import { setAdapt } from '@cycle/run/lib/adapt'
import xs, { Stream } from 'xstream'
import * as Rxjs from 'rxjs'
import * as test from 'tape'

(global as any).cycleHmrDebug = false

const getRandomId = () => Math.random().toString().slice(4, 8)

test('xstream: Dataflow returning single steam', t => {
  const func = ({ input$ }: { input$: Stream<number> }) => {
    return input$.map(x => x * 2)
  }

  let funcProxy = proxy(func, getRandomId())
  let input$ = xs.of(1)
  let sink = funcProxy({ input$ })

  sink.addListener({
    next: (y) => {
      t.is(y, 2, 'output of stream should not change')
      t.end()
    },
    error: t.error
  })
})

test('xstream: run dataflow with disposal', t => {
  let count = 0
  let sinkCount = 0
  let value: number
  const testTimeout = 500
  const func = (input$: Stream<number>) => {
    return {
      output$: input$.map(x => x * 2)
    }
  }
  const funcReloaded = (input$: Stream<number>) => {
    return {
      output$: input$.map(x => x * 2000)
    }
  }
  const proxyId = 'func_' + getRandomId()
  const mainProxyId = 'main_' + getRandomId()

  let funcProxy = proxy(func, proxyId)

  const main = ({ }) => {
    const output$ = funcProxy(xs.periodic(80)).output$
    return {
      other: output$.take(1),
      log: output$
        .map((x) => {
          count++
          return x
        })
    }
  }

  const dispose = run(
    proxy(main, mainProxyId), {
      other: (messages$: Stream<number>) => {
        return messages$.addListener({
          next: x => {
            t.is(x, 0, 'completed stream value ok')
          },
          error: () => { },
          complete: () => { }
        })
      },
      log: (messages$: Stream<number>) => {
        return messages$.addListener({
          next: x => {
            value = x
            sinkCount++
          },
          error: () => { },
          complete: () => { }
        })
      }
    })

  proxy(funcReloaded, proxyId)

  setTimeout(() => {
    dispose()
    setTimeout(() => {
      t.ok(value > 1000, 'last value:' + value + ' was proxied')
      t.is(count, sinkCount, 'no leaking')
      t.end()
    }, 1000)
  }, testTimeout)
})

test('Set Rxjs adapt', (t) => {
  setAdapt(Rxjs.Observable.from)
  t.end()
})

type InputSource = { input$: O<number> }

test('Dataflow returning single steam', t => {
  const func = ({ input$ }: InputSource) => {
    return input$.map(x => x * 2)
  }

  let funcProxy = proxy(func, getRandomId())
  let input$ = O.of(1)
  let sink = funcProxy({ input$ })

  sink.subscribe((y) => {
    t.is(y, 2, 'output of stream should not change')
    t.end()
  }, t.error)
})


test('Dataflow returning regular sink object', t => {
  const func = ({ input$ }: InputSource, rest: string, rest2: string) => {
    t.is(rest, 'rest', 'first rest source param should be passed transparently')
    t.is(rest2, 'rest2', 'second rest param should passed transparently')
    return {
      output$: input$.map(x => x * 2)
    }
  }

  let funcProxy = proxy(func, getRandomId())
  let input$ = O.of(1)
  let sink = funcProxy({ input$ }, 'rest', 'rest2')
  sink.output$.subscribe((y) => {
    t.is(y, 2, 'proxied function output should be correct')
    t.end()
  }, t.error)
})

test('Dataflow returning sink that contains stream factory function', t => {
  const dataflow = ({ input$ }: InputSource) => {
    return {
      x: 1,
      empty: null,
      output: () => input$.map(x => x * 2)
    }
  }
  const dataflowReloaded = ({ input$ }: InputSource) => {
    return {
      x: 2,
      output: () => input$.map(x => x * 20)
    }
  }
  const proxyId = getRandomId()
  let dataflowProxy = proxy(dataflow, proxyId)
  let input$ = O.of(1)
  let sinks = dataflowProxy({ input$ })
  t.is(sinks.x, 1, 'number is proxied transparent with no changes')
  t.is(sinks.empty, null, 'nil is proxied transparent with no changes')
  let sink = sinks.output()
  proxy(dataflowReloaded, proxyId)
  sink.subscribe((y) => {
    t.is(y, 20, 'proxied function output should be correct')
    t.end()
  }, t.error)
})

test('Dataflow returning sink that contains (deep) nested object', t => {
  const dataflow =
    ({ input$ }: { input$: O<number> }, rest: string, rest2: string) => {
      return {
        deep: {
          nested: {
            output$: input$.map(x => x * 2)
          }
        }
      }
    }
  const dataflowReloaded =
    ({ input$ }: { input$: O<number> }, rest: string, rest2: string) => {
      return {
        deep: {
          nested: {
            output$: input$.map(x => x * 20)
          }
        }
      }
    }
  const proxyId = getRandomId()
  let dataflowProxy = proxy(dataflow, proxyId)
  let input$ = O.of(1)
  let sinks = dataflowProxy({ input$ }, 'rest', 'rest2')
  let sink = sinks.deep.nested.output$
  proxy(dataflowReloaded, proxyId)
  sink.subscribe((y) => {
    t.is(y, 20, 'proxied function output should be correct')
    t.end()
  }, t.error)
})

test('Dataflow connected to to multicasted source', t => {
  const dataflow = ({ input$ }: InputSource) => {
    return {
      output$: input$.map(x => x * 20)
    }
  }
  const dataflowReloaded = ({ input$ }: InputSource) => {
    console.log('')
    return {
      output$: input$.map(x => x * 200)
    }
  }
  const proxyId = getRandomId()
  let dataflowProxy = proxy(dataflow, proxyId)
  let input$ = O.interval(30).share()
  let sinks = dataflowProxy({ input$ })
  let sink = sinks.output$
  let reloaded = false
  setTimeout(() => {
    proxy(dataflowReloaded, proxyId)
    setTimeout(function () {
      reloaded = true
    }, 10)
  }, 100)

  const sub = sink.subscribe((y) => {
    if (reloaded) {
      t.ok(y > 100, 'reloaded sink takes last value of shared source')
      t.end()
      sub.unsubscribe()
    }
  }, t.error)
})


test('Datfalow double reload', t => {
  var proxyId = getRandomId()

  const func = ({ input$ }: InputSource, rest: string, rest2: string) => {
    return {
      // completed stream
      output$: input$.map(x => x * 2).take(1)
    }
  }

  const funcReloaded = ({ input$ }: InputSource, rest: string, rest2: string) => {
    t.is(rest, 'rest', 'first rest source param stays the same')
    t.is(rest2, 'rest2', 'second rest source param stays the same')
    return {
      output$: input$.map(x => x * 20).take(1)
    }
  }

  const funcReloaded2 = ({ input$ }: InputSource, rest: string, rest2: string) => {
    t.is(rest, 'rest', 'first rest source param stays the same')
    t.is(rest2, 'rest2', 'second rest source param stays the same')
    return {
      output$: input$.map(x => x * 200)
    }
  }

  let funcProxy = proxy(func, proxyId)
  let input$ = new Subject()
  let sink = funcProxy({ input$ }, 'rest', 'rest2')

  let reloaded = 0
  sink.output$.subscribe((y) => {
    if (reloaded === 0) {
      t.is(y, 2, 'initial output should be correct')
    }
    if (reloaded === 1) {
      t.is(y, 40, 'reloaded output should be correct')
    }
    if (reloaded === 2) {
      t.is(y, 400, 'next reloaded output should be correct')
      t.end()
    }
  }, t.error)
  input$.next(1)
  setTimeout(() => {
    proxy(funcReloaded, proxyId)
    reloaded++
    input$.next(2)
    setTimeout(() => {
      proxy(funcReloaded2, proxyId)
      reloaded++
      input$.next(2)
    }, 100)
  }, 100)
})

test('Transparent proxying for non-dataflows', t => {
  const str = 'str'
  const obj = { a: 1 }
  const fn = (x: number) => x * 2
  const fnNil = (x: any) => null
  const fnObj = (x: any) => ({ value: x * 2 })
  t.is(proxy(str, getRandomId()), 'str', 'proxied constant value is ok')
  t.is(proxy(obj, getRandomId()), obj, 'proxied object ref is ok')
  t.is(proxy(obj, getRandomId()).a, 1, 'proxied object prop is ok')
  t.is(proxy(obj, getRandomId()).a, 1, 'proxied object prop is ok')
  t.is(proxy(fn, getRandomId())(2), 4, 'proxied function returned result is ok')
  t.is(proxy(fnNil, getRandomId())(2), null, 'proxied nil function returned result is ok')
  t.is(proxy(fnObj, getRandomId())(2).value, 4, 'proxied function returned object is ok')
  t.end()
})
