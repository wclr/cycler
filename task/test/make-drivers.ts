import xs, { Stream } from 'xstream'
import {
  makeTaskDriver, makeTaskSource,
  TaskSource, InputTaskSource, TaskRequest, GetResponse
} from '../index'

export type Request = {
  name: string
  type?: string
  aborted?: boolean
  _namespace?: string[]
} & TaskRequest

export type Response = string
export type RequestInput = Request | string

export const getResponse: GetResponse<Request, Response, any> =
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

export const basicDriver = makeTaskDriver<Request, Response, any>(getResponse)
export const isolationDiver = makeTaskDriver<RequestInput, Request, Response, any>({
  normalizeRequest: (r) => typeof r === 'string' ? { name: r } : r,
  getResponse,
  dispose: () => {
    (isolationDiver as any).__disposeCalled = true
  }
})

export const lazyDriver = makeTaskDriver<Request, Response, any>({
  getResponse: (request, callback) => {
    setTimeout(() =>
      callback(null, 'async ' + request.name + Math.random())
    )
  },
  lazy: true
})

export const progressiveDriver = makeTaskDriver<any, any, any>({
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

export interface CustomSource extends TaskSource<Request, Response> {
  upperCase(category?: string): Stream<string>
}

export const customSourceDiver =
  makeTaskDriver<CustomSource, Request, Response, any>({
    getResponse: (request, cb, onDispose, response$: any) => {
      response$.upperCase$ = xs.of(request.name.toUpperCase())
      setTimeout(() => {
        cb(null, request.name)
      }, 50)
    },
    makeSource: (response$$, options) => {
      const source = makeTaskSource(response$$, options)
      return Object.assign(
        makeTaskSource(response$$, options), {
          upperCase: (category?: string) => source
            .select().map<Stream<string>>((r$: any) => r$.upperCase$)
            .flatten()
        }
      )      
    }
  })