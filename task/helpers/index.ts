import { ResponseStream, TaskSource, Category } from '../interfaces'
import xs, { Stream, MemoryStream } from 'xstream'
import { attachRequest } from '../attachRequest'

export function success<Response, Request>(
  r$: ResponseStream<Response, Request>
): ResponseStream<Response, Request> {
  return attachRequest(r$.replaceError(xs.empty), (r$ as any).request)
}

export function failure<Error, Request>(
  r$: ResponseStream<any, Request>
): ResponseStream<Error, Request> {
  return attachRequest(
    <MemoryStream<Error>>r$.map(xs.empty).flatten().replaceError(xs.of),
    (r$ as any).request
  )
}

export function pair<Request, T>(
  r$: ResponseStream<T, Request>
): Stream<[Request, T]> {
  return r$.map<[Request, T]>((response) => [(r$ as any).request, response])
}

type Arguments<F extends (...x: any[]) => any> = F extends (
  ...x: infer A
) => any
  ? A
  : never

export const makeReqResTaskHelper = <
  Responses extends { [K in string]: any },
  R extends { [m in M]: (...args: any[]) => Promise<any> },
  M extends string = 'task'
>(
  categories?: { [C in keyof Responses]: Category }
) => {
  return <K extends keyof Responses>(key: K) => {
    return {
      response: <S extends TaskSource<R, unknown>>(s: S) =>
        s.select<Responses[K]>(key as Category).flatten(),
      success: <S extends TaskSource<R, Category>>(s: S) =>
        s.select<Responses[K]>(key as string).map(success),
      failure: <S extends TaskSource<R, unknown>>(s: S) =>
        s.select<Responses[K]>(key as string).map(failure),
      request: (task: (...arg: Arguments<R[M]>) => Promise<Responses[K]>) => {
        return {
          category: categories ? categories[key] : key,
          task,
        }
      },
    }
  }
}

// export * from './common'
