import { makeFileSystemDriver } from '..'
import xs from 'xstream'
import delay from 'xstream/extra/delay'
import * as test from 'tape'

const driver = makeFileSystemDriver()

test('First go!', (t) => {
  const readRequest$ = xs.of({
    method: 'readJSON',
    args: [__dirname + '/../package.json']
  })
  driver(readRequest$).select<{ name: string }>().flatten()
    .addListener({
      next: (json) => {
        t.is(json.name, '@cycler/fs')
        t.end()
      }
    })
})
