import { Stream, MemoryStream, default as xs } from 'xstream'
import { StreamAdapter } from '@cycle/base'
import adapter from '@cycle/xstream-adapter'
import { GetResponse, GetProgressiveResponse, ResponseStreamExtra } from './interfaces'
import { makeTaskDriver as _makeTaskDriver } from './makeTaskDriver'
import attachRequest from './attachRequest'
import { makeTaskSource as _makeTaskSource } from './makeTaskSource'
import { MakeTaskSourceOptions } from './interfaces'

export type ResponseStream<Response, Request> =
  MemoryStream<Response> & ResponseStreamExtra<Request>

export type ResponsesStream<Response, Request> =
  Stream<ResponseStream<Response, Request>>

export interface TaskSource<Request, Response> {
  filter<Req>(predicate: (request: Request & Req) => boolean): TaskSource<Request & Req, Response>
  select<Res>(category?: string):
    ResponsesStream<Response & Res, Request>
  select<Res, Req>(category?: string):
    ResponsesStream<Response & Res, Request & Req>
}

export function success<Response, Request>(r$: ResponseStream<Response, Request>)
  : ResponseStream<Response, Request> {
  return attachRequest(r$.replaceError(xs.empty), r$.request)
}

export function failure<Error, Request>(r$: ResponseStream<any, Request>)
  : ResponseStream<Error, Request> {
  return attachRequest(<MemoryStream<Error>>r$
    .map(xs.empty).flatten().replaceError(xs.of), r$.request)
}

export function pair<Request, T>(r$: ResponseStream<T, Request>)
  : Stream<[Request, T]> {
  return r$.map<[Request, T]>(response => [r$.request, response])
}

export function makeTaskDriver<Request, Response, Error>
  (getResponse: GetResponse<Request, Response, Error>):
  (request$: Stream<Request>, runSA?: StreamAdapter) => TaskSource<Request, Response>

export function makeTaskDriver
  <Request, Response, Error>(
  params: {
    getResponse: GetResponse<Request, Response, Error>
    lazy?: boolean
  }):
  (request$: Stream<Request>, runSA?: StreamAdapter) => TaskSource<Request, Response>

export function makeTaskDriver
  <Request, Response, Error>(
  params: {
    getProgressiveResponse: GetProgressiveResponse<Request, Response, Error>
    lazy?: boolean
  }):
  (request$: Stream<Request>, runSA?: StreamAdapter) => TaskSource<Request, Response>

export function makeTaskDriver
  <RequestInput, Request, Response, Error>(
  params: {
    getResponse: GetResponse<Request, Response, Error>
    normalizeRequest(request: RequestInput): RequestInput,
    isolateMap?(request: RequestInput): RequestInput,
    lazy?: boolean
  }):
  (request$: Stream<RequestInput>, runSA?: StreamAdapter) =>
    TaskSource<RequestInput, Response>

export function makeTaskDriver
  <RequestInput, Request, Response, Error>(
  params: {
    getProgressiveResponse: GetProgressiveResponse<Request, Response, Error>
    normalizeRequest(request: RequestInput): Request,
    isolateMap?(request: RequestInput): Request,
    lazy?: boolean
  }):
  (request$: Stream<RequestInput>, runSA?: StreamAdapter) =>
    TaskSource<Request, Response>

export function makeTaskDriver(options: any) {
  return (request$: any, runSA: any, ...rest: any[]) =>
    (<any>_makeTaskDriver)(options)(request$, runSA || adapter, ...rest)
}

export function makeTaskSource<Request, Response>(
  response$$: ResponsesStream<Response, Request>,
): TaskSource<Request, Response>

export function makeTaskSource<RequestInput, Request, Response>(
  response$$: ResponsesStream<Response, Request>,
  options?: MakeTaskSourceOptions<Request, Request>
): TaskSource<Request, Response>

export function makeTaskSource(response$$: any, options?: any) {
  return _makeTaskSource(adapter, response$$, options)
}
