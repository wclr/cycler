import { makeTaskDriver, TaskSource } from '@cycler/task'
import {
  ForageDriverOptions, ForageRequest, ForageResponse, ForageDriverName
} from './interfaces'

import { makeGetResponse } from './makeGetResponse'

export const forageDrivers = {
  localStorage: 'localStorageWrapper' as ForageDriverName,
  webSQL: 'webSQLStorage' as ForageDriverName,
  indexeddb: 'asyncStorage' as ForageDriverName
}

export interface ForageSource
  extends TaskSource<ForageRequest, ForageResponse> {}

export function makeForageDriver(options: ForageDriverOptions = {}): any {
  return makeTaskDriver
    <ForageRequest, ForageResponse, any>(makeGetResponse(options))
}

export * from './interfaces'
