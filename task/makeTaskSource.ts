import { StreamAdapter, Observer } from '@cycle/base'
import { MakeTaskSourceOptions } from './interfaces'

const makeFilter = (streamAdapter: StreamAdapter) =>
  (stream: any, predicate: (r$: any) => boolean) =>
    streamAdapter.adapt({}, (_: any, observer: Observer<any>) =>
      streamAdapter.streamSubscribe(stream, {
        next: (r$) => {
          if (predicate(r$)) {
            observer.next(r$)
          }
        },
        error: observer.error.bind(observer),
        complete: observer.complete.bind(observer)
      })
    )

const isolateField = '_namespace'
type NameSpaced = {_namespace?: string[]}
export function makeTaskSource<RequestInput, Request>(
  runStreamAdapter: StreamAdapter,
  response$$: any,
  options: MakeTaskSourceOptions<RequestInput, Request> = {}
) {

  let filterStream = makeFilter(runStreamAdapter)

  let driverSource = {
    filter(predicate: any): any {
      const filteredResponse$$ = filterStream(
        response$$, (r$: any) => predicate(r$.request)
      )
      return makeTaskSource(runStreamAdapter, filteredResponse$$, options)
    },
    isolateSink(request$: any, scope: string) {
      return request$.map((req: RequestInput | Request) => {        
        let isolatedReq: Request & NameSpaced =
          options.isolateMap ? options.isolateMap(<RequestInput>req) : <Request>req
        isolatedReq._namespace = isolatedReq._namespace || []
        if (isolatedReq._namespace.indexOf(scope) === -1) {
          isolatedReq._namespace.push(scope)  
        }        
        return isolatedReq
      })
    },
    isolateSource: (source: any, scope: any) => {
      let requestPredicate = (req: Request & NameSpaced) => {
        return Array.isArray(req._namespace) &&
          req._namespace.indexOf(scope) !== -1
      }

      return source.filter(requestPredicate)
    },    
    select(category: string) {
      if (!category) {
        return response$$
      }
      if (typeof category !== 'string') {
        throw new Error(`category should be a string`)
      }      
      let requestPredicate =
        (request: any) => request && request.category === category
      return driverSource.filter(requestPredicate).select()
    }
  }
  return driverSource
}

export default makeTaskSource