import makeTaskSource from './makeTaskSource'
import attachRequest from './attachRequest'
import { StreamAdapter, Observer } from '@cycle/base'

const isFunction = (f: any) => typeof f === 'function'

import {
  DriverOptions,
  TaskDriver,
  TaskSource,
  TaskRequest,
  GetResponse,
  GetProgressiveResponse,
  ResponseObserver
} from './interfaces'

export function makeTaskDriver<Request, Response, Error>
  (getResponse: GetResponse<Request, Response, Error>):
  TaskDriver<Request, Response>

export function makeTaskDriver
  <Request, Response, Error>(
  params: {
    getResponse: GetResponse<Request, Response, Error>
    lazy?: boolean
  }): TaskDriver<Request, Response>

export function makeTaskDriver
  <Request, Response, Error>(
  params: {
    getProgressiveResponse: GetProgressiveResponse<Request, Response, Error>
    lazy?: boolean
  }): TaskDriver<Request, Response>

export function makeTaskDriver
  <RequestInput, Request, Response, Error>(
  params: {
    getResponse: GetResponse<Request, Response, Error>
    normalizeRequest(request: RequestInput): Request,
    isolateMap?(request: RequestInput): Request,
    lazy?: boolean
  }): TaskDriver<Request, Response>

export function makeTaskDriver
  <RequestInput, Request, Response, Error>(
  params: {
    getProgressiveResponse: GetProgressiveResponse<Request, Response, Error>
    normalizeRequest(request: RequestInput): Request,
    isolateMap?(request: RequestInput): Request,
    lazy?: boolean
  }): TaskDriver<Request, Response>

export function makeTaskDriver
  <RequestInput, Request, Response, Error>
  (options: DriverOptions<RequestInput & TaskRequest, Request & TaskRequest, Response, Error>):
  ((request$: any, runSA: StreamAdapter) => any) {
  let {
    getResponse,
    getProgressiveResponse,
    normalizeRequest = (_: any) => _,
    isolateMap,
    lazy = false
  } = options

  if (normalizeRequest && !isolateMap) {
    isolateMap = normalizeRequest
  }
  if (isFunction(options)) {
    getResponse = options as GetResponse<Request, Response, Error>
  }

  return (request$, runStreamAdapter) => {
    const empty = () => { }
    const emptySubscribe = (stream: any) =>
      runStreamAdapter.streamSubscribe((stream), {
        next: empty,
        error: empty,
        complete: empty
      })

    const {stream: response$$, observer} = runStreamAdapter.makeSubject()
    runStreamAdapter.streamSubscribe(request$, {
      next: (request: RequestInput & TaskRequest) => {
        const normalizedRequest = normalizeRequest(request)
        const isLazyRequest = typeof normalizedRequest.lazy === 'boolean'
          ? normalizedRequest.lazy : lazy
        const promise = Promise.resolve()
        const promisify = (cb: any) => promise.then(cb)
        let response$ = runStreamAdapter.adapt({}, (_: any, observer: Observer<Response>) => {
          let dispose: any
          const disposeCallback = (_: any) => dispose = _
          if (getProgressiveResponse) {            
            getProgressiveResponse(
              normalizedRequest, observer, disposeCallback
            )
          } else if (getResponse) {
            const callback = (err: Error | null, result: Response) => {
              if (err) {
                observer.error(err)
              } else {
                observer.next(result)
                observer.complete()
              }
            }
            let res = getResponse(normalizedRequest, callback, disposeCallback)
            if (res && isFunction(res.then)) {
              res.then((result: Response) => callback(null, result), callback)
            }
          }
          return () => {
            isFunction(dispose) && dispose()
          }
        })
        if (!isLazyRequest) {
          response$ = runStreamAdapter.remember(response$)
          emptySubscribe(response$)
        }
        attachRequest(response$, normalizedRequest)
        observer.next(response$)
      },
      error: observer.error,
      complete: observer.complete
    })

    return makeTaskSource(runStreamAdapter, response$$, { isolateMap })
  }
}

export default makeTaskDriver
