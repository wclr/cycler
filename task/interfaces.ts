import { StreamAdapter } from '@cycle/base'

export interface ResponseStreamExtra<Request> {
  request: Request;
}
export type RequestStream = any
export type ResponsesStream = any

export interface MakeTaskSourceOptions<RequestInput, Request> {
  isolateMap?(request: RequestInput): Request
}

export interface TaskSource<Request, Response> {
  filter(predicate: (request: Request) => boolean): TaskSource<Request, Response>
  select(category?: string): ResponsesStream
}

export type TaskDriver<Request, Response> =
  (request$: RequestStream, runSA: StreamAdapter) => TaskSource<Request, Response>


export interface Thenable<R, Error> {
  then: (resolve: (result: R) => any, reject: (error: any, ...rest: any[]) => any) => any
}
export interface TaskRequest {
  lazy?: boolean
  category?: string
}
export type GetResponseCallback<Response, Error> = (err?: Error | null, response?: Response) => void
export type OnDispose = (disposeHandler: () => any) => void
export type GetResponse<Request, Response, Error> = (
  request: Request,
  callback: GetResponseCallback<Response, Error>,
  onDispose: OnDispose
) => Thenable<Response, Error> | void

export type ResponseObserver<Response, Error> = {
  error: (error: Error) => any,
  next: (response: Response) => any,
  complete: () => any
}

export type GetProgressiveResponse<Request, Response, Error> = (
  request: Request,
  observer: ResponseObserver<Response, Error>,
  onDispose: OnDispose
) => any

export interface DriverOptions<RequestInput, Request, Response, Error> {
  getResponse?: GetResponse<Request, Response, Error>
  getProgressiveResponse?: GetProgressiveResponse<Request, Response, Error>
  normalizeRequest?(request: RequestInput): Request
  isolateMap?(request: RequestInput): Request
  lazy?: boolean
}