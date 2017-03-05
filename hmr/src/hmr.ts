import { StreamAdapter, Observer } from '@cycle/base'

export type GenericStream = {__GenericStream: true}
type DebugHelper = ((message?: string) => void) & {
  error?: (message: string) => void
}

export interface HmrProxyOptions {
  debug?: boolean | string
}

type ProxyObserver = Observer<any> & {
  dispose: () => void
}

export type Sink = GenericStream | Sinks

export type Sinks = {
  [index: string]: Sink
}

type StreamProxy = {  
  adapter: StreamAdapter,
  key: string,
  subs: any[],
  observers: any[],
  sink: Sink
  stream: GenericStream
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

export type Dataflow = (sources: any, ...rest: any[]) => Sinks

const proxiesStore: ProxiesStore = {}
let cycleHmrEnabled = true

if (typeof global !== 'undefined') {
  (<any>global).cycleHmrProxiesStore = proxiesStore
  if ((<any>global).noCycleHmr) {
    console.warn('[Cycle HMR] disabled')
    cycleHmrEnabled = false
  }
}

const findValidAdapter = (adapters: StreamAdapter[], stream: Sink) =>
  stream && adapters
    .filter(adapter => adapter.isValidStream(stream))[0]

const getDebugMethod = (value: string | boolean) =>
  typeof console === 'object' && typeof value === 'string'
    ? typeof (<any>console)[value] === 'function' ? value
      : console['log'] ? 'log' : ''
    : ''

const makeDebugOutput = (method: string, proxyId: string) =>
  (message?: string) => (<any>console)[method](`[Cycle HMR] proxy ${proxyId}: ${message}`)

export const hmrProxy = (
  adapters: StreamAdapter[],
  dataflow: Dataflow,
  proxyId: string,
  options: HmrProxyOptions = {}) => {

  if (!cycleHmrEnabled || typeof dataflow !== 'function') {
    return dataflow
  }

  if (typeof proxyId !== 'string') {
    throw Error('You should provide string value of proxy id')
  }
  const getAdapter = (stream: Sink) => findValidAdapter(adapters, stream)

  let debug: DebugHelper = () => { }
  if (options.debug) {
    const debugMethod = getDebugMethod(options.debug)
    debug = debugMethod
      ? makeDebugOutput(debugMethod, proxyId)
      : debug
  }
  debug.error = makeDebugOutput('error', proxyId)

  const subscribeObserver = (proxy: StreamProxy, observer: ProxyObserver) => {
    const dispose = proxy.adapter.streamSubscribe(proxy.sink, {
      next: observer.next.bind(observer),
      error: (err: Error) => {
        debug.error!(`sink ${proxy.key} error: ${err.message}`)
      },
      complete: () => {
        debug(`sink ${proxy.key} completed`)
      }
    })
    observer.dispose = () => {
      if (typeof dispose === 'function') {
        dispose()
      }
    }
  }

  const makeSinkProxies = (sinks: Sinks, keyPrefix = '') : SinkProxies | undefined => {
    let proxies: SinkProxies = {}
    let validSinks = false
    let keys = Object.keys(sinks)
    keys.forEach((key) => {
      let sink = sinks[key]
      let adapter = sink && getAdapter(sink)
      if (adapter) {
        validSinks = true
        let proxy: StreamProxy
        const stream = adapter.adapt({}, (_: any, observer: ProxyObserver) => {
          proxy.observers.push(observer)
          let sub = subscribeObserver(proxy, observer)
          proxy.subs.push(sub)
          debug(`stream for sink ${proxy.key} created, observers: ${proxy.observers.length}`)
          return () => {
            observer.dispose()
            let index = proxy.observers.indexOf(observer)
            proxy.observers.splice(index, 1)
            debug(`stream for sink ${proxy.key} disposed, observers: ${proxy.observers.length}`)
          }
        })
        proxy = {
          key: keyPrefix + key, subs: [], observers: [],
          sink, adapter, stream
        }
        proxies[key] = proxy
      } else {
        if (typeof sink === 'function') {
          validSinks = true
          const fnProxyId = proxyId + '_' + key
          proxies[key] = {
            fnProxyId,
            fn: hmrProxy(adapters, sink, fnProxyId, options)
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
    if (getAdapter(sinks)) {
      sinks = { default: sinks }
    }
    return Object.keys(proxies).forEach((key) => {
      const proxy = proxies[key]
      if (!proxy || !sinks[key]) {
        return
      }
      if ((proxy as FnProxy).fn) {
        hmrProxy(adapters, sinks[key] as any, (proxy as FnProxy).fnProxyId, options)
      } else if ((proxy as ObjProxy).obj) {
        SubscribeProxies((proxy as ObjProxy).obj!, sinks[key] as any)
      } if ((proxy as StreamProxy).observers) {
        (proxy as StreamProxy).sink = sinks[key]
        ;(proxy as StreamProxy).observers.map(observer => {
          const dispose = observer.dispose
          subscribeObserver((proxy as StreamProxy), observer)
          dispose()
        })
      }
    })
  }

  let proxiedInstances = proxiesStore[proxyId]

  if (proxiedInstances) {
    proxiedInstances.forEach(({proxies, sources, rest}) => {
      debug('reload')
      //UnsubscribeProxies(proxies)
      let sinks = dataflow(sources, ...rest)
      sinks && SubscribeProxies(proxies, sinks)
    })
  } else {
    proxiedInstances = proxiesStore[proxyId] = []
  }

  return (sources: any, ...rest: any[]) => {
    debug('execute')
    let sinks = dataflow(sources, ...rest)
    if (!sinks) {
      return sinks
    }
    const simple = getAdapter(sinks)
    if (simple) {
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
      return simple ? proxiedSinks.default : proxiedSinks
    } else {
      debug('sink not a stream result')
      return sinks
    }
  }
}