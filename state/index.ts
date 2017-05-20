import { FantasyObservable } from '@cycle/run'
import { adapt } from '@cycle/run/lib/adapt'
import dropRepeats from 'xstream/extra/dropRepeats'
import { Stream } from 'xstream'
import { path, assocPath, StatePath } from './utils'

export type Reducer<T> = (state: T) => T

export interface ZoomIn {
  <P extends string>(prop: P):
    <R>(state$: Stream<{[K in P]?: R}>) => Stream<R>
  <P extends number>(index: P):
    <R>(state$: Stream<R[]>) => Stream<R>
  <R>(path: (string | number)[]):
    (state$: Stream<any>) => Stream<R>
}

export interface ZoomOut {
  <P extends string>(prop: P):
    <R, T extends {[K in P]?: R}>(reducer$: Stream<Reducer<R>>) => Stream<Reducer<T>>
  <P extends number>(index: P):
    <R, T extends R[]>(reducer$: Stream<Reducer<R>>) => Stream<Reducer<T>>
  <T>(path: (string | number)[]):
    (reducer$: Stream<Reducer<any>>) => Stream<Reducer<T>>
}

const _zoomIn = <R>(idx: StatePath) =>
  <T>(state$: Stream<T>) => state$.map(state => path(idx, state))
    .compose(dropRepeats()) as Stream<R>

const _zoomOut = <R>(idx: StatePath) =>
  <T>(reducer$: Stream<Reducer<R>>) => reducer$
    .map(reducer =>
      (state: T) => assocPath(idx, reducer(path(idx, state)), state)
    ) as Stream<Reducer<T>> 

export const zoomIn = _zoomIn as ZoomIn
export const zoomOut = _zoomOut as ZoomOut

export const makeStateDriver = <State>(initialValue?: State) => {
  return (reducer$: Stream<Reducer<State>>) =>
    reducer$.fold<State>(
      (state, reducer: Reducer<State>) => reducer(state), initialValue!)
      .drop(initialValue === undefined ? 1 : 0).compose(dropRepeats())
}
