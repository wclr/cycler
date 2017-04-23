import xs, { Stream } from 'xstream'
import { run, Sinks as RunSinks } from '@cycle/run'
import * as mongoose from 'mongoose'
import {
  makeMongooseDriver,
  MongooseSource,
  MongooseRequest
} from '../.'
import * as test from 'tape'
import delay from 'xstream/extra/delay'
import * as R from 'ramda'

(<any>mongoose).Promise = Promise

const { of, empty, merge } = xs

mongoose.connect('mongodb://mongo', (err) => {
  if (err) {
    console.log('Error connect trying to connect to localhost')
    mongoose.connect('mongodb://localhost')
  }
})

let mongooseDriver = makeMongooseDriver(mongoose.connection)

interface Sources {
  mongoose: MongooseSource
}

interface Sinks extends RunSinks {
  mongoose: Stream<MongooseRequest>
}

interface Person {
  id: Object,
  name: string
  age: number
}

mongoose.model('Person', new mongoose.Schema({ name: String, age: Number }, { collection: 'people' }))

const testValue = (t: test.Test, testValue: any, testName?: string) =>
  <T>(val: T): T => {
    t.deepEqual(val, testValue, testName)
    return val
  }

test('basic', (t) => {
  const Main = ({ mongoose }: Sources): Sinks => {
    return {
      mongoose: merge<MongooseRequest>(
        mongoose.on('connected').map(() =>
          t.pass('connnected event ok')
        ).mapTo({
          category: 'create',
          model: 'Person',
          create: [{ name: 'Jesus Christ', age: 33 }]
        }),
        mongoose.select<Person>('create')
          .flatten()
          .map<MongooseRequest>(created => ({
            category: 'find',
            model: 'Person',
            lean: true,
            findById: created.id,
          })),
        mongoose.select<Person>('find')
          .flatten()
          .map(R.omit(['_id', '__v']))
          .map(testValue(t, { name: 'Jesus Christ', age: 33 }, 'with model name, implicit query, lean query'))
          .mapTo(empty()).flatten(),
        mongoose.select<Person>('create')
          .flatten()
          .map<MongooseRequest>(created => ({
            category: 'findByCollection',
            collection: 'people',
            query: [
              { findById: created.id },
              { select: 'age' }
            ]
          })),
        mongoose.select<Person>('findByCollection')
          .flatten()
          .map(R.omit(['_id']))
          .map(testValue(t, { age: 33 }, 'with colleciton name, explicit query'))
          .map(() => t.end())
          .mapTo(empty()).flatten()
      ).compose(delay(0))
    }
  }

  run(Main, {
    mongoose: mongooseDriver
  })
})

const endTest = () => {
  (<any>test).onFinish(() => process.exit())
}
endTest()