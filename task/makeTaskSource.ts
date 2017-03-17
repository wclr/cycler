import xs, { Stream, MemoryStream } from 'xstream';
import { Driver, FantasyObservable } from '@cycle/run';
import { adapt } from '@cycle/run/lib/adapt';
import { MakeTaskSourceOptions, ResponsesStream } from './interfaces'


type NameSpaced = { _namespace?: string[] }

let _isolateRequest = <Request>(requestToIsolate: Request & NameSpaced, scope: string):
  Request & NameSpaced => {
  if (scope) {
    requestToIsolate._namespace = requestToIsolate._namespace || []
    if (requestToIsolate._namespace.indexOf(scope) === -1) {
      requestToIsolate._namespace.push(scope)
    }
  }
  return requestToIsolate
}

let _filterIsolatedRequest =
  <Request>(req: Request & NameSpaced, scope: string) => {
    return Array.isArray(req._namespace) &&
      req._namespace.indexOf(scope) !== -1
  }

export function setIsolate<Request>(
  isolateRequest: (request: Request) => Request,
  filterIsolatedRequest?: (request: Request, scope: string) => boolean
) {
  _isolateRequest = isolateRequest
  if (filterIsolatedRequest) {
    _filterIsolatedRequest = filterIsolatedRequest
  }
}

export function makeTaskSource<RequestInput, Request, Response>(
  response$$: ResponsesStream<Request, Response>,
  options: MakeTaskSourceOptions<RequestInput, Request> = {}
) {

  const driverSource = {
    filter(predicate: (any)): any {
      const filteredResponse$$ = response$$.filter(
        (r$: any) => predicate(r$.request)
      )
      return makeTaskSource(filteredResponse$$, options)
    },
    isolateSink(request$: any, scope: string) {
      return request$.map((req: RequestInput | Request) => {
        const requestToIsolate: Request & NameSpaced =
          options.isolateMap ? options.isolateMap(<RequestInput>req) : <Request>req

        return _isolateRequest(requestToIsolate, scope)
      })
    },
    isolateSource: (source: any, scope: any) => {
      let requestPredicate = (req: Request & NameSpaced) => {
        return _filterIsolatedRequest(req, scope)
      }
      return source.filter(requestPredicate)
    },
    select(category: string) {
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