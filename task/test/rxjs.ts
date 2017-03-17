import xs, { Stream } from 'xstream'
import { Observable as O, Subject, VirtualTimeScheduler } from 'rxjs'
import { run } from '@cycle/rxjs-run'
import { setAdapt } from '@cycle/run/lib/adapt'

import isolate from '@cycle/isolate'
import * as test from 'tape'
import { basicDriver, Request, Response } from './driver'
import { TaskSource } from '../rxjs'

type AsyncSource = TaskSource<Request, Response>

test('Set rxjs adapt', (t) => {
  setAdapt(stream => O.from(stream))
  t.end()
})

test('RxJs: Responses stream is hot and not remembered (TestScheduler)', (t) => {
  const scheduler = new VirtualTimeScheduler()
  const request = { name: 'John' }
  const response = 'async John'
  const source = basicDriver(
    xs.from(O.from([
      O.of({ name: 'Jane' }),
      O.of(request)
        .delay(50, scheduler)
    ]).mergeAll())
  )
  O.timer(0, scheduler).map(() => {
    O.from(O.from(source.select())
      .mergeAll())
      .subscribe((x) => {
        t.deepEqual(x, response, 'response correct')
        t.end()
      })
  }).subscribe()
  Promise.resolve().then(() => scheduler.flush())
})

test('RxJs: run (isolation, cancellation)', (t) => {
  const requests0 = [
    { name: 'John', lazy: true, aborted: false },
    { name: 'Alex', lazy: true, aborted: false }
  ]
  const requests1 = [{ name: 'Jane', aborted: false }]

  const Dataflow = ({source, request$}: { source: AsyncSource, request$: O<Request> }, num: number) => {
    return {
      result: source.select()
        .switch().map((data: any) => ({
          num, data
        })),
      source: request$
    }
  }

  const Main = ({source}: { source: AsyncSource }) => {
    const dataflow0 = isolate(Dataflow, 'scope0')({
      request$: O.from(requests0),
      source
    }, '0')
    const dataflow1 = isolate(Dataflow, 'scope1')({
      request$: O.from(requests1),
      source
    }, '1')
    return {
      result: O.merge(dataflow0.result, dataflow1.result),
      source: O.merge(dataflow0.source, dataflow1.source)
    }
  }
  let count = 0
  run(Main, {
    result: (result$: any) => {
      result$.subscribe({
        next: (res: any) => {
          if (res.num === '0') {
            t.is(res.data, 'async Alex')
            count++
          }
          if (res.num === '1') {
            t.is(res.data, 'async Jane')
            t.is(res.data, 'async Jane')
            count++
          }
          if (count >= 2) {
            setTimeout(() => {
              t.is(count, 2, 'two requests done')
              t.ok(requests0[0].aborted, 'first lazy request aborted')
              t.notOk(requests0[1].aborted, 'second not aborted')
              t.notOk(requests1[0].aborted, 'third not aborted')
              t.end()
            }, 50)
          }
        },
        error: () => { },
        complete: () => { }
      })
      return {}
    },
    source: basicDriver
  })
})
