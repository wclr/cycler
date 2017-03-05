import { makeTaskDriver, TaskSource } from '@cycler/task/xstream'
import { StreamAdapter } from '@cycle/base'
import { Stream } from 'xstream'
import { getProgressiveResponse, normalizeRequest } from './getResponse'
import {
  HTTPRequest, HTTPRequestInput, HTTPResponse
} from './interfaces'

export type HTTPSource = TaskSource<HTTPRequest, HTTPResponse>

export function makeHTTPDriver() {
  return makeTaskDriver
    <HTTPRequestInput, HTTPRequest, HTTPResponse, any>({
      normalizeRequest,
      getProgressiveResponse
    })
}

export * from './interfaces'