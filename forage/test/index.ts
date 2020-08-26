// To make it work
// we need to make `localStorage` available in global context 
// before loading localforage module
if (typeof localStorage === 'undefined' || localStorage === null) {
  const anyGlobal = (global as any)
  const LocalStorage: any = require('node-localstorage').LocalStorage
  anyGlobal.localStorage = new LocalStorage('./scratch')
}

require('./runTest')
