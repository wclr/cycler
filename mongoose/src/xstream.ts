import { makeTaskDriver, TaskSource} from '@cycler/task/xstream'
import { makeMongooseDriver as _makeMongooseDriver, ConnectionEvent } from './index'
import { Stream } from 'xstream'
import { MongooseRequest, MongooseResponse } from './index'
import * as mongoose from 'mongoose'
import adapter from '@cycle/xstream-adapter'
import { StreamAdapter } from '@cycle/base'

export interface MongooseSource extends TaskSource<MongooseRequest, MongooseResponse> {
  on: (event: ConnectionEvent) => Stream<any>
}
export { MongooseRequest, MongooseResponse }
export type MongooseDriver = (
  request$: Stream<MongooseRequest>, runSA?: StreamAdapter
) => MongooseSource

export function makeMongooseDriver(mongoUrl: string, options?: mongoose.ConnectionOptions): MongooseDriver
export function makeMongooseDriver(connection: mongoose.Connection): MongooseDriver

export function makeMongooseDriver (...args: any[]) {
  return (...driverArgs: any[]) =>
    (<any>_makeMongooseDriver)(...args)(...driverArgs.concat(adapter))
}