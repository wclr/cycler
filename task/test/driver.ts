import xs, { Stream } from 'xstream'
import { run } from '@cycle/run'
import { setAdapt } from '@cycle/run/lib/adapt'
import delay from 'xstream/extra/delay'
import concat from 'xstream/extra/concat'
import flattenConcurrently from 'xstream/extra/flattenConcurrently'
import flattenSequentially from 'xstream/extra/flattenSequentially'
import { makeTaskDriver, TaskSource, TaskRequest, setRequestOps } from '../index'
import { requestOps } from '../requestOps'
import isolate from '@cycle/isolate'
import { success, failure, pair } from '../helpers'
import * as test from 'tape'
import {
  Request, RequestInput, Response,
  basicDriver,
  lazyDriver,
  isolationDiver,
  progressiveDriver,
  customSourceDiver
} from './make-drivers'

test('Set xstream adapt', (t) => {
  setAdapt(x => x)
  t.end()
})

test('Responses stream is hot and not remembered', (t) => {
  const request = { name: 'John' }
  const response = 'async John'
  const source = basicDriver(
    xs.from([
      xs.of({ name: 'Jane' }),
      xs.of(request)
        .compose(delay(50))
    ]).compose(flattenConcurrently)
  )
  setTimeout(() => {
    source.select()
      .compose(flattenConcurrently)
      .addListener({
        next: (x) => {
          t.deepEqual(x, response, 'response correct')
          t.end()
        }
      })
  })
})

test('Basic driver from promise', (t) => {
  const request = { name: 'John' }
  const response = 'async John'
  const source = basicDriver(xs.of(request).compose(delay(0)))

  source.select()
    .map(r$ => {
      t.deepEqual(r$.request, request, 'response$.request is present and correct')
      return r$
    })
    .compose(flattenConcurrently)
    .addListener({
      next: (x) => {
        t.deepEqual(x, response, 'response correct')
        t.end()
      }
    })
})

test('Basic driver - cancellation with abort (lazy requests)', (t) => {
  // lets make requests mutable for testing abortion
  // we probably don't need to change it back
  setRequestOps({
    addProperty: (request: any, name: any, value: any) => {
      request[name] = value
      return request
    }
  })
  const requests = [
    { name: 'John', category: 'john', lazy: true, aborted: false },
    { name: 'Alex', type: 'alex', lazy: true, aborted: false }
  ]
  const response = 'async Alex'
  const source = basicDriver(xs.fromArray(requests).compose(delay(0)))

  source.select()
    .flatten()
    .addListener({
      next: x => {
        t.ok(requests[0].aborted, 'fist request was aborted')
        t.deepEqual(x, response, 'response is correct')
        t.end()
      }
    })
})

test('Basic driver - `filter` and `select` methods', (t) => {
  const requests = [
    { name: 'John', category: 'john' },
    { name: 'Alex', type: 'alex' }
  ]
  const responses = ['async John', 'async Alex']
  const source = basicDriver(xs.fromArray(requests).compose(delay(0)))

  source.select<{ addToResponse: boolean }, { addToRequest: boolean }>('john')
    .map(r$ => {
      t.is(r$.request.addToRequest, undefined, 'select additional request typing ok')
      t.deepEqual(r$.request, requests[0], 'response$.request is present and correct')
      return r$
    })
    .compose(flattenConcurrently)
    .addListener({
      next: x => {
        t.is(x.addToResponse, undefined, 'select additional response typing ok')
        t.deepEqual(x, responses[0], 'response 1 is correct')
      }
    })

  source.filter<{ addToRequest: boolean }>(r => r.type === 'alex').select()
    .map(r$ => {
      t.is(r$.request.addToRequest, undefined, 'filter additional request typing ok')
      t.deepEqual(r$.request, requests[1], 'response$.request is present and correct')
      return r$
    })
    .compose(flattenConcurrently)
    .addListener({
      next: x => {
        t.deepEqual(x, responses[1], 'response 2 is correct')
      }
    })

  source.select().compose(flattenConcurrently)
    .fold((prev, x) => prev.concat(<any>x), [])
    .filter(x => x.length === 2)
    .addListener({
      next: x => t.end()
    })
})

test('Lazy driver - should make request when subscribed to response$', (t) => {
  const request = { name: 'John' }
  const source = lazyDriver(xs.of(request).compose(delay(0)))
  let res1: any
  // first subsriber to response
  source.select()
    .compose(flattenConcurrently)
    .addListener({
      next: x => {
        res1 = x
      }
    })

  // second subsriber to response, 
  // after some delay to ensure first response completed
  setTimeout(() => {
    source.select()
      .compose(flattenConcurrently)
      .compose(delay(100))
      .addListener({
        next: res2 => {
          console.log(res1, res2)
          t.notEqual(res1, res2, 'response are different')
          t.end()
        }
      })
  }, 50)
})


test('Basic driver isolation', (t) => {
  const request = 'John'
  const response = 'async John'

  const expected = { name: 'asyncJohn' }

  const dataflow = ({ source }: { source: TaskSource<Request, Response> }) => {
    source.select()
      .map(r$ => {
        t.same(r$.request.name, 'John', 'request is correct')
        t.same(r$.request._namespace, ['scope0'], 'request _namespace is correct')
        return r$
      })
      .compose(flattenConcurrently)
      .addListener({
        next: x => {
          t.deepEqual(x, response, 'response')
          t.end()
        }
      })
    return {
      source: xs.of(request)
    }
  }
  const request$ = xs.create<RequestInput>()
  const source = isolationDiver(request$)
  isolate(dataflow, 'scope0')({ source })
    .source.addListener({
      next: (request: Request) => {
        request$.shamefullySendNext(request)
      }
    })
  request$.shamefullySendNext({ name: 'Alex', _namespace: ['scope1'] })
})

