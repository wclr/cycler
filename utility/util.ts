import xs, { MemoryStream, Stream } from 'xstream'
import concat from 'xstream/extra/concat'

export const isMemoryStream = (s: Stream<any>) => {
  return typeof (s as any)._has === 'boolean'
}

export const isStream = (s: any) => {
  return typeof s._add === 'function'
}

export const makeEndlessStream = <T>(
  s: T | Stream<T> | MemoryStream<T>
): MemoryStream<T> => {
  const endless = concat(
    isStream(s) ? (s as Stream<T>) : xs.of(s as T),
    xs.never() as Stream<T>
  ).remember()
  return endless
}
