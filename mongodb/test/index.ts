import xs, { Stream } from 'xstream'
import { makeMongoDriver } from '..'

makeMongoDriver({ uri: 'mongodb://localhost/cycler_mongodb_test' })(xs.empty())
  .task.select<{ x: 1 }>()
  .flatten()
  .map((x) => x)
