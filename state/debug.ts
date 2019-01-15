import { path, assocPath } from './utils'
import xs, { Stream, MemoryStream } from 'xstream'
import {
  StateDriver,
  Reducer,
  MakeStateDriver,
  Options,
  makeStateDriver
} from './index'

const debugStorageKey = 'cycler_state_debug'
const localStorage = typeof window === 'object' && window.localStorage
const { DiffPatcher } = require('jsondiffpatch/src/diffpatcher')
const { format } = require('jsondiffpatch/src/formatters/jsonpatch')
const patcher = new DiffPatcher()

export type DebugableStateStream<State> = MemoryStream<State> & {
  _setLastVal: (val: State) => void
  _onNewVal?: ((val: State, reducer: Reducer<State>) => void)
}

class StateDebugObject<State> {
  private maxLogCount: number
  private stateLog: { state: State; reducer: Reducer<State> }[]
  private state$: DebugableStateStream<State>
  // private debugSubscription: FantasySubscription
  public patcher = patcher
  private debugMode = false
  constructor(options: {
    maxLogCount?: number
    state$: DebugableStateStream<State>
  }) {
    this.maxLogCount =
      options.maxLogCount !== undefined ? options.maxLogCount : 50
    this.stateLog = []
    this.state$ = options.state$
    if (localStorage && localStorage.getItem(debugStorageKey)) {
      this.debugMode = true
    }
  }
  public push(state: State, reducer: Reducer<State>) {
    if (this.debugMode) {
      const last = this.stateLog[this.stateLog.length - 1]
      if (last) {
        const delta = patcher.diff(last.state, state)
        const formated = format(delta, last.state).filter(
          (d: any) => d.op !== 'unchanged'
        )
        console.log('State delta', formated)
      }
    }
    if (this.maxLogCount > 0) {
      this.stateLog.push({ state, reducer })
    }
    const exceed = this.stateLog.length - this.maxLogCount
    if (exceed > 0) {
      this.stateLog.splice(0, exceed)
    }
  }
  public get(statePath?: string | string[]) {
    const last = this.stateLog[this.stateLog.length - 1]
    return last && path(statePath || [], last.state)
  }
  public set(...args: any[]) {
    if (!args.length) return
    const newState =
      args.length === 1
        ? typeof args[0] === 'string'
          ? JSON.parse(args[0])
          : args[0]
        : assocPath(args[0], args[1], this.get())
    this.state$._setLastVal(newState)
  }
  public debug(val?: boolean) {
    this.debugMode = val === undefined ? !this.debugMode : val
    console.log('State debug mode is ' + (this.debugMode ? 'on' : 'off'))
  }
  public persistDebug(val: boolean) {
    if (localStorage) {
      if (val === false) {
        localStorage.removeItem(debugStorageKey)
      } else {
        localStorage.setItem(debugStorageKey, '1')
      }
    }
  }
  public undo(number = 1) {
    if (number >= this.stateLog.length) {
      console.log('More then state log length, use -1 to remove all')
    }
    if (number < 0) {
      number = this.stateLog.length + number
    }
    this.stateLog.splice(-number)
    const lastState = this.stateLog[this.stateLog.length - 1]
    this.state$.shamefullySendNext(lastState.state)
  }
}

export interface DebugStateOptions {
  debugObjectName?: string
  maxLogCount?: number
}

export const debugState = <State>(
  MakeStateDriver: MakeStateDriver<State>,
  options: DebugStateOptions = {}
): MakeStateDriver<State> => {
  return (driverOptions: Options<State>) => {
    return (reducer$: Stream<Reducer<State>>) => {
      const driver = makeStateDriver(driverOptions)
      const state$ = driver(reducer$) as DebugableStateStream<State>

      const debugObjectName = options.debugObjectName || 'state'
      const stateDebugObject = new StateDebugObject({
        maxLogCount: options.maxLogCount,
        state$
      })
      if (typeof window === 'object') {
        ;(window as any)[debugObjectName] = stateDebugObject
      }
      state$._onNewVal = (stateVal, reducer) =>
        stateDebugObject.push(stateVal, reducer)
      return state$ as MemoryStream<State>
    }
  }
}

export default debugState
