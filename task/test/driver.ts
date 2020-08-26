import xs, { Stream, MemoryStream } from 'xstream'
import { run } from '@cycle/run'
import { setAdapt } from '@cycle/run/lib/adapt'
import delay from 'xstream/extra/delay'
import concat from 'xstream/extra/concat'
import flattenConcurrently from 'xstream/extra/flattenConcurrently'
import dropUntil from 'xstream/extra/dropUntil'
import flattenSequentially from 'xstream/extra/flattenSequentially'
import {
  makeTaskDriver,
  TaskSource,
  TaskRequest,
  setRequestOps,
} from '../index'
import isolate from '@cycle/isolate'
import test from 'tape'
import {
  Request,
  RequestInput,
  Response,
  basicDriver,
  lazyDriver,
  isolationDiver,
  progressiveDriver,
  
} from './make-drivers'
import { ResponseStreamWithRequest } from '../interfaces'

test('Set xstream adapt', t => {
  setAdapt(x => x)
  t.end()
})


test('Responses stream is hot and not remembered', t => {
  const request = { name: 'John' }
  const response = 'async John'
  const source = basicDriver(
    xs
      .from([xs.of({ name: 'Jane' }), xs.of(request).compose(delay(50))])
      .compose(flattenConcurrently)
  )

  setTimeout(() => {
    source
      .select()
      .map(_ => _)
      .compose(flattenConcurrently)
      .addListener({
        next: x => {
          t.deepEqual(x, response, 'response correct')
          t.end()
        },
      })
  })
})

const skipRemembered = dropUntil<Stream<Response>>(
  xs.fromPromise(Promise.resolve())
)

test('Responses stream is hot and not remembered with @cycle/run', t => {
  const request = { name: 'John' }
  const response = 'async John'
  let countInFirstDriver = 0
  const Main = ({ source }: { source: TaskSource<Request, Response> }) => {
    setTimeout(() => {
      source
        .select()
        .compose(skipRemembered)
        .compose(flattenConcurrently)
        .addListener({
          next: x => {
            t.deepEqual(x, response, 'response correct')
            t.is(countInFirstDriver, 2, 'first subscriber gets two r$')
            t.end()
          },
        })
    })
    const res$$ = source.select()
    //res$$.map(x => )
    return {
      first: source.select(),
      source: xs
        .from([xs.of({ name: 'Jane' }), xs.of(request).compose(delay(50))])
        .compose(flattenConcurrently),
    }
  }

  run(Main, {
    source: basicDriver,
    first: (res$$: Stream<MemoryStream<Response>>) => {
      res$$.addListener({
        next: () => {
          countInFirstDriver++
        },
      })
    },
  })
})

test('Basic driver from promise', t => {
  const request = { name: 'John' }
  const response = 'async John'
  const source = basicDriver(xs.of(request).compose(delay(0)))

  source
    .select()
    .map(r$ => {
      t.deepEqual(
        (r$ as ResponseStreamWithRequest<Response, Request>).request,
        request,
        'response$.request is present and correct'
      )
      return r$
    })
    .compose(flattenConcurrently)
    .addListener({
      next: x => {
        t.deepEqual(x, response, 'response correct')
        t.end()
      },
    })
})

test('Basic driver - cancellation with abort (lazy requests)', t => {
  // lets make requests mutable for testing abortion
  // we probably don't need to change it back
  setRequestOps({
    addProperty: (request: any, name: any, value: any) => {
      request[name] = value
      return request
    },
  })
  const requests: Request[] = [
    { name: 'John', category: 'john', lazy: true, props: { aborted: false } },
    { name: 'Alex', type: 'alex', lazy: true, props: { aborted: false } },
  ]
  const response = 'async Alex'
  const request$ = xs.fromArray(requests).compose(delay(0))
  const source = basicDriver(request$)

  source
    .select()
    .flatten()
    .addListener({
      next: x => {
        t.ok(requests[0].props?.aborted, 'fist request was aborted')
        t.deepEqual(x, response, 'response is correct')
        t.end()
      },
    })
})

