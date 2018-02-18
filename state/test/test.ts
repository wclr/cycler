import { Reducer } from '..'
import xs, { Stream } from 'xstream'
import * as test from 'tape'
import * as R from 'ramda'

type State = {
  name: string
  age?: number
}

const state: State = { name: 'Jesus', age: 33 }

export const map = <T, R>(mapFn: (t: T) => R) =>
(items: T[]) => items.map(mapFn)

// test('string prop', () => {
//   const state$: Stream<State> = xs.create<State>()
//   const lens = R.lensProp<string>('age')
//   zoomIn(R.view(lens))
//   state$.compose(zoomIn(R.prop('age')))
//     .map(x => x) // x should be string

//   const reducer$ = xs.create<Reducer<Date>>()

//   reducer$.map(R.over(R.lensProp('age')))
//     .map(x => x(state)) // x should be Reducer<State>
// })
