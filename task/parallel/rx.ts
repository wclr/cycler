// import { Observable } from 'rx'
// import { TaskSource } from '../rx'
// import { success, failure, pair } from '../rx'
// import isolate from '@cycle/isolate'

// export interface Options {
//   scope?: string
//   ignoreErrors?: boolean
// }
// export type RequestStream<Request> = Observable<Request>
// export type ErrorsStream = Observable<number[]>
// export type ResultsStream<Response, Error> = Observable<(Response | Error)[]>

// interface InnerParallelSources<Request, Response, Error> {
//   source: TaskSource<Request, Response>
//   tasks: Request[]
//   options?: Options
// }

// type ParallelParams<Request, Response, Error> = [
//   TaskSource<Request, Response>,
//   Request[],
//   Options
// ]

// interface InnerParallelSinks<Request, Response, Error> {
//   source: RequestStream<Request>
//   results$: ResultsStream<Response, Error>
//   errors$: ErrorsStream
// }

// export type Indexed = { _index: number }

// export type ParallelSinks<Request, Response, Error> = [
//   RequestStream<Request & Indexed>,
//   ResultsStream<Response, Error>,
//   ErrorsStream
// ]

// function attachIndex<T>(task: T & Indexed, index: number): T & Indexed {
//   task._index = index
//   return task
// }

// let log = <T>(name: string) => <T>(x: T): T => !console.log(name + ':', x) && x

// function InnerParallel<Request, Response, Error>
//   ({source, tasks, options = {}}: InnerParallelSources<Request, Response, Error>)
//   : InnerParallelSinks<Request, Response, Error> {
//   let ignoreErrors = options.ignoreErrors
//   let results = Array(tasks.length).fill(undefined)
//   let response$$ = source.select()
//   let collectResults = (results: Response[],
//     [req, result]: [Request & Indexed, Response]) => {
//     results[req._index] = result
//     return results
//   }

//   let collectErrors = (errors: number[],
//     [req, error]: [Request & Indexed, Error]) => {
//     return errors.concat(req._index)
//   }

//   let errors$ = response$$
//     .map(failure).map(pair)
//     .mergeAll()
//     .scan(collectErrors, [])
//     .startWith([])

//   let firstError$ = ignoreErrors ? Observable.empty() : errors$.skip(1)

//   let result$ = Observable.merge(
//     response$$.map(success),
//     response$$.map(failure)
//   )
//     .map(pair)
//     .mergeAll().takeUntil(firstError$)

//   let allCompleted$ = result$.scan((count) => count + 1, 0)
//     .filter(count => count === tasks.length)

//   let results$ = result$
//     .scan(collectResults, results)
//   //.shareReplay(1)

//   let finished$ = Observable.merge(
//     firstError$,
//     allCompleted$
//   ).take(1)
//   //.map(log('finished$'))

//   return {
//     source: Observable.fromArray(tasks),
//     results$: finished$.withLatestFrom(results$, (_, results) => results),
//     errors$: finished$.withLatestFrom(errors$, (_, errors) => errors)
//   }
// }

// export function Parallel<Request, Response, Error>
//   (source: TaskSource<Request, Response>, tasks: Request[], options?: Options)
//   : ParallelSinks<Request, Response, Error> {
//   let scope = options && options.scope
//   let parallel = (
//     isolate(InnerParallel, scope) as typeof InnerParallel)<Request, Response, Error>
//     ({ source, tasks, options })
//   let request$ = parallel.source.map(attachIndex)
//   return [
//     request$, parallel.results$, parallel.errors$
//   ]
// }

// export default Parallel