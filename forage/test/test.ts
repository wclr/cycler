import * as test from 'tape'
import { makeTest } from './makeTest'
import { makeForageDriver, ForageSource, ForageRequest } from '../xstream'
import { forageDrivers } from '../'
//require('node-localstorage')
//console.log('localStorage', localStorage)
if (typeof localStorage === 'undefined' || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  (<any>global).window = (<any>{localStorage: new LocalStorage('./scratch')})
  (<any>global).window.localStorage = new LocalStorage('./scratch');
  //console.log('localStorage', (<any>global).localStorage)
}
const localstorageForageDriver = makeForageDriver({
  driver: forageDrivers.localStorage,
  name: 'test',
})

test('LOCALSTORAGE: setItems, getItems, removeItems', (t) => {
  makeTest(localstorageForageDriver, t, true)
})