test('Basic driver - `filter` and `select` methods', t => {
  const requests: Request[] = [
    { name: 'John', category: 'john' },
    { name: 'Alex', type: 'alex' },
  ]
  const responses: Response[] = ['async John', 'async Alex']
  const source = basicDriver(xs.fromArray(requests).compose(delay(0)))

  source
    // this won't work
    .select<{ addToResponse: boolean }, { addToRequest: boolean }>('john')
    .map(r$ => {
      t.is(
        (r$ as any).request.addToRequest,
        undefined,
        'select additional request typing ok'
      )
      t.deepEqual(
        (r$ as any).request,
        requests[0],
        'response$.request is present and correct'
      )
      return r$
    })
    .compose(flattenConcurrently)
    .addListener({
      next: x => {
        t.is(x.addToResponse, undefined, 'select additional response typing ok')
        t.deepEqual(x, responses[0], 'response 1 is correct')
      },
    })

  source
    .filter<{ addToRequest: boolean }>(r => r.type === 'alex')
    .select()
    .map(r$ => {
      t.is(
        (r$ as any).request.addToRequest,
        undefined,
        'filter additional request typing ok'
      )
      t.deepEqual(
        (r$ as any).request,
        requests[1],
        'response$.request is present and correct'
      )
      return r$
    })
    .compose(flattenConcurrently)
    .addListener({
      next: x => {
        t.deepEqual(x, responses[1], 'response 2 is correct')
      },
    })

  source
    .select()
    .compose(flattenConcurrently)
    .fold((prev, x) => prev.concat(<any>x), [])
    .filter(x => x.length === 2)
    .addListener({
      next: x => t.end(),
    })
})

test('Lazy driver - should make request when subscribed to response$', t => {
  const request = { name: 'John' }
  const source = lazyDriver(xs.of(request).compose(delay(0)))
  let res1: any
  // first subsriber to response

  source
    .select()
    .compose(flattenConcurrently)
    .addListener({
      next: x => {
        res1 = x
      },
    })

  // second subsriber to response,
  // after some delay to ensure first response completed
  source
    .select()
    .compose(delay(100))
    .compose(flattenConcurrently)
    .addListener({
      next: res2 => {
        console.log(res1, res2)
        t.notEqual(res1, res2, 'response are different')
        t.end()
      },
    })
})

test('Basic driver isolation', t => {
  const request = 'John'
  const response = 'async John'

  const expected = { name: 'asyncJohn' }

  const dataflow = ({ source }: { source: TaskSource<Request, Response> }) => {
    source
      .select()
      .map(r$ => {
        t.same((r$ as any).request.name, 'John', 'request is correct')
        t.same(
          (r$ as any).request._namespace,
          ['scope0'],
          'request _namespace is correct'
        )
        return r$
      })
      .compose(flattenConcurrently)
      .addListener({
        next: x => {
          t.deepEqual(x, response, 'response')
          t.end()
        },
      })
    return {
      source: xs.of(request),
    }
  }
  const request$ = xs.create<RequestInput>()
  const source = isolationDiver(request$)
  const isolated = isolate(dataflow, 'scope0')
  isolated({ source }).source.addListener({
    // @ts-ignore
    next: (request: Request) => {
      request$.shamefullySendNext(request)
    },
  })
  request$.shamefullySendNext({ name: 'Alex', _namespace: ['scope1'] })
})

test('Basic driver from promise failure', t => {
  const request = { name: '' }
  const source = basicDriver(xs.of(request).compose(delay(0)))
  const expected = { name: 'asyncJohn' }

  source
    .select()
    .map(r$ => r$.replaceError(() => xs.of('error')))
    .compose(flattenConcurrently)
    .addListener({
      next: x => {
        t.deepEqual(x, 'error', 'error sent')
        t.end()
      },
    })
})

test('Progressive response driver', t => {
  const request = { name: 'John' }
  const response = 'async John'
  const source = progressiveDriver(xs.of(request).compose(delay(0)))
  let values: any[] = []
  source
    .select()
    .map(r$ => {
      t.deepEqual(
        (r$ as any).request,
        request,
        'response$.request is present and correct'
      )
      return r$
    })
    .compose(flattenConcurrently)
    .addListener({
      next: x => {
        values.push(x)
        if (values.length === 3) {
          t.deepEqual(values, [1, 2, 3], 'progressive response is ok')
          t.end()
        }
      },
    })
})

