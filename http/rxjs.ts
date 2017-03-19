import { TaskSource } from '@cycler/task/rxjs'
import { getProgressiveResponse, normalizeRequest } from './getResponse'
import {
  HTTPRequest, HTTPRequestInput, HTTPResponse
} from './interfaces'

export type HTTPSource = TaskSource<HTTPRequest, HTTPResponse>