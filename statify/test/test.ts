import { zoomIn, zoomOut, Reducer } from '..'
import xs, { Stream } from 'xstream'
import * as test from 'tape'

type State = {
  datetime: Date
}

const state = { datetime: new Date() }

test('string prop', () => {
  const state$: Stream<State> = xs.create<State>()
  state$.compose(zoomIn('datetime'))
    .map(x => x.getDate()) // x should be Date

  const reducer$ = xs.create<Reducer<Date>>()
  reducer$.compose(zoomOut('datetime'))
    .map(x => x(state)) // x should be Reducer<State>
})

test('path - manual typing', () => {
  const state$: Stream<State> = xs.create<State>()
  state$.compose(zoomIn<Date>(['datetime']))
    .map(x => x.getDate()) // x should be Date

  const reducer$ = xs.create<Reducer<Date>>()
  zoomOut<State>(['datetime'])(reducer$)
    .map(x => x(state)) // x should be Reducer<State>
})
