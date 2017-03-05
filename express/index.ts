import { Router, Request as ExpressRequest, Response as ExpressResponse } from 'express'
import cuid = require('cuid')
import { StreamAdapter, Observer } from '@cycle/base'
import { RoutePath, RouterRequest, RouterResponse, RouterSource, RouterOptions } from './interfaces'

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

class RouterSourceObject implements RouterSource<any> {
  constructor(
    private streamAdapter: StreamAdapter,
    private _router: Router,
    private _responses: ResponsesIndexMap = {},
    private routerOptions: any
  ) {
    
  }  
  route(path: RoutePath, options?: any): any {
    const opts = options | this.routerOptions
    const router = Router(opts)
    this._router.use(path, router)    
    return new RouterSourceObject(this.streamAdapter, router, this._responses, opts)
  }
  method(method: string, path: RoutePath) {
    return this.streamAdapter.adapt({}, (_: any, observer: Observer<RouterRequest>) => {
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
      return () => {}
    })
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
      throw new Error(`request with id ${response.id} not found.`)
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

export const makeRouterDriver = <RequestStream>
  (router: Router, options?: Object) => {  
  return (response$: any, runSA: StreamAdapter) => {
    let source = new RouterSourceObject(runSA, router, {}, options)
    runSA.streamSubscribe<RouterResponse>(response$, {
      next: (response) => { source.handleResponse(response) },
      error: () => { },
      complete: () => { },
    })
    return <RouterSource<RequestStream>>source
  }
}
