import { FantasyObservable } from '@cycle/run'
import { adapt } from '@cycle/run/lib/adapt'
import dropRepeats from 'xstream/extra/dropRepeats'
import xs, { Stream, MemoryStream } from 'xstream'
import { path, assocPath, StatePath } from './utils'

export type Reducer<T> = (state: T | undefined) => T

export interface ZoomIn {
  <P extends string>(prop: P):
    <S extends {[K in P]: {}}>(state$: Stream<S>) => Stream<S[P]>
  <R>(prop: string):
    <S>(state$: Stream<S>) => Stream<R>
  <P extends number>(index: P):
    <R>(state$: Stream<R[]>) => Stream<R>
  <R>(path: (string | number)[]):
    (state$: Stream<any>) => Stream<R>
}

export interface ZoomOut {
  <T extends {[K in P]?: R}, R = R, P extends string = P>(prop: P):
    (reducer$: Stream<Reducer<R>>) => Stream<Reducer<T>>
  // <P extends string>(prop: P):
  //   <R, T extends {[K in P]?: R}>(reducer$: Stream<Reducer<R>>) => Stream<Reducer<T>>
  <T extends R[], R, P extends number>(index: number):
    (reducer$: Stream<Reducer<R>>) => Stream<Reducer<T>>
  // <P extends number>(index: P):
  //   <R, T extends R[]>(reducer$: Stream<Reducer<R>>) => Stream<Reducer<T>>
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
  return (reducer$: Stream<Reducer<State>>) => {
    // return reducer$.fold<State>(
    //   (state, reducer: Reducer<State>) => reducer(state), initialValue!)
    //   .drop(initialValue === undefined ? 1 : 0).compose(dropRepeats())

    const state$ = xs.createWithMemory<State>()
    let stateVal= initialValue
    let prevStateVal: State | undefined = undefined
    let locked = false
    const sendState = (stateVal: State) => {
      if (stateVal !== prevStateVal) {
        prevStateVal = stateVal
        state$.shamefullySendNext(stateVal)
      }
    }
    const reduceState = (reducer: Reducer<State>) => {
      stateVal = reducer(stateVal!)
      if (!locked) {
        locked = true
        sendState(stateVal)
        Promise.resolve().then(() => {
          locked = false
          sendState(stateVal!)
        })
      }
    }
    reducer$.addListener({
      next: reduceState
    })

    state$.addListener({})
    return state$
  }
}
