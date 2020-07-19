import xs from 'xstream'
import {
  FantasyObserver,
  FantasyObservable,
  FantasySubscription,
} from '@cycle/run'

import { adapt } from '@cycle/run/lib/adapt'
import R from 'ramda'

const isObservable = (target: any) => {
  return (
    target && typeof (target as FantasyObservable<any>).subscribe === 'function'
  )
}

type DebugHelper = ((message?: string, val?: any) => void) & {
  error?: (message: string, val?: any) => void
}

type ProxyObserver = FantasyObserver<any> & {
  _sinkKeepAliveSubscription?: FantasySubscription
  dispose: () => void
}

export type Sink = FantasyObservable<any> | Sinks

export type Sinks = {
  [index: string]: Sink
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

let spyEnabled = true

const globalScope: any = typeof window === 'object' ? window : global

const innerState: {
  observed: {
    [id: string]: {
      stream: FantasyObserver<any>
    }
  }
} = {
  observed: {},
}

type FilterRule = { text: string }

type SpySettings = {
  simple: boolean
  maxCount: number
}

const storageKeys = {
  settings: '__cycleSpySettings',
  filter: '__cycleSpyFilters',
}

type SpyObj = { name: string; source: string }

const testByStr = (str: string, testStr: string) =>
  new RegExp(testStr, 'i').test(str)

class SpyManager {
  settings: SpySettings = {
    simple: true,
    maxCount: -1,
  }
  filterRules: FilterRule[] = []
  private: boolean = true
  private spies: SpyObj[] = []
  private saveFilters() {
    localStorage.setItem(storageKeys.filter, JSON.stringify(this.filterRules))
  }

  private saveSettings() {
    localStorage.setItem(storageKeys.settings, JSON.stringify(this.settings))
  }
  private loadState() {
    try {
      const filters: FilterRule[] = JSON.parse(
        localStorage.getItem(storageKeys.filter) || '[]'
      )
      this.filterRules = filters || []
    } catch (e) {
      console.warn('[Cycle Spy] Could not parse stored filters')
    }
    try {
      const loaded = JSON.parse(
        localStorage.getItem(storageKeys.settings) || '{}'
      )
      this.settings = { ...this.settings, ...loaded }
    } catch (e) {
      console.warn('[Cycle Spy] Could not parse stored settings')
    }
  }

  shouldShow(str: string) {
    return !this.filterRules.reduce((res, rule) => {
      return res || new RegExp(rule.text, 'i').test(str)
    }, false)
  }

  setSimple(val = true) {
    this.settings.simple = val
  }

  isSimple() {
    return this.settings.simple
  }
  take(maxCount: number) {
    this.settings.maxCount = maxCount
    this.saveSettings()
  }
  showFilters() {
    console.group('All filters:')
    this.filterRules.forEach((rule, i) => {
      console.log(`${i} - ${rule.text}`)
    })
    console.groupEnd()
  }
  addFilter(text: string) {
    const found = this.filterRules.find(r => r.text === text)
    if (found) {
      console.log('Such filter rule already exists.')
      return
    }
    this.filterRules.push({ text })
    this.saveFilters()
  }
  removeFilter(arg: number | string) {
    const count = this.filterRules.length
    const toRemove = this.filterRules.filter((r, i) => {
      return typeof arg === 'string' ? testByStr(r.text, arg) : i === arg
    })
    this.filterRules = this.filterRules.filter(r => {
      toRemove.indexOf(r) >= 0
    })
    console.log(
      'Removed',
      toRemove.length,
      'rules',
      toRemove.length ? toRemove.map(r => r.text) : ''
    )

    this.saveFilters()
  }
  showAll() {
    console.group('All spies:')
    this.spies.forEach(spy => {
      console.log(`${spy.name} - ${spy.source}`)
    })
    console.groupEnd()
  }
  addSpy(spy: SpyObj) {
    this.spies.push(spy)
  }

  constructor() {
    this.loadState()
  }
}

const spyManager = new SpyManager()

const spyExposed = {
  _spyManager: spyManager,
  showAll: spyManager.showAll.bind(spyManager),
  showFilters: spyManager.showFilters.bind(spyManager),
  addFilter: spyManager.addFilter.bind(spyManager),
  removeFilter: spyManager.removeFilter.bind(spyManager),
}

if (globalScope) {
  if (globalScope.spyDisabled) {
    console.warn('[Cycle Spy] disabled')
    spyEnabled = false
  } else {
    //globalScope.spy = spyExposed
    globalScope.spy = spyManager
  }
}

// const createGlobalSpy = () => {
//   const storageKeys = {
//     settings: '__cycleSpySettings',
//     filter: '__cycleSpyFilters',
//   }
//   const filterRules: FilterRule[] = []
//   let settings: SpySettings = {}

//   const loadState = () => {
//     try {
//       const filters: FilterRule[] = JSON.parse(
//         localStorage.getItem(storageKeys.filter) || '[]'
//       )
//       // filterRules.splice(0, 0, filters)
//     } catch (e) {
//       console.warn('[Cycle Spy] Could not parse stored filters')
//     }
//     try {
//       const loaded = JSON.parse(
//         localStorage.getItem(storageKeys.settings) || '{}'
//       )
//       settings = { ...settings, ...loaded }
//     } catch (e) {
//       console.warn('[Cycle Spy] Could not parse stored settings')
//     }
//   }

//   const self = {
//     shouldShow: (str: string) => {
//       return
//     },
//     removeFilter: (text: string) => {},
//     addFilter: (text: string) => {},
//   }

//   return self
// }

type SpyEvent = {
  type: 'next' | 'error' | 'completed'
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

const makeDebugOutput = (method: string, proxyId: string): DebugHelper => (
  ...args
) => (console as any)[method](`[Cycle Spy] proxy ${proxyId}:`, ...args)

const absStartTime = new Date().getTime()

export type SpyOptions = {
  onlyFirst?: boolean
  props?: string[]
  source?: string
  sourceId?: string
}

const isMemoryStream = (s: any) => typeof (s as any)._has === 'boolean'

const makeSinkProxies = (
  sinks: Sinks,
  keyPrefix = '',
  spyName: string,
  options: SpyOptions
): SinkProxies | undefined => {
  const debug = makeDebugOutput('log', spyName)

  spyManager.addSpy({
    name: spyName,
    source: options.source || '',
  })

  const subscribeObserver = (proxy: StreamProxy, observer: ProxyObserver) => {
    const sink = proxy.sink as FantasyObservable<any>
    let prevTimestamp: number
    let count = 0
    const isMemory = isMemoryStream(sink)
    const subscribeStartTime = new Date().getTime()
    const subscription = sink.subscribe({
      //next: observer.next.bind(observer)
      next: val => {
        observer.next(val)
        count++

        if (!spyEnabled) return

        const maxAllowedCount = spyManager.settings.maxCount
        if (maxAllowedCount >= 0 && count > maxAllowedCount) {
          return
        }

        const labelName = `${spyName}${
          proxy.key === 'default' ? '' : '.' + proxy.key
        }`
        if (!spyManager.shouldShow(labelName + ' ' + options.source)) {
          return
        }

        const dateTime = new Date()
        const timestamp = dateTime.getTime()

        const timeFromPrev = prevTimestamp ? timestamp - prevTimestamp : 0

        const subTime = timestamp - subscribeStartTime
        const timeFromSubscribeSec = (subTime / 1000).toFixed(2)

        const absTime = timestamp - absStartTime
        const absTimeSec = (subTime / 1000).toFixed(2)

        const label = [
          `[Spy]`,
          '%c' + labelName,
          isMemory ? '[m]' : '',
          `(${count})`,
          `[%c${timeFromPrev}ms%c/${timeFromSubscribeSec}sec/%c${absTimeSec}sec]`,
          `%c ${options.source}`,
        ]
          .filter(_ => _)
          .join(' ')

        prevTimestamp = timestamp
        const styles = [
          'font-weight: bold',
          'color:LightCoral;',
          'color:inherit;',
          'color: #888;',
          'color: #AAA;',
        ]
        if (spyManager.isSimple()) {
          console.log(label, ...styles, val)
          //console.log('value', )
          return
        }
        console.groupCollapsed(label, ...styles)
        console.log('Value:', val)
        console.log('Number in stream:', count)
        if (timeFromPrev !== null) {
          console.log('Time from previous:', timeFromPrev, 'ms')
        }
        console.log('Abs time from start:', subTime / 1000, 'sec')
        options.source && console.log('Source:', options.source)
        console.log('isMemory:', isMemory)
        console.groupEnd()
      },
      error: (err: Error) => {
        console.error!(`sink ${proxy.key} error: ${err.message}`)
        console.error(err)
      },
      complete: () => {
        console.log(`sink ${proxy.key} completed`)
      },
    })
    // here we mutate observer, should not cause problems
    // if (observer._sinkKeepAliveSubscription) {
    //   observer._sinkKeepAliveSubscription.unsubscribe()
    // }
    observer.dispose = () => {
      //const empty = () => {}
      // observer._sinkKeepAliveSubscription = sink.subscribe({
      //   next: empty,
      //   error: empty,
      //   complete: empty,
      // })
      subscription.unsubscribe()
    }
  }

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

      const stream = adapt(
        (isMemoryStream(sink) ? xs.createWithMemory : xs.create)({
          start: function (this: { observer: ProxyObserver }, observer) {
            // observer will be mutated in subscribeObserver
            this.observer = observer as ProxyObserver
            proxy.observers.push(this.observer)
            // debug(`subscribing to stream sink ${proxy.key}`)
            subscribeObserver(proxy, this.observer)
            // debug(
            //   `proxy stream${isWithMemory ? ' with memory' : ''} for sink ${
            //     proxy.key
            //   } created, observers: ${proxy.observers.length}`
            // )
          },
          stop: function (this: { observer: ProxyObserver }) {
            this.observer.dispose()
            // if (this.observer._sinkKeepAliveSubscription) {
            //   this.observer._sinkKeepAliveSubscription.unsubscribe()
            // }
            // const index = proxy.observers.indexOf(this.observer)
            // proxy.observers.splice(index, 1)
            // debug(
            //   `stream for sink ${proxy.key} disposed, observers: ${proxy.observers.length}`
            // )
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
        const fnProxyId = spyName + '_' + key
        proxies[key] = {
          fnProxyId,
          fn: spy(sink, fnProxyId),
        }
      } else if (sink && sink.constructor === Object) {
        validSinks = true
        proxies[key] = {
          obj: makeSinkProxies(
            sink as Sinks,
            keyPrefix + key + '.',
            spyName,
            options
          ),
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

export const spy = (target: any, spyName: string, options: SpyOptions = {}) => {
  if (!spyEnabled) {
    return target
  }
  const wrapDefault = isObservable(target) || typeof target === 'function'
  if (wrapDefault) {
    target = { default: target }
  }
  const proxies = makeSinkProxies(target, '', spyName, options)
  if (!proxies) return target
  const proxiedSinks = getProxySinks(proxies)
  //return isStreamSink ? proxiedSinks.default : proxiedSinks
  return wrapDefault ? proxiedSinks.default : proxiedSinks
}
