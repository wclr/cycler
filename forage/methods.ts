import { KeyValue } from './instance'
import { ForageRequest } from './interfaces'

/**
 * Creates request for getting single item from store by key.
 * @param  {string} key
 * @returns ForageRequest
 */
export function getItem(key: string): ForageRequest {
  return { getItem: key }
}

/**
 * Creates request for removing single item from store by key.
 * @param  {string} key
 * @returns ForageRequest
 */
export function removeItem(key: string): ForageRequest {
  return { removeItem: key }
}
/**
 * Creates request for getting multiple items from store by keys.
 * @param  {string[]} keys?
 * @returns ForageRequest
 */
export function getItems(keys?: string[]): ForageRequest {
  return { getItems: keys || null }
}

export function setItem<T>(key: string, value: T): ForageRequest
export function setItem<T>(item: KeyValue<T>[]): ForageRequest

export function setItem(...args: any[]): ForageRequest {
  let item: KeyValue<any>
  if (typeof args[0] === 'string') {
    item = { key: args[0], value: args[1] }
  } else {
    item = args[0]
  }
  //return {method: 'setItem', item}
  return { setItem: item }
}

export interface StoreRequestHelper {
  getItem: typeof getItem
  removeItem: typeof removeItem
  getItems: typeof getItems
}

/**
 * @param  {string} store
 * @returns StoreRequestHelper
 */
export function store(storeName: string): StoreRequestHelper
/**
 * @param  {string} name
 * @param  {string} storeName
 * @returns StoreRequestHelper
 */
export function store(name: string, storeName: string): StoreRequestHelper

export function store(...args: any[]): StoreRequestHelper {
  let [name, storeName] = args
  if (args.length === 1) {
    storeName = name
  }
  let addStore = (request: ForageRequest): ForageRequest => {
    if (name) {
      request.name = name
    }
    request.storeName = storeName
    return request
  }
  return {
    getItem: (...args: any[]) => addStore((<any>getItem)(...args)),
    removeItem: (...args: any[]) => addStore((<any>removeItem)(...args)),
    getItems: (...args: any[]) => addStore((<any>getItems)(...args))
  }
}
