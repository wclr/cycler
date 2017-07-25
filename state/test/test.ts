import { zoomIn, zoomOut, Reducer } from '..'
import xs, { Stream } from 'xstream'
import * as test from 'tape'

type State = {
  name: string
  age?: number
}

const state: State = { name: 'Jesus', age: 33 }

test('string prop', () => {
  const state$: Stream<State> = xs.create<State>()
  state$.compose(zoomIn('name'))
    .map(x => x.anchor) // x should be string

  const reducer$ = xs.create<Reducer<Date>>()
  reducer$.compose(zoomOut('name'))
    .map(x => x(state)) // x should be Reducer<State>
})

test('optional string prop', () => {
  const state$: Stream<State> = xs.create<State>()
  state$.compose(zoomIn<number>('age'))
    .map(x => x.toExponential) // x should be number | undefined

  const reducer$ = xs.create<Reducer<number>>()
  reducer$.compose(zoomOut<State, number, 'age'>('age'))
    .map(x => x(state)) // x should be Reducer<State>
})


test('path - manual typing', () => {
  const state$: Stream<State> = xs.create<State>()
  state$.compose(zoomIn<string>(['name']))
    .map(x => x) // x should be Date

  const reducer$ = xs.create<Reducer<Date>>()
  zoomOut<State>(['name'])(reducer$)
    .map(x => x(state)) // x should be Reducer<State>
})
