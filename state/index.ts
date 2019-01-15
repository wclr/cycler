import { FantasyObservable, FantasySubscription } from '@cycle/run'
import { adapt } from '@cycle/run/lib/adapt'
import dropRepeats from 'xstream/extra/dropRepeats'
import xs, { Stream, MemoryStream } from 'xstream'
import { DebugableStateStream } from './debug'

export type Reducer<T> = (state: T | undefined) => T

export interface Options<State> {
  initialValue?: State,
  /**
   * allows sequential sync updates to state
   */
  syncUpdate?: boolean
}

export type StateDriver<State> = (reducer$: Stream<Reducer<State>>) => MemoryStream<State>
export type MakeStateDriver<State> = (options?: Options<State>) => StateDriver<State>

export const makeStateDriver = <State>(options: Options<State> = {}) => {
  return (reducer$: Stream<Reducer<State>>) => {

    const state$ = xs.createWithMemory<State>() as DebugableStateStream<State>
    let stateVal = options.initialValue
    let prevStateVal: State | undefined = undefined
    let locked = false
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
      if (state$._onNewVal) {
        state$._onNewVal(stateVal, reducer)
      }
      if (!locked) {
        locked = !options.syncUpdate
        sendState(stateVal)
        // tslint:disable-next-line:no-unused-expression
        locked && Promise.resolve().then(() => {
          locked = false
          sendState(stateVal!)
        })
      }
    }
    reducer$.addListener({
      next: reduceState
    })

    state$.addListener({})
    return state$ as MemoryStream<State>
  }
}
