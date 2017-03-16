import * as test from 'tape'
import { makeTest } from './makeTest'
import { makeForageDriver, ForageSource, ForageRequest } from '../xstream'
import { forageDrivers } from '../'


//require('node-localstorage')
//console.log('localStorage', localStorage)
//console.log('here')
// if (typeof localStorage === 'undefined' || localStorage === null) {
//   const anyGlobal = (global as any)
//   const LocalStorage: any = require('node-localstorage').LocalStorage
//   console.log('here2')
//   anyGlobal.window = { localStorage: new LocalStorage('./scratch') }
//   anyGlobal.localStorage = new LocalStorage('./scratch')
//   //anyGlobal.localStorage
//   //(<any>global).window.localStorage = new LocalStorage('./scratch');
//   //console.log('localStorage', (<any>global).localStorage)
// }


const localstorageForageDriver = makeForageDriver({
  driver: forageDrivers.localStorage,
  name: 'test',
})

test('LOCALSTORAGE: setItems, getItems, removeItems', (t) => {
  makeTest(localstorageForageDriver, t, true)
})