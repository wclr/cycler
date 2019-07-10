import { TaskRequest } from '@cycler/task'

export type ForageDriverName = 'localStorageWrapper' | 'webSQLStorage' | 'asyncStorage' 

export type ForageMethod = 'getItem' | 'setItem' | 'removeItem'
  | 'keys' | 'length' | 'clear' | 'iterage'
  | 'getItems' | 'setItems' | 'removeItems'

export type Iterator = (value: any, key: string, iterationNumber: number) => void

export interface StoreRequest {
  name?: string,
  storeName?: string
}

export type KeyValue<T> = {key: string, value: T}

export interface GetItemRequest extends StoreRequest, TaskRequest {
  getItem: string 
}
export interface RemoveItemRequest extends StoreRequest, TaskRequest {
  removeItem: string
}
export interface SetItemRequest extends StoreRequest, TaskRequest {
  setItem: KeyValue<any>  
}

export interface ClearRequest extends StoreRequest, TaskRequest {
  clear: {} | null
}
export interface LengthRequest extends StoreRequest, TaskRequest {
  length: {} | null 
}
export interface KeysRequest extends StoreRequest, TaskRequest {
  keys: {} | null
}
export interface IterateRequest extends StoreRequest, TaskRequest {  
  iterate: Iterator
}
export interface GetItemsRequest extends StoreRequest, TaskRequest {  
  getItems: string[] | null
}
export interface RemoveItemsRequest extends StoreRequest, TaskRequest {
  removeItems: string[] | null
}
export interface SetItemsRequest extends StoreRequest, TaskRequest {
  setItems: KeyValue<any>[]
}

export interface SetItemsIndexedRequest extends StoreRequest, TaskRequest {
  //setItems: KeyValue<any>[]
  setItems: {[index: string]: Object}  
}

export type ForageRequest =
  GetItemRequest |
  RemoveItemRequest |
  SetItemRequest |
  KeysRequest |
  LengthRequest |
  ClearRequest |
  IterateRequest |
  GetItemsRequest |
  RemoveItemsRequest |
  SetItemsRequest | SetItemsIndexedRequest

export type ForageResponse = {}

export type ForageDriverOption = ForageDriverName | { _driver: string }

export interface CreateForageOptions {
  driver?: ForageDriverOption
  name?: string
  storeName?: string
  size?: number
  version?: string
  description?: string
}

export type ForageDriverOptions = CreateForageOptions 

