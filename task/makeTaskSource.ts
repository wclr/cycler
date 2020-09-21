import { adapt } from '@cycle/run/lib/adapt'
import {
  MakeTaskSourceOptions,
  ResponsesStream,
  TaskSource,
  InputTaskSource,
} from './interfaces'

import { requestOps } from './requestOps'

export function makeTaskSource<Request, Response>(
  response$$: ResponsesStream<Response, Request>,
  options: MakeTaskSourceOptions<Request, Request, Response>
): TaskSource<Request, Response>

export function makeTaskSource<RequestInput, Request, Response>(
  response$$: ResponsesStream<Request, Response>,
  options: MakeTaskSourceOptions<RequestInput, Request, Response>
): InputTaskSource<RequestInput, Request, Response>

export function makeTaskSource<RequestInput, Request, Response>(
  response$$: ResponsesStream<Request, Response>,
  options: MakeTaskSourceOptions<RequestInput, Request, Response> = {}
): InputTaskSource<RequestInput, Request, Response> {
  const driverSource = {
    filter(predicate: any): any {
      const filteredResponse$$ = response$$.filter((r$: any) =>
        predicate(r$.request)
      )
      const makeSource = makeTaskSource
      return makeSource(filteredResponse$$, options)
    },
    isolateSink(request$: any, scope: string) {
      return request$.map((req: RequestInput | Request) => {
        const requestToIsolate: Request = options.isolateMap
          ? options.isolateMap(<RequestInput>req)
          : <Request>req

        return requestOps.isolateRequest(requestToIsolate, scope)
      })
    },
    isolateSource: (source: any, scope: any) => {
      const requestPredicate = (req: Request) => {
        return requestOps.filterIsolatedRequest(req, scope)
      }
      return source.filter(requestPredicate)
    },
    select(category?: string) {
      if (!category) {
        return adapt(response$$)
      }
      if (typeof category !== 'string' && typeof category !== 'symbol') {
        throw new Error(`category should be a string or a symbol`)
      }
      const requestPredicate = (request: any) =>
        request && request.category === category
      return driverSource.filter(requestPredicate).select()
    },
    pull(request: RequestInput) {
      return options.createResponse$!(
        requestOps.addProperty(request, 'lazy', true)
      )
    },
  }
  return driverSource as any
}

export default makeTaskSource
