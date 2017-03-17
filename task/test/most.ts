import xs, {Stream} from 'xstream'
import * as most from 'most'
import { run } from '@cycle/most-run'
import { setAdapt } from '@cycle/run/lib/adapt'

import isolate from '@cycle/isolate'
import * as test from 'tape'
import { basicDriver } from './driver'

test('Set most adapt', (t) => {
  setAdapt(stream => most.from(stream))
  t.end()
})

// test('Most: run (isolation, cancellation)', (t) => {
//   const requests0 = [
//     { name: 'John', lazy: true, aborted: false },
//     { name: 'Alex', lazy: true, aborted: false }
//   ]
//   const requests1 = [{ name: 'Jane', aborted: false }]

//   const Dataflow = ({source, request$}: { source: any, request$: any }, num: number) => {
//     return {
//       result: source.select()
//         .switch().map((data: any) => ({
//           num, data
//         })),
//       source: request$
//     }
//   }

//   const Main = ({source}: { source: any }) => {
//     const dataflow0 = isolate(Dataflow, 'scope0')({
//       request$: most.from(requests0),
//       source
//     }, '0')
//     const dataflow1 = isolate(Dataflow, 'scope1')({
//       request$: most.from(requests1),
//       source
//     }, '1')
//     return {
//       result: most.merge(dataflow0.result, dataflow1.result),
//       source: most.merge(dataflow0.source, dataflow1.source)
//     }
//   }
//   let count = 0
//   run(Main, {
//     result: (result$: any) => {
//       result$.subscribe({
//         next: (res: any) => {
//           if (res.num === '0') {
//             t.is(res.data, 'async Alex')
//             count++
//           }
//           if (res.num === '1') {
//             t.is(res.data, 'async Jane')
//             t.is(res.data, 'async Jane')
//             count++
//           }
//           if (count >= 2) {
//             setTimeout(() => {
//               t.is(count, 2, 'two requests done')
//               t.ok(requests0[0].aborted, 'first lazy request aborted')
//               t.notOk(requests0[1].aborted, 'second not aborted')
//               t.notOk(requests1[0].aborted, 'third not aborted')
//               t.end()
//             }, 50)
//           }
//         },
//         error: () => { },
//         complete: () => { }
//       })
//       return {}
//     },
//     source: basicDriver
//   })
// })
