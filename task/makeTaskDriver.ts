import { ResponseStream, MakeSource } from './interfaces'
import xs, { Stream } from 'xstream'
import { adapt } from '@cycle/run/lib/adapt'
import { FantasyObservable } from '@cycle/run'
import makeTaskSource from './makeTaskSource'
import attachRequest from './attachRequest'

export type Stream<T> = Stream<T>

const isFunction = (f: any) => typeof f === 'function'
const empty = () => { }
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
  ResponseObserver
} from './interfaces'

export interface MakeTaskDriver {
  /**
   *  Basic task driver.
   *  Takes getResponse function as a single parameter.
   */
  <Request, Response, Error>(getResponse: GetResponse<Request, Response, Error>):
    TaskDriver<Request, Response>
  /**
   *  Task driver.
   */
  <Request, Response, Error>(
    params: {
      getResponse: GetResponse<Request, Response, Error>
      lazy?: boolean
      dispose?(): void
    }): TaskDriver<Request, Response>

  /**
   *  Task driver with custom source.
   */
  <Source, Request, Response, Error>(
    params: {
      getResponse: GetResponse<Request, Response, Error>
      lazy?: boolean,
      dispose?(): void
      makeSource: MakeSource<Source, Request, Request, Response>
    }): (request$: Stream<Request>) => Source

  /**
   *  Task driver with progressive response.
   */
  <Request, Response, Error>(
    params: {
      getProgressiveResponse: GetProgressiveResponse<Request, Response, Error>
      lazy?: boolean,
      dispose?(): void,
    }): TaskDriver<Request, Response>

  /**
   *  Task driver with progressive response and custom source.
   */
  <Source, Request, Response, Error>(
    params: {
      getProgressiveResponse: GetProgressiveResponse<Request, Response, Error>
      lazy?: boolean,
      dispose?(): void,
      makeSource: MakeSource<Source, Request, Request, Response>
    }): (request$: Stream<Request>) => Source

  /**
   *  Task driver with request input that should be normalized.
   */
  <RequestInput, Request, Response, Error>(
    params: {
      getResponse: GetResponse<Request, Response, Error>
      normalizeRequest(request: RequestInput): Request,
      isolateMap?(request: RequestInput): RequestInput,
      lazy?: boolean,
      dispose?(): void
    }): InputTaskDriver<RequestInput, Request, Response>

  /**
   *  Task driver with request input that should be normalized and custom source.
   */
  <Source, RequestInput, Request, Response, Error>(
    params: {
      getResponse: GetResponse<Request, Response, Error>
      normalizeRequest(request: RequestInput): Request,
      isolateMap?(request: RequestInput): RequestInput,
      lazy?: boolean,
      dispose?(): void,
      makeSource: MakeSource<Source, RequestInput, Request, Response>
    }): (request$: Stream<RequestInput>) => Source

  /**
   *  Task driver with progressive response and request input
   *  that should be normalized.
   */
  <RequestInput, Request, Response, Error>(
    params: {
      getProgressiveResponse: GetProgressiveResponse<Request, Response, Error>
      normalizeRequest(request: RequestInput): Request,
      isolateMap?(request: RequestInput): Request,
      lazy?: boolean,
      dispose?(): void
    }): InputTaskDriver<RequestInput, Request, Response>

  /**
   *  Task driver with progressive response and request input
   *  that should be normalized and custom source.
   */
  <Source, RequestInput, Request, Response, Error>(
    params: {
      getProgressiveResponse: GetProgressiveResponse<Request, Response, Error>
      normalizeRequest(request: RequestInput): Request,
      isolateMap?(request: RequestInput): Request,
      lazy?: boolean,
      dispose?(): void,
      makeSource: MakeSource<Source, RequestInput, Request, Response>
    }): (request$: Stream<RequestInput>) => Source
}

export const makeTaskDriver: MakeTaskDriver = function
  <Source, RequestInput, Request, Response, Error>(options: DriverOptions<Source,
    RequestInput & TaskRequest,
    Request & TaskRequest,
    Response, Error>):
  ((request$: any) => any) {
  let {
    getResponse,
    getProgressiveResponse,
    normalizeRequest = (_: any) => _,
    isolateMap,
    lazy = false,
    makeSource
  } = options

  if (normalizeRequest && !isolateMap) {
    isolateMap = normalizeRequest
  }
  if (isFunction(options)) {
    getResponse = options as GetResponse<Request, Response, Error>
  }

  const createResponse$ = (request: RequestInput & TaskRequest) => {
    const normalizedRequest = normalizeRequest(request)
    const isLazyRequest = typeof normalizedRequest.lazy === 'boolean'
      ? normalizedRequest.lazy : lazy

    let response$ = xs.create<Response>({
      start: function (this: any, observer) {
        const disposeCallback = (_: any) => this.dispose = _
        
        if (getProgressiveResponse) {
          getProgressiveResponse(
            normalizedRequest, observer, disposeCallback, response$
          )
        } else if (getResponse) {
          let syncCallback = true
          const callback = (err: Error | null, result: Response) => {
            if (err) {
              observer.error(err)
            } else {
              observer.next(result)
              syncCallback
                ? Promise.resolve().then(() => observer.complete())
                : observer.complete()
            }
          }
          let res = getResponse(
            normalizedRequest, callback, disposeCallback, response$
          )
          syncCallback = false
          if (res && isFunction(res.then)) {
            res.then((result: Response) => callback(null, result))
              .catch(callback)
          }
        }
      },
      stop: function (this: any) {
        isFunction(this.dispose) && this.dispose()
      }
    }).remember()
    
    response$ = adapt(response$)
    attachRequest(response$, normalizedRequest)
    // first we adapt, then attach request, then start stream
    // thus in getRequest response$ will be put in final version
    if (!isLazyRequest) {
      emptySubscribe(response$)
    }
    return response$
  }

  return (request$) => {
    const response$$ = request$.map(createResponse$)
    emptySubscribe(response$$)
    makeSource = makeSource || (makeTaskSource as any)
    const source = makeSource!(response$$, { makeSource, isolateMap })
    if (options.dispose) {
      (source as any).dispose = options.dispose
    }
    return source
  }
}

export default makeTaskDriver

