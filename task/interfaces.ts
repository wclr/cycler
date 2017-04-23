import xs, { Stream, MemoryStream } from 'xstream';
import { Driver, FantasyObservable } from '@cycle/run';
import { adapt } from '@cycle/run/lib/adapt';

export type ResponseStream<Response, Request> = Stream<Response> & { request: Request }

export type ResponsesStream<Response, Request> =
  Stream<Stream<Response> & { request: Request }>

export interface MakeTaskSourceOptions<RequestInput, Request, Response> {
  isolateMap?(request: RequestInput): Request,
  makeSource?(response$$: ResponsesStream<Request, Response>,
    options: MakeTaskSourceOptions<RequestInput, Request, Response>): any
}

export interface MakeSource<Source, RequestInput, Request, Response> {  
  (response$$: ResponsesStream<Request, Response>,
    options: MakeTaskSourceOptions<RequestInput, Request, Response>): Source
}

export interface IsolateSource<Source, RequestInput, IsolatedRequest> {
  isolateSink(request$: Stream<RequestInput>, scope?: string): Stream<IsolatedRequest>
  isolateSource(source: Source, scope: string): Source
}

export interface TaskSource<Request, Response> {
  filter<Req>(predicate: (request: Request & Req) => boolean): TaskSource<Request & Req, Response>  
  select<Res>(category?: string):
    Stream<ResponseStream<Response & Res, Request>>
  select<Res, Req>(category?: string):
    Stream<ResponseStream<Response & Res, Request & Req>>
}

export type TaskDriver<Request, Response> =
  (request$: Stream<Request>) => TaskSource<Request, Response>

export type InputTaskDriver<RequestInput, Request, Response> =
  (request$: Stream<RequestInput>) => TaskSource<Request, Response>


export interface Thenable<R, Error> {
  then: (resolve: (result: R) => any) => any
  catch: (reject: (error: Error) => any) => any
}

export interface TaskRequest {
  lazy?: boolean
  category?: string
}
export type GetResponseCallback<Response, Error> =
  (err?: Error | null, response?: Response) => void
export type OnDispose = (disposeHandler: () => any) => void
export type GetResponse<Request, Response, Error> = (
  request: Request,
  callback: GetResponseCallback<Response, Error>,
  onDispose: OnDispose,
  response$: FantasyObservable
) => Thenable<Response, Error> | void

export type ResponseObserver<Response, Error> = {
  error: (error: Error) => any,
  next: (response: Response) => any,
  complete: () => any
}

export type GetProgressiveResponse<Request, Response, Error> = (
  request: Request,
  observer: ResponseObserver<Response, Error>,
  onDispose: OnDispose,
  response$: FantasyObservable
) => any

export interface DriverOptions<Source ,RequestInput, Request, Response, Error> {
  getResponse?: GetResponse<Request, Response, Error>
  getProgressiveResponse?: GetProgressiveResponse<Request, Response, Error>
  normalizeRequest?(request: RequestInput): Request
  isolateMap?(request: RequestInput): Request
  lazy?: boolean,
  dispose?(): any,
  makeSource?: MakeSource<Source, RequestInput, Request, Response>,
}
