import localforage from 'localforage'
const getItems = require('localforage-getitems')
const setItems = require('localforage-setitems')
const removeItems = require('localforage-removeitems')

const extendLocalForage = (obj: any) => obj.extendPrototype(localforage)
localforage.iterate
extendLocalForage(getItems)
extendLocalForage(setItems)
extendLocalForage(removeItems)

export default localforage