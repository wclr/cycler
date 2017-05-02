import { makeTaskDriver, InputTaskSource, TaskDriver } from '@cycler/task'
import { Stream } from 'xstream'
import { getProgressiveResponse, normalizeRequest } from './getResponse'
import {
  HTTPRequest, HTTPRequestInput, HTTPResponse
} from './interfaces'

export type HTTPSource = InputTaskSource<HTTPRequestInput, HTTPRequest, HTTPResponse>

export function makeHTTPDriver() {
  return makeTaskDriver
    <HTTPRequestInput, HTTPRequest, HTTPResponse, any>({
      normalizeRequest,
      getProgressiveResponse
    })
}

export * from './interfaces'
