import xs from 'xstream'
import xsCycle from '@cycle/xstream-run'
import delay from 'xstream/extra/delay'
import * as most from 'most'
import mostCycle from '@cycle/most-run'
import { TaskSource, TaskRequest, GetResponse } from '../index'
import { makeTaskDriver, TaskSource as GenericRxTaskSource } from '../rx'
import { Observable as O, Subject, TestScheduler } from 'rx'
import isolate from '@cycle/isolate'
import { success, failure, pair } from '../rx'
import * as test from 'tape'

type RxTaskSource = GenericRxTaskSource<any, any>

type Request = {
  name: string
  type?: string
  aborted?: boolean
  _namespace?: string[]
} & TaskRequest
type Response = string
type RequestInput = Request | string

const getResponse: GetResponse<Request, Response, any> =
  (request, _, onDispose) => {
    let completed = false
    onDispose(() => completed ? '' : request.aborted = true)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        request.name
          ? resolve('async ' + request.name)
          : reject('async error')
        completed = true
      }, 10)
    })
  }

const basicDriver = makeTaskDriver<Request, Response, any>(getResponse)
const isolationDiver = makeTaskDriver<RequestInput, Request, Response, any>({
  normalizeRequest: (r) => typeof r === 'string' ? { name: r } : r,
  getResponse
})
const lazyDriver = makeTaskDriver<Request, Response, any>({
  getResponse: (request, callback) => {
    setTimeout(() =>
      callback(null, 'async ' + request.name + Math.random())
    )
  },
  lazy: true
})

var progressiveDriver = makeTaskDriver<any, any, any>({
  getProgressiveResponse: (request, observer) => {
    setTimeout(() => {
      observer.next(1)
      setTimeout(() => {
        observer.next(2)
      })
      setTimeout(() => {
        observer.next(3)
        observer.complete()
      })
    })
  }
})

test('Responses stream is hot and not remembered', (t) => {
  const request = { name: 'John' }
  const response = 'async John'
  const source = basicDriver(
    O.from([
      O.of({ name: 'Jane' }),
      O.of(request)
        .delay(50)
    ]).mergeAll()
  )
  setTimeout(() => {
    source.select()
      .mergeAll()
      .subscribe((x) => {
        t.deepEqual(x, response, 'response correct')
        t.end()
      })
  })
})

test('Responses stream is hot and not remembered (TestScheduler)', (t) => {
  const scheduler = new TestScheduler()
  const request = { name: 'John' }
  const response = 'async John'
  const source = basicDriver(
    O.from([
      O.of({ name: 'Jane' }),
      O.of(request)
        .delay(50, scheduler)
    ]).mergeAll()
  )
  O.timer(0, scheduler).map(() => {
    console.log('here')
    source.select()
      .mergeAll()
      .subscribe((x) => {
        t.deepEqual(x, response, 'response correct')
        t.end()
      })
  }).subscribe()
  Promise.resolve().then(() => scheduler.start())
})

// test.only('Two drivers - ', (t) => {
//   const request = { name: 'John' }
//   const response = 'async John'
//   const source1 = basicDriver(
//     O.from([
//       O.of({ name: 'Jane' }),
//     ]).mergeAll()
//   )
//   const source2 = basicDriver(
//     source1.select().mergeAll().map(_ => request)
//   )
//   //setTimeout(() => {
//     source2.select()
//       .mergeAll()
//       .subscribe((x) => {
//         t.deepEqual(x, response, 'response correct')
//         t.end()
//       })
//   //})
// })

test('Basic driver from promise', (t) => {
  const request = { name: 'John' }
  const response = 'async John'
  const source = basicDriver(O.of(request).delay(0))

  source.select()
    .do(r$ => t.deepEqual(r$.request, request, 'response$.request is present and correct'))
    .mergeAll()
    .subscribe(x => {
      t.deepEqual(x, response, 'response correct')
      t.end()
    })
})

test('Basic driver - cancellation with abort (lazy requests)', (t) => {
  const requests = [
    { name: 'John', category: 'john', lazy: true, aborted: false },
    { name: 'Alex', type: 'alex', lazy: true, aborted: false }
  ]
  const response = 'async Alex'
  const source = basicDriver(O.fromArray(requests).delay(0))

  source.select()
    .switch()
    .share()
    .subscribe(x => {
      t.ok(requests[0].aborted, 'fist request was aborted')
      t.deepEqual(x, response, 'response is correct')
      t.end()
    })
})

test('Basic driver - select method', (t) => {
  const requests = [
    { name: 'John', category: 'john' },
    { name: 'Alex', type: 'alex' }
  ]
  const responses = ['async John', 'async Alex']
  const source = basicDriver(O.fromArray(requests).delay(0))

  source.select<{ addToResponse: boolean }, { addToRequest: boolean }>('john')
    .do(r$ => {
      t.is(r$.request.addToRequest, undefined, 'addToRequest prop typing ok')
      t.deepEqual(r$.request, requests[0], 'response$.request is present and correct')
    })
    .mergeAll()
    .subscribe(x => {
      t.is(x.addToResponse, undefined, 'addToResponse prop typing ok')
      t.deepEqual(x, responses[0], 'response 1 is correct')
    })

  source.filter(r => r.type === 'alex').select()
    .do(r$ => t.deepEqual(r$.request, requests[1], 'response$.request is present and correct'))
    .mergeAll()
    .subscribe(x => {
      t.deepEqual(x, responses[1], 'response 2 is correct')
    })

  source.select().mergeAll()
    .bufferWithCount(2)
    .filter(x => x.length == 2)
    .subscribe(x => t.end())
})

