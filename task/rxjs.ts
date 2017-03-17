import { Observable } from 'rxjs/Observable'
import {
  makeTaskDriver as _makeTaskDriver
} from './makeTaskDriver'
import attachRequest from './attachRequest'
import { makeTaskSource as _makeTaskSource } from './makeTaskSource'
import { MakeTaskSourceOptions } from './interfaces'

export type ResponseStream<Response, Request> =
  Observable<Response> & { request: Request }

export type ResponsesStream<Response, Request> =
  Observable<ResponseStream<Response, Request>>

export interface TaskSource<Request, Response> {
  filter<Req>(predicate: (request: Request & Req) => boolean): TaskSource<Request & Req, Response>
  select<Res>(category?: string):
    Observable<ResponseStream<Response & Res, Request>>
  select<Res, Req>(category?: string):
    Observable<ResponseStream<Response & Res, Request & Req>>
}

export function makeTaskSource<Request, Response>(
  response$$: ResponsesStream<Response, Request>,
): TaskSource<Request, Response>

export function makeTaskSource<RequestInput, Request, Response>(
  response$$: ResponsesStream<Response, Request>,
  options?: MakeTaskSourceOptions<Request, Request>
): TaskSource<Request, Response>

export function makeTaskSource(response$$: any, options?: any) {
  return _makeTaskSource(response$$, options)
}
