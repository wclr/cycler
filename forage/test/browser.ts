import * as test from 'tape'
import { makeTest } from './makeTest'
import { makeForageDriver, ForageSource, ForageRequest } from '../.'
import { forageDrivers } from '../'

const indexeddbForageDriver = makeForageDriver({
  name: 'test',
})

test('INDEXEDDB: setItems, getItems, removeItems', (t) => {
  makeTest(indexeddbForageDriver, t)
})

const localstorageForageDriver = makeForageDriver({
  driver: forageDrivers.localStorage,
  name: 'test',
})

test('LOCALSTORAGE: setItems, getItems, removeItems', (t) => {
  makeTest(localstorageForageDriver, t, true)
})

const websqlForageDriver = makeForageDriver({
  driver: forageDrivers.webSQL,
  name: 'test',
})

test('WEBSQL: setItems, getItems, removeItems', (t) => {
  makeTest(websqlForageDriver, t)
})