test('Lazy driver (async callback)', (t) => {
  const request = { name: 'John' }
  //const response = 'async John'
  const source = lazyDriver(O.of(request).delay(0))
  let res1: any
  source.select()
    .mergeAll()
    .subscribe(x => {
      res1 = x
    })

  source.select()
    .mergeAll()
    .delay(100)
    .subscribe(res2 => {
      console.log('here', res1, res2)
      t.notEqual(res1, res2, 'response are different')
      t.end()
    })
})

test('Basic driver - source filter method', (t) => {
  const requests: Request[] = [
    { name: 'John', category: 'john' },
    { name: 'Alex', type: 'alex' }
  ]
  const responses = ['async John', 'async Alex']
  const source = basicDriver(O.fromArray(requests).delay(0))

  source
    .filter<{ addToRequest: boolean }>(request => request.category === 'john')
    .select()
    .do(r$ => {
      t.is(r$.request.addToRequest, undefined, 'addToRequest prop typing ok')
      t.deepEqual(r$.request, requests[0], 'response$.request is present and correct')
    })
    .mergeAll()
    .subscribe(x => {
      t.deepEqual(x, responses[0], 'response')
    })

  source.select()
    .mergeAll()
    .bufferWithCount(2)
    .filter(x => x.length === 2)
    .subscribe(x => {
      t.end()
    })
})

test('Basic driver isolation', (t) => {
  const request = 'John'
  const response = 'async John'

  const expected = { name: 'asyncJohn' }

  const dataflow = ({source}: { source: RxTaskSource }) => {
    source.select()
      .do(r$ => {
        t.same(r$.request.name, 'John', 'request is correct')
        t.same(r$.request._namespace, ['scope0'], 'request _namespace is correct')
      })
      .mergeAll()
      .subscribe(x => {
        t.deepEqual(x, response, 'response')
        t.end()
      })
    return {
      source: O.of(request)
    }
  }
  const request$ = new Subject<RequestInput>()
  const source = isolationDiver(request$.asObservable())
  isolate(dataflow, 'scope0')({ source }).source.subscribe((request) => {
    request$.onNext(request)
  })
  request$.onNext({ name: 'Alex', _namespace: ['scope1'] })
})

test('Basic driver from promise failure', (t) => {
  const request = { name: '' }
  const source = basicDriver(O.of(request).delay(0))
  const expected = { name: 'asyncJohn' }

  source.select()
    .map(r$ => r$.catch(O.of('error')))
    .mergeAll()
    .subscribe(x => {
      t.deepEqual(x, 'error', 'error sent')
      t.end()
    })
})

test('Progressive response driver', (t) => {
  const request = { name: 'John' }
  const response = 'async John'
  const source = progressiveDriver(O.of(request).delay(0))
  let values: any[] = []
  source.select()
    .do(r$ => t.deepEqual(r$.request, request, 'response$.request is present and correct'))
    .mergeAll()
    .subscribe((x: never) => {
      values.push(x)
      if (values.length === 3) {
        t.deepEqual(values, [1, 2, 3], 'progressive response is ok')
        t.end()
      }
    })
})

test('xstream run (isolation, cancellation)', (t) => {
  const requests0 = [{ name: 'John', lazy: true, aborted: false }, { name: 'Alex', lazy: true, aborted: false }]
  const requests1 = [{ name: 'Jane', aborted: false }]
  const Dataflow = ({source, request$}: { source: any, request$: any }, num: number) => {
    return {
      result: source.select()
        .flatten().map((data: any) => ({
          num, data
        })).debug('source$'),
      source: request$
    }
  }

  const Main = ({source}: { source: any }) => {
    const dataflow0 = isolate(Dataflow, 'scope0')({
      request$: xs.fromArray(requests0),
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
  xsCycle.run(Main, {
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

test('most run (isolation, cancellation)', (t) => {
  const requests0 = [{ name: 'John', lazy: true, aborted: false }, { name: 'Alex', lazy: true, aborted: false }]
  const requests1 = [{ name: 'Jane', aborted: false }]

  const Dataflow = ({source, request$}: { source: any, request$: any }, num: number) => {
    return {
      result: source.select()
        .switch().map((data: any) => ({
          num, data
        })),
      source: request$
    }
  }

  const Main = ({source}: { source: any }) => {
    const dataflow0 = isolate(Dataflow, 'scope0')({
      request$: most.from(requests0),
      source
    }, '0')
    const dataflow1 = isolate(Dataflow, 'scope1')({
      request$: most.from(requests1),
      source
    }, '1')
    return {
      result: most.merge(dataflow0.result, dataflow1.result),
      source: most.merge(dataflow0.source, dataflow1.source)
    }
  }
  let count = 0
  mostCycle.run(Main, {
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
