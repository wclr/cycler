import { makeTaskDriver, TaskSource } from '@cycler/task/rx'
import { makeMongooseDriver as _makeMongooseDriver, ConnectionEvent } from './index'
import { Observable } from 'rx'
import { MongooseRequest, MongooseResponse } from './index'
import * as mongoose from 'mongoose'
import { StreamAdapter } from '@cycle/base'

export type MongooseSource = TaskSource<MongooseRequest, MongooseResponse> & {
  on: (event: ConnectionEvent) => Observable<any>
}
export { MongooseRequest, MongooseResponse }
export type MongooseDriver = (
  request$: Observable<MongooseRequest>, runSA: StreamAdapter
) => MongooseSource

export function makeMongooseDriver(mongoUrl: string, options?: mongoose.ConnectionOptions): MongooseDriver
export function makeMongooseDriver(connection: mongoose.Connection): MongooseDriver

export function makeMongooseDriver (...args: any[]) {
  return (<any>_makeMongooseDriver)(...args)
}
