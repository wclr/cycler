import xs, { Stream } from 'xstream'
import {
  FantasyObserver,
  FantasyObservable,
  FantasySubscription,
} from '@cycle/run'
import { adapt } from '@cycle/run/lib/adapt'

const isObservable = (target: any) => {
  return target &&
    (typeof (target as FantasyObservable).subscribe === 'function')
}

type DebugHelper = ((message?: string) => void) & {
  error?: (message: string) => void
}

type ProxyObserver = FantasyObserver & {
  dispose: () => void
}

export type Sink = FantasyObservable | Sinks

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
  key: string,
  //subs: any[],
  observers: any[],
  sink: Sink
  stream: FantasyObservable
}

type FnProxy = {
  fnProxyId: string,
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
    proxies: SinkProxies, sources: any, rest: any[]
  }[]
}

const proxiesStore: ProxiesStore = {}
let cycleHmrEnabled = true

const anyGlobal = global as any

if (typeof global !== 'undefined') {
  anyGlobal.cycleHmrProxiesStore = proxiesStore
  if (anyGlobal.noCycleHmr) {
    console.warn('[Cycle HMR] disabled')
    cycleHmrEnabled = false
  }
}

const getDebugMethod = (value: string | boolean) => {
  if (typeof console === 'object') {
    return (typeof value === 'string' && typeof (console as any)[value] === 'function')
      ? value
      : (console['log'] ? 'log' : '')
  }
}

const makeDebugOutput = (method: string, proxyId: string) =>
  (message?: string) =>
    (console as any)[method](`[Cycle HMR] proxy ${proxyId}: ${message}`)

export const hmrProxy = <Df>
  (dataflow: Df, proxyId: string, options: ProxyOptions = {}): Df => {

  if (!cycleHmrEnabled || typeof dataflow !== 'function') {
    return dataflow
  }

  if (typeof proxyId !== 'string') {
    throw Error('You should provide string value of proxy id')
  }
  
  let debug: DebugHelper = () => { }
  const debugOption = options.debug === undefined
    ? anyGlobal.cycleHmrDebug
    : options.debug
  if (debugOption) {
    const debugMethod = getDebugMethod(debugOption)
    debug = debugMethod
      ? makeDebugOutput(debugMethod, proxyId)
      : debug
  }
  debug.error = makeDebugOutput('error', proxyId)

  const subscribeObserver = (proxy: StreamProxy, observer: ProxyObserver) => {
    const subscribtion = (proxy.sink as FantasyObservable).subscribe({
      next: observer.next.bind(observer),
      error: (err: Error) => {
        debug.error!(`sink ${proxy.key} error: ${err.message}`)
      },
      complete: () => {
        debug(`sink ${proxy.key} completed`)
      }
    })
    // here we mutate observer, probably should not cause problems
    observer.dispose = () => {
      subscribtion.unsubscribe()
    }
  }

  const makeSinkProxies = (sinks: Sinks, keyPrefix = ''): SinkProxies | undefined => {
    const proxies: SinkProxies = {}
    const keys = Object.keys(sinks)
    let validSinks = false
    keys.forEach((key) => {
      const sink = sinks[key]
      if (isObservable(sink)) {
        validSinks = true
        let proxy: StreamProxy
        const stream = adapt(xs.create({
          start: function (this: { observer: ProxyObserver }, observer: ProxyObserver) {
            this.observer = observer
            proxy.observers.push(observer)
            // TODO: maybe return subscribtion and get rid of observer mutation
            let sub = subscribeObserver(proxy, observer)
            //proxy.subs.push(sub)
            debug(`stream for sink ${proxy.key} created, observers: ${proxy.observers.length}`)
          },
          stop: function (this: { observer: ProxyObserver }) {
            this.observer.dispose()
            let index = proxy.observers.indexOf(this.observer)
            proxy.observers.splice(index, 1)
            debug(`stream for sink ${proxy.key} disposed, observers: ${proxy.observers.length}`)
          }
        }))
        proxy = {
          key: keyPrefix + key,
          //subs: [],
          observers: [],
          sink, stream
        }
        proxies[key] = proxy
      } else {
        if (typeof sink === 'function') {
          validSinks = true
          const fnProxyId = proxyId + '_' + key
          proxies[key] = {
            fnProxyId,
            fn: hmrProxy(sink, fnProxyId)
          }
        } else if (sink && sink.constructor === Object) {
          validSinks = true
          proxies[key] = { obj: makeSinkProxies(sink as Sinks, keyPrefix + key + '.') }
        } else {
          proxies[key] = sink
        }
      }
    })
    return validSinks ? proxies : undefined
  }

  const getProxySinks = (proxies: SinkProxies) => {
    return Object.keys(proxies).reduce((obj: any, key) => {
      let proxy: any = proxies[key]
      obj[key] =
        proxy && (
          proxy.stream || proxy.fn
          || (proxy.obj && getProxySinks(proxy.obj))
        ) || proxy
      return obj
    }, {})
  }

  const SubscribeProxies = (proxies: SinkProxies, sinks: Sinks) => {
    if (isObservable(sinks)) {
      sinks = { default: sinks }
    }
    return Object.keys(proxies).forEach((key) => {
      const proxy = proxies[key]
      if (!proxy || !sinks[key]) {
        return
      }
      if ((proxy as FnProxy).fn) {
        hmrProxy(sinks[key] as any, (proxy as FnProxy).fnProxyId)
      } else if ((proxy as ObjProxy).obj) {
        SubscribeProxies((proxy as ObjProxy).obj!, sinks[key] as any)
      } if ((proxy as StreamProxy).observers) {
        (proxy as StreamProxy).sink = sinks[key]
          ; (proxy as StreamProxy).observers.map(observer => {
            const dispose = observer.dispose
            subscribeObserver((proxy as StreamProxy), observer)
            dispose()
          })
      }
    })
  }

  let proxiedInstances = proxiesStore[proxyId]

  if (proxiedInstances) {
    proxiedInstances.forEach(({ proxies, sources, rest }) => {
      debug('reload')
      //UnsubscribeProxies(proxies)
      const sinks = dataflow(sources, ...rest)
      sinks && SubscribeProxies(proxies, sinks)
    })
  } else {
    proxiedInstances = proxiesStore[proxyId] = []
  }

  const proxiedDataflow: any = (sources: any, ...rest: any[]) => {
    debug('execute')
    let sinks = (dataflow(sources, ...rest)) as Sinks

    if (!sinks) {
      return sinks
    }
    const isStreamSink = isObservable(sinks)
    if (isStreamSink) {
      sinks = { default: sinks }
    }
    if (typeof sinks === 'object') {
      let proxies = makeSinkProxies(sinks)
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
  proxiedDataflow.__hmrOriginalDataflow = dataflow
  return proxiedDataflow
}
