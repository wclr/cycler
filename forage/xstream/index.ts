import { makeTaskDriver, TaskSource } from '@cycler/task/xstream'
import { Stream } from 'xstream'
import { StreamAdapter } from '@cycle/base'
import { ForageDriverOptions, ForageRequest, ForageResponse } from '../interfaces'
import { makeGetResponse } from '../makeGetResponse'

export type ForageSource = TaskSource<ForageRequest, ForageResponse>
export {ForageRequest, ForageResponse}

export function makeForageDriver(options: ForageDriverOptions = {}) {
  return makeTaskDriver
    <ForageRequest, ForageResponse, any>(makeGetResponse(options))
}
