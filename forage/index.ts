import { makeTaskDriver, TaskSource } from '@cycler/task'
import {
  Options,
  ForageRequest,
  ForageResponse,
  ForageDriverName,
  ForageTaskRequest,
} from './interfaces'

import { makeGetResponse as makeDriverParams } from './makeGetResponse'

export const forageDrivers = {
  localStorage: 'localStorageWrapper' as ForageDriverName,
  webSQL: 'webSQLStorage' as ForageDriverName,
  indexeddb: 'asyncStorage' as ForageDriverName,
}

export type ForageSource = TaskSource<
  ForageRequest | ForageTaskRequest,
  ForageResponse
>

export function makeForageDriver(options: Options = {}) {
  return makeTaskDriver<ForageRequest | ForageTaskRequest, ForageResponse, any>(
    makeDriverParams(options)
  )
}

export * from './interfaces'
export * from './instance'
