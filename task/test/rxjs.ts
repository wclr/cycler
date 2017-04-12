import xs, { Stream } from 'xstream'
import { Observable as O, Subject, VirtualTimeScheduler } from 'rxjs'
import { run } from '@cycle/rxjs-run'
import { setAdapt } from '@cycle/run/lib/adapt'

import isolate from '@cycle/isolate'
import * as test from 'tape'
import { basicDriver } from './make-drivers'

test('Set most adapt', (t) => {
  setAdapt(O.from)
  t.end()
})

test('Responses stream is hot and not remembered (TestScheduler)', (t) => {
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
    O.from(source.select())
      .mergeAll()
      .subscribe({
        next: (x) => {
          t.deepEqual(x, response, 'response correct')
          t.end()
        },
        error: () => { },
        complete: () => { },
      })
  }).subscribe()
  Promise.resolve().then(() => scheduler.flush())
})