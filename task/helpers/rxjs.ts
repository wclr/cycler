import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/observable/of'
import 'rxjs/add/operator/catch'
import 'rxjs/add/operator/switch'
import { attachRequest } from '../attachRequest'
import { ResponseStream } from '../rxjs'

/**
* Applied to responses metastream make a it emit only successful response streams,
* by replacing errors with empty stream
* @param  {ResponseStream<Response} r$ Repsonse stream 
* @param  {} Request>
* @returns ResponseStream 
*/
export function success<Response, Request>(r$: ResponseStream<Response, Request>)
  : ResponseStream<Response, Request> {
  return attachRequest(r$.catch(Observable.empty) as ResponseStream<Response, Request>, r$.request)
}

export function failure<Error, Request>(r$: ResponseStream<any, Request>)
  : ResponseStream<Error, Request> {
  return attachRequest(<Observable<Error>>r$.map(Observable.empty).switch()
    .catch(Observable.of), r$.request)
}

export function pair<Request, T>(r$: ResponseStream<T, Request>)
  : Observable<[Request, T]> {  
  return r$.map<T, [Request, T]>((response: T) => [r$.request, response])
}

export * from './common'