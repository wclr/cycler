import { TaskRequest } from '@cycler/task'
import { KeyValue, ForageInstance, IndexedItems } from './instance'
import type localforage from 'localforage'

type Arguments<F extends (...x: any[]) => any> = F extends (
  ...x: infer A
) => any
  ? A
  : never

export type ForageDriverName =
  | 'localStorageWrapper'
  | 'webSQLStorage'
  | 'asyncStorage'

export type ForageMethodName =
  | 'getItem'
  | 'setItem'
  | 'removeItem'
  | 'keys'
  | 'length'
  | 'clear'
  | 'iterate'
  | 'getItems'
  | 'setItems'
  | 'removeItems'

export type Iterator = (
  value: any,
  key: string,
  iterationNumber: number
) => void

export interface StoreRequest {
  name?: string
  storeName?: string
}

export interface ForageMethodRequest extends StoreRequest, TaskRequest {
  method: ForageMethodName
  args: string[]
}

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
  setItems: IndexedItems<any>
}

// remove
export interface ForageExecRequest extends StoreRequest, TaskRequest {
  execute: (storage: ForageInstance) => Promise<any>
}

export interface ForageTaskRequest<T = unknown>
  extends StoreRequest,
    TaskRequest {
  task: (storage: ForageInstance) => Promise<T>
}

export type ForageNamedRequest =
  | GetItemRequest
  | RemoveItemRequest
  | SetItemRequest
  | KeysRequest
  | LengthRequest
  | ClearRequest
  | IterateRequest
  | GetItemsRequest
  | RemoveItemsRequest
  | SetItemsRequest
  | SetItemsIndexedRequest

export type ForageRequest =
  | ForageMethodRequest
  | ForageNamedRequest
  | ForageExecRequest
  | ForageTaskRequest

export type ForageResponse = unknown

export type LocalForageDriver = Arguments<typeof localforage.defineDriver>[0]

export type ForageDriverOption = ForageDriverName | string | LocalForageDriver

export interface LocalForageOptions {
  name?: string
  storeName?: string
  driver?: string | string[]
  size?: number
  version?: number
  description?: string
}

export interface Options extends Omit<LocalForageOptions, 'driver'> {
  driver?: ForageDriverOption
}
