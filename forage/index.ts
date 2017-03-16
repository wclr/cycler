import { makeTaskDriver} from '@cycler/task'
import {
  ForageDriverOptions, ForageRequest, ForageResponse, LocalForageDriverName
} from './interfaces'

import { makeGetResponse } from './makeGetResponse'

export const forageDrivers = {
  localStorage: <LocalForageDriverName>'localStorageWrapper',
  webSQL: <LocalForageDriverName>'webSQLStorage',
  indexeddb: <LocalForageDriverName>'asyncStorage'
}

export function makeForageDriver(options: ForageDriverOptions = {}): any {  
  return makeTaskDriver
    <ForageRequest, ForageResponse, any>(makeGetResponse(options))    
}

export * from './interfaces'
