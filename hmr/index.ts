import xs, { Stream, MemoryStream } from 'xstream'
import {
  FantasyObserver,
  FantasyObservable,
  FantasySubscription,
} from '@cycle/run'
import { adapt } from '@cycle/run/lib/adapt'

const isObservable = (target: any) => {
  return (
    target && typeof (target as FantasyObservable<any>).subscribe === 'function'
  )
}

interface GlobalHmr {
  noCycleHmr: boolean
  cycleHmrDebug: string | boolean
}

type DebugHelper = ((message?: string) => void) & {
  error?: (message: string) => void
}

type ProxyObserver = FantasyObserver<any> & {
  _sinkKeepAliveSubscription?: FantasySubscription
  dispose: () => void
}

export type Sink = FantasyObservable<any> | Sinks

export type Sinks = {
  [index: string]: Sink
}

export interface ProxyOptions {
  debug?: string | boolean
}

export interface HmrEnabledDataflow {
  __hmrOriginalDataflow: Function
}

type StreamProxy = {
  key: string
  observers: any[]
  sink: Sink
  stream: FantasyObservable<any>
}

type FnProxy = {
  fnProxyId: string
  fn: (...params: any[]) => any
}

type ObjProxy = {
  obj: SinkProxies | undefined
}

type Proxy = StreamProxy | FnProxy | ObjProxy

type SinkProxies = {
  [index: string]: Sink | Proxy
}

type ProxiesStore = {
  [index: string]: {
    proxies: SinkProxies
    sources: any
    rest: any[]
  }[]
}

const proxiesStore: ProxiesStore = {}

const dataflowsLatest: { [ID: string]: any } = {}

let cycleHmrEnabled = true

const anyGlobal: any = typeof window === 'object' ? window : global

if (anyGlobal && anyGlobal.noCycleHmr) {
  console.warn('[Cycle HMR] disabled')
  cycleHmrEnabled = false
}

const getDebugMethod = (value: string | boolean): string | undefined => {
  if (typeof console === 'object') {
    return typeof value === 'string' &&
      typeof (console as any)[value] === 'function'
      ? value
      : console['log']
      ? 'log'
      : ''
  }
  return undefined
}

const makeDebugOutput = (method: string, proxyId: string) => (
  message?: string
) => (console as any)[method](`[Cycle HMR] proxy ${proxyId}: ${message}`)

