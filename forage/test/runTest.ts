import * as test from 'tape'
import { makeTest } from './makeTest'
import { makeForageDriver, ForageSource, ForageRequest } from '../.'
import { forageDrivers } from '../'

const localStorageDriver = makeForageDriver({
  driver: forageDrivers.localStorage,
  name: 'test'
})

test('LocalStorage: setItems, getItems, removeItems', t => {
  makeTest(localStorageDriver, t, true)
})
