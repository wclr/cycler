import xs, { Stream, MemoryStream } from 'xstream'
import { DebuggableStateStream } from './debug'

export type Reducer<T> = (state: T) => T
export type StateSource<T> = MemoryStream<T>

export interface Options<State> {
  initialValue?: State
  /**
   * Allows custom schedule fo state updates
   * or sequential sync updates (if set to `false`)
   * by default uses Promise.resolve based schedule
   */
  scheduleUpdate?: ((update: () => void) => void) | boolean
}

export type StateDriver<State> = (
  reducer$: Stream<Reducer<State>>
) => MemoryStream<State>
export type MakeStateDriver<State> = (
  options?: Options<State>
) => StateDriver<State>

export const makeStateDriver = <State>(options: Options<State> = {}) => {
  return (reducer$: Stream<Reducer<State>>) => {
    const state$ = xs.createWithMemory<State>() as DebuggableStateStream<State>
    let stateVal = options.initialValue
    let prevStateVal: State | undefined = undefined
    let locked = false

    const scheduleUpdate =
      options.scheduleUpdate == true
        ? (update: any) => {
            Promise.resolve().then(update)
          }
        : options.scheduleUpdate

    const sendState = (stateVal: State) => {
      if (stateVal !== prevStateVal) {
        prevStateVal = stateVal
        state$.shamefullySendNext(stateVal)
      }
    }
    state$._setLastVal = (val: State) => {
      stateVal = val
      state$.shamefullySendNext(val)
    }
    const reduceState = (reducer: Reducer<State>) => {
      stateVal = reducer(stateVal!)

      if (scheduleUpdate) {
        if (locked) return
        locked = true
        scheduleUpdate(() => {
          locked = false
          sendState(stateVal!)
        })
      } else {
        sendState(stateVal)
      }

      if (state$._onNewVal) {
        state$._onNewVal(stateVal, reducer)
      }
    }
    reducer$.addListener({
      next: reduceState,
    })

    state$.addListener({})
    return state$ as MemoryStream<State>
  }
}
