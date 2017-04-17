import {
  makeTaskDriver,
  TaskRequest,
  TaskSource
} from '@cycler/task'
import xs, { Stream } from 'xstream'
import { adapt } from '@cycle/run/lib/adapt'
import { getResponse } from './getResponse'

export interface FileSystemRequest extends TaskRequest {
  method: string,
  args: any[]
}

export type FileSystemResponse = {}

export type FileSystemSource = TaskSource<FileSystemRequest, FileSystemResponse>

export function makeFileSystemDriver() {
  return makeTaskDriver<FileSystemRequest, FileSystemResponse, any>(getResponse)
}
