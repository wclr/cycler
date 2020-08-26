import test from 'tape'
import { makeTest } from './makeTest'
import { makeForageDriver, ForageSource, ForageRequest } from '../.'
import { forageDrivers } from '../'

const indexedDbDriver = makeForageDriver({
  name: 'test'
})

test('INDEXEDDB: setItems, getItems, removeItems', t => {
  makeTest(indexedDbDriver, t)
})

const localStorageDriver = makeForageDriver({
  driver: forageDrivers.localStorage,
  name: 'test'
})

test('LOCALSTORAGE: setItems, getItems, removeItems', t => {
  makeTest(localStorageDriver, t, true)
})

const websqlDriver = makeForageDriver({
  driver: forageDrivers.webSQL,
  name: 'test'
})

test('WEBSQL: setItems, getItems, removeItems', t => {
  makeTest(websqlDriver, t)
})