test('xstream run (isolation, cancellation)', t => {
  const requests0 = [
    { name: 'John', lazy: true, props: { aborted: false } },
    { name: 'Alex', lazy: true, props: { aborted: false } },
  ]
  const requests1 = [{ name: 'Jane', props: { aborted: false } }]
  const Dataflow = (
    { source, request$ }: { source: any; request$: any },
    num: number
  ) => {
    return {
      result: source
        .select()
        .flatten()
        .map((data: any) => ({
          num,
          data,
        })),
      source: request$,
    }
  }

  const Main = ({ source }: { source: any }) => {
    const dataflow0 = isolate(Dataflow, 'scope0')(
      {
        request$: xs.fromArray(requests0).compose(delay(0)),
        source,
      },
      '0'
    )
    const dataflow1 = isolate(Dataflow, 'scope1')(
      {
        request$: xs.fromArray(requests1),
        source,
      },
      '1'
    )

    return {
      source: xs.merge(dataflow0.source, dataflow1.source),
      result: xs.merge(dataflow0.result, dataflow1.result),
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
              t.ok(requests0[0].props.aborted, 'first lazy request aborted')
              t.notOk(requests0[1].props.aborted, 'second not aborted')
              t.notOk(requests1[0].props.aborted, 'third not aborted')
              dispose()
              t.ok(
                (isolationDiver as any).__disposeCalled,
                'source disposed method called when when cycle disposed'
              )
              t.end()
            }, 50)
          }
        },
        error: () => {},
        complete: () => {},
      })
      return {}
    },
    source: isolationDiver as any,
  })
})

test('Sequential lazy requests run', t => {
  type Sources = { driver: TaskSource<{ num: number }, number> }

  const actions: string[] = []
  const driver = makeTaskDriver<{ num: number }, number, any>({
    getResponse: (request, cb) => {
      setTimeout(() => {
        actions.push('request' + request.num)
      })       
      setTimeout(() => {
        cb(null, request.num)        
      }, (3 - request.num)*50)
    },
  })

  run(
    (sources: Sources) => {
      const request$ = xs.from([1, 2]).map(num => ({ num, lazy: true }))
      const result$ = sources.driver
        .select<number>()
        .compose(flattenSequentially)
      return {
        driver: request$,
        result: result$,
      }
    },
    {
      driver,
      result: (result$: Stream<number>) =>
        result$.addListener({
          next: (res: number) => {
            actions.push('response' + res)
            if (res === 2) {
              t.deepEqual(actions, [
                'request1',
                'response1',
                'request2',
                'response2',
              ])
              t.end()
            }
          },
        }),
    }
  )
})

test('Sequential non-lazy requests run', t => {
  type Sources = { driver: TaskSource<{ num: number }, number> }

  const actions: string[] = []
  const driver = makeTaskDriver<{ num: number }, number, any>({
    getResponse: (request, cb) => {
      actions.push('request' + request.num)
      setTimeout(() => {
        cb(null, request.num)
      }, 50)
    },
  })

  run(
    (sources: Sources) => {
      const request$ = xs
        .from([1, 2])
        .map(num =>
          concat(
            xs.of({ num } as any),
            sources.driver
              .filter(x => x.num === num)
              .select()
              .take(1)
              .flatten()
              .mapTo(null)
          )
        )
        .compose(flattenSequentially)
        .filter(x => !!x)
        .map(_ => _!)

      return {
        driver: request$,
        result: sources.driver.select<number>().compose(flattenConcurrently),
      }
    },
    {
      driver,
      result: (result$: Stream<number>) =>
        result$.addListener({
          next: (res: number) => {
            actions.push('response' + res)
            if (res === 2) {
              t.deepEqual(actions, [
                'request1',
                'response1',
                'request2',
                'response2',
              ])
              t.end()
            }
          },
        }),
    }
  )
})

test('Sync callback driver', t => {
  type Sources = { driver: TaskSource<{ num: number }, number> }
  let requestsInDriver = 0
  const driver = makeTaskDriver<{ num: number }, number, any>({
    getResponse: (request, cb) => {
      requestsInDriver++
      cb(null, request.num)
    },
  })

  run(
    (sources: Sources) => {
      const request$ = xs.of({ num: 1 })

      return {
        result: sources.driver.select<number>().flatten(),
        driver: request$,
      }
    },
    {
      driver,
      result: (result$: Stream<number>) =>
        result$.addListener({
          next: (res: number) => {
            //console.log('res', res)
            t.is(requestsInDriver, 1)
            t.end()
          },
        }),
    }
  )
})

