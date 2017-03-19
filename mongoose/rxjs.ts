import { TaskSource } from '@cycler/task/rxjs'
import { Observable } from 'rxjs/Observable'
import { MongooseRequest, MongooseResponse, ConnectionEvent } from './index'

export type MongooseSource = TaskSource<MongooseRequest, MongooseResponse> & {
  on: <T>(event: ConnectionEvent) => Observable<T>
}

export { MongooseRequest, MongooseResponse }
