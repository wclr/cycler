import { Stream, MemoryStream } from 'xstream'
import { FantasyObservable } from '@cycle/run'

export type Category = string | symbol

export type ResponseStreamWithRequest<Response, Request> = MemoryStream<
  Response
> & {
  request: Request
}

export type ResponseStream<Response, Request> = MemoryStream<Response>

export type ResponsesStream<Response, Request> = Stream<
  ResponseStream<Response, Request>
>

export interface MakeTaskSourceOptions<RequestInput, Request, Response> {
  isolateMap?(request: RequestInput): Request
  createResponse$?: (
    request: RequestInput
  ) => ResponseStreamWithRequest<Request, Response>
}

export interface MakeSource<Source, RequestInput, Request, Response> {
  (
    response$$: ResponsesStream<Response, Request>,
    options: MakeTaskSourceOptions<RequestInput, Request, Response>
  ): Source
}

export interface IsolateSource<Source, RequestInput, IsolatedRequest> {
  isolateSink(
    request$: Stream<RequestInput>,
    scope?: Category
  ): Stream<IsolatedRequest>
  isolateSource(source: Source, scope: Category): Source
}

export interface TaskSource<Request, Response> {
  filter<Req>(
    predicate: (request: Request & Req) => boolean
  ): TaskSource<Request & Req, Response>
  select<Res = unknown, Req = unknown>(
    category?: Category
  ): Stream<ResponseStream<Response & Res, Request & Req>>
  // pull<Res>(request: Request): ResponseStream<Response & Res, Request>
  // pull<Res, Req>(
  //   request: Request
  // ): ResponseStream<Response & Res, Request & Req>
}

export interface InputTaskSource<RequestInput, Request, Response> {
  filter<Req>(
    predicate: (request: Request & Req) => boolean
  ): InputTaskSource<RequestInput, Request & Req, Response>

  select<Res = unknown, Req = unknown>(
    category?: string
  ): Stream<ResponseStream<Response & Res, Request & Req>>
  // pull<Res>(request: RequestInput): ResponseStream<Response & Res, Request>
  // pull<Res, Req>(
  //   request: RequestInput
  // ): ResponseStream<Response & Res, Request & Req>
}

export type TaskDriver<Request, Response> = (
  request$: Stream<Request>
) => TaskSource<Request, Response>

export type InputTaskDriver<RequestInput, Request, Response> = (
  request$: Stream<RequestInput>
) => InputTaskSource<RequestInput, Request, Response>

export interface Thenable<R, Error> {
  then: (resolve: (result: R) => any) => any
  catch: (reject: (error: Error) => any) => any
}

export interface TaskRequest {
  lazy?: boolean
  category?: Category
}
export type GetResponseCallback<Response, Error> = (
  err?: Error | null,
  response?: Response
) => void
export type OnDispose = (disposeHandler: () => any) => void
export type GetResponse<Request, Response, Error> = (
  request: Request,
  callback: GetResponseCallback<Response, Error>,
  onDispose: OnDispose,
  response$: FantasyObservable<Response>
) => Thenable<Response, Error> | void

export type ResponseObserver<Response, Error> = {
  error: (error: Error) => any
  next: (response: Response) => any
  complete: () => any
}

export type GetProgressiveResponse<Request, Response, Error> = (
  request: Request,
  observer: ResponseObserver<Response, Error>,
  onDispose: OnDispose,
  response$: FantasyObservable<Response>
) => any

export interface DriverOptions<Source, RequestInput, Request, Response, Error> {
  getResponse?: GetResponse<Request, Response, Error>
  getProgressiveResponse?: GetProgressiveResponse<Request, Response, Error>
  normalizeRequest?(request: RequestInput): Request
  isolateMap?(request: RequestInput): Request
  lazy?: boolean
  dispose?(): any
}
