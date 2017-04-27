import xs, { Stream, MemoryStream } from 'xstream';
import { Driver, FantasyObservable } from '@cycle/run';
import { adapt } from '@cycle/run/lib/adapt';
import {
  MakeTaskSourceOptions, ResponsesStream,
  TaskSource
} from './interfaces'

import { requestOps } from './requestOps'

export function makeTaskSource<Request, Response>(
  response$$: ResponsesStream<Request, Response>,
  options: MakeTaskSourceOptions<Request, Request, Response>
): TaskSource<Request, Response>

export function makeTaskSource<RequestInput, Request, Response>(
  response$$: ResponsesStream<Request, Response>,
  options: MakeTaskSourceOptions<RequestInput, Request, Response>
): TaskSource<Request, Response>

export function makeTaskSource<RequestInput, Request, Response>(
  response$$: ResponsesStream<Request, Response>,
  options: MakeTaskSourceOptions<RequestInput, Request, Response> = {}
): TaskSource<Request, Response> {

  const driverSource = {
    filter(predicate: (any)): any {
      const filteredResponse$$ = response$$.filter(
        (r$: any) => predicate(r$.request)
      )
      const makeSource = options.makeSource || makeTaskSource
      return makeSource(filteredResponse$$, options)
    },
    isolateSink(request$: any, scope: string) {
      return request$.map((req: RequestInput | Request) => {
        const requestToIsolate: Request =
          options.isolateMap ? options.isolateMap(<RequestInput>req) : <Request>req

        return requestOps.isolateRequest(requestToIsolate, scope)
      })
    },
    isolateSource: (source: any, scope: any) => {
      let requestPredicate = (req: Request) => {
        return requestOps.filterIsolatedRequest(req, scope)
      }
      return source.filter(requestPredicate)
    },
    select(category?: string) {
      if (!category) {
        return adapt(response$$)
      }
      if (typeof category !== 'string') {
        throw new Error(`category should be a string`)
      }
      const requestPredicate =
        (request: any) => request && request.category === category
      return driverSource.filter(requestPredicate).select()
    }    
  }
  return driverSource
}

export default makeTaskSource