export const hmrProxy = <Df>(
  dataflow: Df,
  proxyId: string,
  options: ProxyOptions = {}
): Df => {
  if (!cycleHmrEnabled || typeof dataflow !== 'function') {
    return dataflow
  }

  if (typeof proxyId !== 'string') {
    throw Error('You should provide string value of proxy id')
  }
  dataflowsLatest[proxyId] = dataflow

  let debug: DebugHelper = () => {}
  const debugOption =
    options.debug === undefined
      ? anyGlobal && anyGlobal.cycleHmrDebug
      : options.debug
  if (debugOption) {
    const debugMethod = getDebugMethod(debugOption)
    debug = debugMethod ? makeDebugOutput(debugMethod, proxyId) : debug
  }
  debug.error = makeDebugOutput('error', proxyId)

  const subscribeObserver = (proxy: StreamProxy, observer: ProxyObserver) => {
    const sink = proxy.sink as FantasyObservable<any>
    const subscribtion = sink.subscribe({
      next: observer.next.bind(observer),
      error: (err: Error) => {
        debug.error!(`sink ${ proxy.key } error: ${ err.message }`)
        console.error(err)
      },
      complete: () => {
        debug(`sink ${proxy.key} completed`)
      },
    })
    // here we mutate observer, should not cause problems
    if (observer._sinkKeepAliveSubscription) {
      observer._sinkKeepAliveSubscription.unsubscribe()
    }
    observer.dispose = () => {
      const empty = () => {}
      observer._sinkKeepAliveSubscription = sink.subscribe({
        next: empty,
        error: empty,
        complete: empty,
      })
      subscribtion.unsubscribe()
    }
  }

  const makeSinkProxies = (
    sinks: Sinks,
    keyPrefix = ''
  ): SinkProxies | undefined => {
    const proxies: SinkProxies = {}
    const keys = Object.keys(sinks)
    let validSinks = false
    keys.forEach(key => {
      const sink = sinks[key]
      if (isObservable(sink)) {
        validSinks = true
        let proxy: StreamProxy
        // we need consistent method to determine if memory stream is here
        // also "memory" streams of other libraries than xstream will not be handled
        const isWithMemory = typeof (sink as any)._has === 'boolean'
        const stream = adapt(
          (isWithMemory ? xs.createWithMemory : xs.create)({
            start: function (this: { observer: ProxyObserver }, observer) {
              // observer will be mutated in subscribeObserver
              this.observer = observer as ProxyObserver
              proxy.observers.push(this.observer)
              debug(`subscribing to stream sink ${proxy.key}`)
              subscribeObserver(proxy, this.observer)
              debug(
                `proxy stream${isWithMemory ? ' with memory' : ''} for sink ${
                  proxy.key
                } created, observers: ${proxy.observers.length}`
              )
            },
            stop: function (this: { observer: ProxyObserver }) {
              this.observer.dispose()
              if (this.observer._sinkKeepAliveSubscription) {
                this.observer._sinkKeepAliveSubscription.unsubscribe()
              }
              const index = proxy.observers.indexOf(this.observer)
              proxy.observers.splice(index, 1)
              debug(
                `stream for sink ${proxy.key} disposed, observers: ${proxy.observers.length}`
              )
            },
          })
        )
        proxy = {
          key: keyPrefix + key,
          observers: [],
          sink,
          stream,
        }
        proxies[key] = proxy
      } else {
        if (typeof sink === 'function') {
          validSinks = true
          const fnProxyId = proxyId + '_' + key
          proxies[key] = {
            fnProxyId,
            fn: hmrProxy(sink, fnProxyId),
          }
        } else if (sink && sink.constructor === Object) {
          validSinks = true
          proxies[key] = {
            obj: makeSinkProxies(sink as Sinks, keyPrefix + key + '.'),
          }
        } else {
          proxies[key] = sink
        }
      }
    })
    return validSinks ? proxies : undefined
  }

  const getProxySinks = (proxies: SinkProxies) => {
    return Object.keys(proxies).reduce((obj: any, key) => {
      const proxy: any = proxies[key]
      obj[key] =
        (proxy &&
          (proxy.stream ||
            proxy.fn ||
            (proxy.obj && getProxySinks(proxy.obj)))) ||
        proxy
      return obj
    }, {})
  }

  // const UnsubscribeProxies = (proxies: SinkProxies) => {
  //   Object.keys(proxies).forEach((key) => {
  //     const proxy = proxies[key]
  //     if (!proxy) {
  //       return
  //     }
  //     if ((proxy as ObjProxy).obj) {
  //       UnsubscribeProxies((proxy as ObjProxy).obj!)
  //     } if ((proxy as StreamProxy).observers) {
  //       (proxy as StreamProxy).observers.map(observer => {
  //         observer.dispose()
  //       })
  //     }
  //   })
  // }

  const CheckProxiesObserved = (proxies: SinkProxies): boolean => {
    return Object.keys(proxies).reduce<boolean>((result, key) => {
      if (result) {
        return result
      }
      const proxy = proxies[key]
      if (!proxy) {
        return false
      }
      if ((proxy as ObjProxy).obj) {
        return CheckProxiesObserved((proxy as ObjProxy).obj!) as boolean
      }
      if ((proxy as StreamProxy).observers) {
        return (proxy as StreamProxy).observers.length > 0
      }
      return false
    }, false)
  }

  const SubscribeProxies = (proxies: SinkProxies, sinks: Sinks) => {
    if (isObservable(sinks)) {
      sinks = { default: sinks }
    }
    return Object.keys(proxies).forEach(key => {
      const proxy = proxies[key]
      if (!proxy || !sinks[key]) {
        return
      }

      if (typeof (proxy as FnProxy).fn === 'function') {
        hmrProxy(sinks[key] as any, (proxy as FnProxy).fnProxyId)
      } else if ((proxy as ObjProxy).obj) {
        SubscribeProxies((proxy as ObjProxy).obj!, sinks[key] as any)
      }
      if ((proxy as StreamProxy).observers) {
        const streamProxy = proxy as StreamProxy
        streamProxy.sink = sinks[key]
        streamProxy.observers.map(observer => {
          const waitForNextTick = (fn: () => any) => Promise.resolve().then(fn)
          observer.dispose()
          // We subscribe dataflow listeners (observers)
          // to new sink only after entire subscription chain is disposed,
          // so we should wait for all dataflows reloaded in current global reload
          // (which will be done in sync in current tick -
          // that is why we wait for the next tick with Promise,
          // setTimeout could be used instead)
          // _sinkKeepAliveSubscription is used to keep dataflow input streams alive
          // while we wait.
          waitForNextTick(() =>
            subscribeObserver(proxy as StreamProxy, observer)
          )
        })
      }
    })
  }

  let proxiedInstances = proxiesStore[proxyId]

  if (proxiedInstances) {
    proxiedInstances.forEach(({ proxies, sources, rest }) => {
      debug('reload')
      // UnsubscribeProxies(proxies)
      const sinks = dataflow(sources, ...rest)
      sinks && SubscribeProxies(proxies, sinks)
    })
    // We clean up unused dataflows (which lost all of their listeners)
    // so we don't re-execute them in vain
    // theoretically there can be problem edge cases
    // of dataflows that have late subscribers,
    // maybe this case could be handled in future
    const cleanUpTimeout =
      (anyGlobal && anyGlobal.cycleHmrCleanupTimeout) || 1000
    setTimeout(() => {
      let i = -1
      while (++i < proxiedInstances.length) {
        const instance = proxiedInstances[i]
        if (!CheckProxiesObserved(instance.proxies)) {
          const index = proxiedInstances.indexOf(instance)
          proxiedInstances.splice(index, 1)
          debug(`clean up not observed instance ${proxyId}`)
        }
      }
    }, cleanUpTimeout)
  } else {
    proxiedInstances = proxiesStore[proxyId] = []
  }

  const proxiedDataflow: any = (sources: any, ...rest: any[]) => {
    debug('execute')
    let sinks = dataflowsLatest[proxyId](sources, ...rest) as Sinks

    if (!sinks) {
      return sinks
    }
    const isStreamSink = isObservable(sinks)
    if (isStreamSink) {
      sinks = { default: sinks }
    }
    if (typeof sinks === 'object') {
      const proxies = makeSinkProxies(sinks)
      if (!proxies) {
        debug('sink not a stream result')
        return sinks
      }
      proxiedInstances.push({ sources, proxies, rest })
      debug('created')
      const proxiedSinks = getProxySinks(proxies)
      return isStreamSink ? proxiedSinks.default : proxiedSinks
    } else {
      debug('sink not a stream result')
      return sinks
    }
  }
  proxiedDataflow.__hmrOriginalDataflow = dataflowsLatest[proxyId]
  return proxiedDataflow
}
