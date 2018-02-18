import * as test from 'tape'
import { ForageSource, ForageRequest } from '../.'
import xs, { Stream, Listener } from 'xstream'
import { run } from '@cycle/run'
import delay from 'xstream/extra/delay'

interface Sources {
  forage: ForageSource
}

type Sinks = {
  forage: Stream<ForageRequest>
}

const testValue = (t: test.Test, testValue: any, testName?: string) =>
  <T>(val: T): T => {
    t.deepEqual(val, testValue, testName)
    return val
  }

export const makeTest = (forageDriver: any, t: test.Test, isLocalStorage?: boolean) => {
  let vals = { a: 'A', b: 'B' }
  const Main = ({ forage }: Sources): Sinks => {    
    
    return {
      forage: xs.merge(
        xs.of({
          category: 'setItems',
          setItems: vals
        }).compose(delay(1)),
        forage.select('setItems')
          .flatten().mapTo({
            category: 'getItems',
            getItems: ['a', 'b']
          }),
        forage.select('getItems')
          .flatten()
          .map(testValue(t, vals, 'getItems ok'))
          .mapTo({
            category: 'removeItems',
            removeItems: ['a', 'b']
          }),
        forage.select('removeItems').flatten().mapTo({
          category: 'getRemovedItems',
          getItems: ['a', 'b']
        }),
        forage.select('getRemovedItems')
          .flatten()          
          .map(testValue(t, isLocalStorage ? {a: null, b: null} : {}, 'getRemovdItems ok'))
          .map(() => t.end())
          .mapTo({
            category: 'clear',
            clear: null
          })
      )
    }
  }

  run(Main, {
    forage: forageDriver
  })
}