test('Basic driver from promise failure', (t) => {
  const request = { name: '' }
  const source = basicDriver(xs.of(request).compose(delay(0)))
  const expected = { name: 'asyncJohn' }

  source.select()
    .map(r$ => r$.replaceError(() => xs.of('error')))
    .compose(flattenConcurrently)
    .addListener({
      next: x => {
        t.deepEqual(x, 'error', 'error sent')
        t.end()
      }
    })
})

test('Progressive response driver', (t) => {
  const request = { name: 'John' }
  const response = 'async John'
  const source = progressiveDriver(xs.of(request).compose(delay(0)))
  let values: any[] = []
  source.select()
    .map(r$ => {
      t.deepEqual(r$.request, request, 'response$.request is present and correct')
      return r$
    })
    .compose(flattenConcurrently)
    .addListener({
      next: (x: never) => {
        values.push(x)
        if (values.length === 3) {
          t.deepEqual(values, [1, 2, 3], 'progressive response is ok')
          t.end()
        }
      }
    })
})

test('xstream run (isolation, cancellation)', (t) => {
  const requests0 = [{ name: 'John', lazy: true, aborted: false }, { name: 'Alex', lazy: true, aborted: false }]
  const requests1 = [{ name: 'Jane', aborted: false }]
  const Dataflow = ({ source, request$ }: { source: any, request$: any }, num: number) => {
    return {
      result: source.select()
        .flatten().map((data: any) => ({
          num, data
        })).debug('source$'),
      source: request$
    }
  }

  const Main = ({ source }: { source: any }) => {
    const dataflow0 = isolate(Dataflow, 'scope0')({
      request$: xs.fromArray(requests0).compose(delay(0)),
      source
    }, '0')
    const dataflow1 = isolate(Dataflow, 'scope1')({
      request$: xs.fromArray(requests1),
      source
    }, '1')

    return {
      source: xs.merge(dataflow0.source, dataflow1.source),
      result: xs.merge(dataflow0.result, dataflow1.result)
    }
  }
  let count = 0
  const dispose = run(Main, {
    result: (result$: any) => {
      result$.addListener({
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
              dispose()
              t.ok((isolationDiver as any).__disposeCalled,
                'source disposed method called when when cycle disposed')
              t.end()
            }, 50)
          }
        },
        error: () => { },
        complete: () => { }
      })
      return {}
    },
    source: isolationDiver
  })
})

test('Sequential lazy requests run', (t) => {
  const actions: string[] = []
  const driver = makeTaskDriver<{ num: number }, number, any>({
    getResponse: ((request, cb) => {
      actions.push('request' + request.num)
      setTimeout(() => {
        cb(null, request.num)
      }, 50)
    })
  })

  run((sources: { driver: TaskSource<{ num: number }, number> }) => {
    const request$ = xs.from([1, 2])
      .map(num => ({ num, lazy: true }))
    return {
      driver: request$,
      result: sources.driver.select<number>()
        .compose(flattenSequentially)
    }
  }, {
      driver,
      result: (result$) => result$.addListener({
        next: (res: number) => {
          actions.push('response' + res)
          if (res === 2) {
            t.deepEqual(actions, [
              'request1', 'response1',
              'request2', 'response2'
            ])
            t.end()
          }
        }
      })
    })
})

test('Sequential non-lazy requests run', (t) => {
  const actions: string[] = []
  const driver = makeTaskDriver<{ num: number }, number, any>({
    getResponse: ((request, cb) => {
      actions.push('request' + request.num)
      setTimeout(() => {
        cb(null, request.num)
      }, 50)
    })
  })

  run((sources: { driver: TaskSource<{ num: number }, number> }) => {
    const request$ = xs.from([1, 2])
      .map(num =>
        concat(xs.of({ num }), sources.driver
          .filter(x => x.num === num)
          .select().take(1).flatten()
          .mapTo(null)
        )
      ).compose(flattenSequentially)
      .filter(x => !!x)

    return {
      driver: request$,
      result: sources.driver.select<number>().compose(flattenConcurrently)
    }
  }, {
      driver,
      result: (result$) => result$.addListener({
        next: (res: number) => {
          actions.push('response' + res)
          if (res === 2) {
            t.deepEqual(actions, [
              'request1', 'response1',
              'request2', 'response2'
            ])
            t.end()
          }
        }
      })
    })
})

test('Sync callback driver', (t) => {
  let requestsInDriver = 0
  const driver = makeTaskDriver<{ num: number }, number, any>({
    getResponse: ((request, cb) => {
      requestsInDriver++
      cb(null, request.num)
    })
  })
  
  run((sources: { driver: TaskSource<{ num: number }, number> }) => {
    const request$ = xs.of({ num: 1 })

    return {
      result: sources.driver.select<number>()
        .flatten(),
      driver: request$,
    }
  }, {
      driver,
      result: (result$) => result$.addListener({
        next: (res: number) => {
          //console.log('res', res)
          t.is(requestsInDriver, 1)
          t.end()
        }
      })
    })
})

test('Driver with custom source', (t) => {
  const request = { name: 'John' }
  
  const source = customSourceDiver(
    xs.of(request).compose(delay(50))    
  )
  setTimeout(() => {
    source.upperCase()
      .addListener({
        next: (x) => {
          t.deepEqual(x, request.name.toUpperCase(), 'response correct')
          t.end()
        }
      })
  })
})