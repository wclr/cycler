import { Router, Request as ExpressRequest, Response as ExpressResponse } from 'express'
import cuid = require('cuid')
import { Driver } from '@cycle/run'
import xs, { Stream } from 'xstream';
import { adapt } from '@cycle/run/lib/adapt';
import {
  RoutePath, RouterRequest, RouterResponse,
  RouterSource,
  RouterOptions
} from './interfaces'

export * from './interfaces'

const terminateMethods = [
  'download',
  'end',
  'json',
  'jsonp',
  'redirect',
  'render',
  'send',
  'sendFile',
  'sendStatus'
]

const terminateMethodsIndexMap = terminateMethods
  .reduce<{ [index: string]: true }>((methods, m) => {
    methods[m] = true
    return methods
  }, {})

const isTerminateMethod = (methodName: string) => {
  return !!terminateMethodsIndexMap[methodName]
}


type ResponsesIndexMap = { [index: string]: ExpressResponse }

class RouterSourceObject implements RouterSource {
  constructor(
    private _router: Router,
    private _responses: ResponsesIndexMap = {},
    private routerOptions: any
  ) {

  }
  route(path: RoutePath, options?: any): any {
    const opts = options | this.routerOptions
    const router = Router(opts)
    this._router.use(path, router)
    return new RouterSourceObject(router, this._responses, opts)
  }
  method(method: string, path: RoutePath) {
    const request$ = xs.create<RouterRequest>({
      start: (observer) => {
        const setId = (req: any, id: string): RouterRequest => {
          req.id = id
          return req
        }
        const anyRouter = <any>this._router
        anyRouter[method](path, (req: ExpressRequest, res: ExpressResponse) => {
          let id = cuid()
          this._responses[id] = res
          observer.next(setId(req, id))
        })
      },
      stop: () => { }
    })
    return adapt(request$)
  }
  handleResponse(response: RouterResponse) {
    let res = <any>this._responses[response.id]
    if (res) {
      let terminateMethod: string = ''
      let methods: string[] = []
      for (let key in response) {
        if (typeof res[key] === 'function') {
          if (isTerminateMethod(key)) {
            terminateMethod = key
          } else {
            methods.push(key)
          }
        }
      }
      if (terminateMethod !== '') {
        methods.push(terminateMethod)
      }
      methods.forEach(method => {
        res[method]((<any>response)[method])
      })
      if (terminateMethod) {
        delete this._responses[response.id]
      }
    } else {
      throw new Error(`Request with id ${response.id} not found.`)
    }
  }
  /**
   * Returns the stream of all request handled by the router
   * @param  {string|RegExp} path
   */
  all(path: string | RegExp) {
    return this.method('all', path)
  }
  get(path: string | RegExp) {
    return this.method('get', path)
  }
  post(path: string | RegExp) {
    return this.method('post', path)
  }
  put(path: string | RegExp) {
    return this.method('put', path)
  }
  delete(path: string | RegExp) {
    return this.method('delete', path)
  }
}

//const isExpressRouter = (router: any) => router && typeof router.use === 'function'

export const makeRouterDriver =
  (router: Router, options?: Object) => {
    return (response$: Stream<RouterResponse>): RouterSource => {
      const source = new RouterSourceObject(router, {}, options)
      response$.addListener({
        next: (response) => { source.handleResponse(response) },
        error: () => { },
        complete: () => { },
      })
      return source
    }
  }
