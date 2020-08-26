import { ResponseStream, ResponsesStream } from './interfaces'
import xs, { Stream, MemoryStream } from 'xstream'
import { adapt } from '@cycle/run/lib/adapt'
import { FantasyObservable } from '@cycle/run'
import makeTaskSource from './makeTaskSource'
import attachRequest from './attachRequest'

const isFunction = (f: any) => typeof f === 'function'
const empty = () => {}
const emptySubscribe = (stream: Stream<any>) =>
  stream.subscribe({ next: empty, error: empty, complete: empty })

import {
  DriverOptions,
  TaskDriver,
  InputTaskDriver,
  TaskSource,
  TaskRequest,
  GetResponse,
  GetProgressiveResponse,
  ResponseObserver,
} from './interfaces'

export interface MakeTaskDriver {
  /**
   *  Task driver.
   */
  <Request, Response, Error = any>(params: {
    getResponse: GetResponse<Request, Response, Error>
    lazy?: boolean
    dispose?(): void
  }): TaskDriver<Request, Response>

  /**
   *  Basic task driver.
   *  Takes getResponse function as a single parameter.
   */
  <Request, Response, Error = any>(
    getResponse: GetResponse<Request, Response, Error>
  ): TaskDriver<Request, Response>

  /**
   *  Task driver with progressive response.
   */
  <Request, Response, Error = any>(params: {
    getProgressiveResponse: GetProgressiveResponse<Request, Response, Error>
    lazy?: boolean
    dispose?(): void
  }): TaskDriver<Request, Response>

  /**
   *  Task driver with request input that should be normalized.
   */
  <RequestInput, Request, Response, Error = any>(params: {
    getResponse: GetResponse<Request, Response, Error>
    normalizeRequest(request: RequestInput): Request
    isolateMap?(request: RequestInput): RequestInput
    lazy?: boolean
    dispose?(): void
  }): InputTaskDriver<RequestInput, Request, Response>

  /**
   *  Task driver with progressive response and request input
   *  that should be normalized.
   */
  <RequestInput, Request, Response, Error = any>(params: {
    getProgressiveResponse: GetProgressiveResponse<Request, Response, Error>
    normalizeRequest(request: RequestInput): Request
    isolateMap?(request: RequestInput): Request
    lazy?: boolean
    dispose?(): void
  }): InputTaskDriver<RequestInput, Request, Response>
}

export const makeTaskDriver: MakeTaskDriver = function <
  RequestInput,
  Request extends TaskRequest,
  Response,
  Error
>(options: any): (request$: any) => any {
  let {
    getResponse,
    getProgressiveResponse,
    normalizeRequest = (_: RequestInput): Request & TaskRequest => _ as any,
    isolateMap,
    lazy = false,
  } = options

  if (normalizeRequest && !isolateMap) {
    isolateMap = normalizeRequest
  }
  if (isFunction(options)) {
    getResponse = options as GetResponse<Request, Response, Error>
  }

  const createResponse$ = (request: RequestInput & TaskRequest) => {
    const normalizedRequest: Request = normalizeRequest(request)
    const isLazyRequest =
      typeof normalizedRequest.lazy === 'boolean'
        ? normalizedRequest.lazy
        : lazy

    let response$ = xs
      .create<Response>({
        start: function (this: any, observer) {
          const disposeCallback = (_: any) => (this.dispose = _)

          if (getProgressiveResponse) {
            getProgressiveResponse(
              normalizedRequest,
              observer,
              disposeCallback,
              response$
            )
          } else if (getResponse) {
            let syncCallback = true
            const callback = (err: Error | null, result?: Response) => {
              if (err) {
                observer.error(err)
              } else {
                observer.next(result!)
                syncCallback
                  ? Promise.resolve().then(() => observer.complete())
                  : observer.complete()
              }
            }
            const res = getResponse(
              normalizedRequest,
              callback,
              disposeCallback,
              response$
            )
            syncCallback = false
            if (res && isFunction(res.then)) {
              const promiseCb = (result: Response) => callback(null, result)
              // handle old promises
              if (isFunction(res.catch)) {
                res.then(promiseCb).catch(callback)
              } else {
                ;(res as any).then(promiseCb, callback)
              }
            }
          }
        },
        stop: function (this: any) {
          isFunction(this.dispose) && this.dispose()
        },
      })
      .remember()
    // should adapt response$ here before attaching request
    response$ = adapt(response$)
    const responseWithRequest$ = attachRequest(response$, normalizedRequest)

    if (!isLazyRequest) {
      emptySubscribe(response$)
    }
    return responseWithRequest$
  }
  //
  return (sink$: Stream<RequestInput>) => {
    // convert MemoryStream sink$ to just Stream
    // TOTO: remove this after update of @cycle/run
    const request$ = xs.create<RequestInput>()

    sink$.addListener({
      next: (r) => request$.shamefullySendNext(r),
      error: (e) => request$.shamefullySendError(e),
      complete: () => request$.shamefullySendComplete(),
    })

    const response$$ = request$.map(createResponse$)
    const makeSource = makeTaskSource
    const source = makeSource(response$$ as any, {
      isolateMap,
    })
    emptySubscribe(response$$)

    if (options.dispose) {
      ;(source as any).dispose = options.dispose
    }
    return source
  }
}

export default makeTaskDriver
