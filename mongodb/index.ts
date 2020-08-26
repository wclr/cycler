import xs, { Stream } from 'xstream'
import * as mongodb from 'mongodb'
import { Db } from 'mongodb'
import { makeTaskDriver } from '@cycler/task'

export type MongoRequest<T = any> = {
  db?: string
  task: (client: mongodb.MongoClient) => Promise<T>
}

export type MongoSource = ReturnType<ReturnType<typeof makeMongoDriver>>

type Arguments<F extends (...x: any[]) => any> = F extends (
  ...x: infer A
) => any
  ? A
  : never

export const makeMongoDriver = ({
  uri,
  db: dbName,
}: {
  uri: string
  db?: string
}) => {
  return (request$: Stream<MongoRequest>) => {
    const clientP = mongodb.connect(uri, {
      useUnifiedTopology: true,
    })

    const taskDriver = makeTaskDriver<MongoRequest, unknown, unknown>(
      async (r) => {
        const client = await clientP
        return r.task(client)
      }
    )

    const getMethodsForDbName = (name?: string) => {
      type Self = { _dbOff: () => void }
      return {
        on: <T>(event: string | symbol) => {
          return xs.create<T>({
            async start(this: Self, listener) {
              const client = await clientP
              const db = client.db(name)
              const dbListener = () => {}
              this._dbOff = () => {
                db.off(event, dbListener)
              }
              db.on(event, dbListener)
            },
            stop(this: Self) {
              this._dbOff()
            },
          })
        },
        watch: <T>(collection: string, ...args: Arguments<Db['watch']>) => {
          return xs.create<T>({
            async start(
              this: { _changeStream: mongodb.ChangeStream },
              listener
            ) {
              const client = await clientP
              const db = client.db(name)
              const stream = db.collection(collection).watch(...args)
              this._changeStream = stream
              stream.on('change', (next: any) => {
                listener.next(next)
              })
              stream.on('error', (error) => {
                listener.error(error)
              })
              stream.on('close', () => {
                listener.complete()
              })
            },
            stop(this: { _changeStream: mongodb.ChangeStream }) {
              this._changeStream.close()
            },
          })
        },
      }
    }

    const source = {
      connected: () => {
        return xs.createWithMemory<mongodb.MongoClient>({
          start(listener) {
            clientP
              .then((client) => {
                listener.next(client)
              })
              .catch((e) => {
                listener.error(e)
              })
          },
          stop() {},
        })
      },
      task: taskDriver(request$),
      name: (name: string) => {
        return {
          ...getMethodsForDbName(name),
        }
      },
      ...getMethodsForDbName(dbName),
    }
    ;(source as any).dispose = async () => {
      ;(await clientP).close()
    }

    return source
  }
}
