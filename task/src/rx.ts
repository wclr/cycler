import { Observable } from 'rx'
import { StreamAdapter } from '@cycle/base';
import adapter from '@cycle/rx-adapter'
import { GetResponse, GetProgressiveResponse, ResponseStreamExtra } from './interfaces'
import {
  makeTaskDriver as _makeTaskDriver
} from './makeTaskDriver'
import attachRequest from './attachRequest'
import { makeTaskSource as _makeTaskSource } from './makeTaskSource'
import { MakeTaskSourceOptions } from './interfaces'

export type ResponseStream<Response, Request> =
  Observable<Response> & ResponseStreamExtra<Request>

export type ResponsesStream<Response, Request> =
  Observable<ResponseStream<Response, Request>>

export interface TaskSource<Request, Response> {
  filter<Req>(predicate: (request: Request & Req) => boolean): TaskSource<Request & Req, Response>
  select<Res>(category?: string):
    // ResponsesStream<Response & Res, Request>
    Observable<ResponseStream<Response & Res, Request>>
  select<Res, Req>(category?: string):
    //ResponsesStream<Response & Res, Request & Req>
    Observable<ResponseStream<Response & Res, Request & Req>>
}

/**
* Applied to responses metastream make a it emit only successful response streams,
* by replacing errors with empty stream
* @param  {ResponseStream<Response} r$ Repsonse stream 
* @param  {} Request>
* @returns ResponseStream 
*/
export function success<Response, Request>(r$: ResponseStream<Response, Request>)
  : ResponseStream<Response, Request> {
  return attachRequest(r$.catch(Observable.empty), r$.request)
}

export function failure<Error, Request>(r$: ResponseStream<any, Request>)
  : ResponseStream<Error, Request> {
  return attachRequest(<Observable<Error>>r$.map(Observable.empty).switch()
    .catch(Observable.of), r$.request)
}
 
export function pair<Request, T>(r$: ResponseStream<T, Request>)
  : Observable<[Request, T]> {
  return r$.map<[Request, T]>(response => [r$.request, response])
}

export function makeTaskDriver<Request, Response, Error>
  (getResponse: GetResponse<Request, Response, Error>):
  (request$: Observable<Request>, runSA?: StreamAdapter) => TaskSource<Request, Response>

export function makeTaskDriver
  <Request, Response, Error>(
  params: {
    getResponse: GetResponse<Request, Response, Error>
    lazy?: boolean
  }):
  (request$: Observable<Request>, runSA?: StreamAdapter) => TaskSource<Request, Response>

export function makeTaskDriver
  <Request, Response, Error>(
  params: {
    getProgressiveResponse: GetProgressiveResponse<Request, Response, Error>
    lazy?: boolean
  }):
  (request$: Observable<Request>, runSA?: StreamAdapter) => TaskSource<Request, Response>

export function makeTaskDriver
  <RequestInput, Request, Response, Error>(
  params: {
    getResponse: GetResponse<Request, Response, Error>
    normalizeRequest(request: RequestInput): RequestInput,
    isolateMap?(request: RequestInput): RequestInput,
    lazy?: boolean
  }):
  (request$: Observable<RequestInput>, runSA?: StreamAdapter) =>
    TaskSource<RequestInput, Response>

export function makeTaskDriver
  <RequestInput, Request, Response, Error>(
  params: {
    getProgressiveResponse: GetProgressiveResponse<Request, Response, Error>
    normalizeRequest(request: RequestInput): Request,
    isolateMap?(request: RequestInput): Request,
    lazy?: boolean
  }):
  (request$: Observable<RequestInput>, runSA?: StreamAdapter) =>
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
