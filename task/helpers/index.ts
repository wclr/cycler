import { ResponseStream } from '../interfaces'
import xs, { Stream, MemoryStream } from 'xstream';
import { attachRequest } from '../attachRequest'

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
