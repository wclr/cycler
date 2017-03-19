import * as test from 'tape'
import { makeTest } from './makeTest'
import { makeForageDriver, ForageSource, ForageRequest } from '../.'
import { forageDrivers } from '../'

const localstorageForageDriver = makeForageDriver({
  driver: forageDrivers.localStorage,
  name: 'test',
})

test('LOCALSTORAGE: setItems, getItems, removeItems', (t) => {
  makeTest(localstorageForageDriver, t, true)
})