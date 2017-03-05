import { TaskSource } from '../xstream'
import { success, failure, pair } from '../xstream'
import { MemoryStream, Stream, default as xs } from 'xstream'

export type SequenceSink<Request, Response, Error> = [
  Stream<Request>,
  MemoryStream<Response[]>,
  MemoryStream<Error[]>  
]

export function Sequence<Request, Response, Error>
  (source: TaskSource<Request, Response>, tasks: Request[]) {
  let gather = (results: any[], res: Response) => results.concat(res)
  let failed$ = source.select().map(failure)
  let succeed$ = source.select().map(success)
    .flatten()
    .fold(gather, [])
  
  // return {
  //   success: succeed$.filter(({length}) => length === tasks.length),
  //   failure: succeed$.map(succeed =>
  //     failed$.map(failed => succeed.concat(failed))
  //   ),
  //   task$: succeed$
  //     .map(succeed => tasks[succeed.length])
  // }
}

// function parallel(tasks: any[], source: TaskSource<any, number>) {
//   let gather = (resultsIndex: any[], [req, res]) => req._index)
//     let failed$ = source.select().map(failure)
//   let succeed$ = source.select().map(success)
//     .map(pair)
//     .flatten()
//     .fold(gather, {})
//   return {
//     success: succeed$.filter(({length}) => length === tasks.length),
//     failure: succeed$.map(succeed =>
//       failed$.map(failed => succeed.concat(failed))
//     ),
//     source: xs.fromArray(tasks)
//   }
// }