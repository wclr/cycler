import { makeHTTPDriver } from '../.'
import xs from 'xstream'
import delay from 'xstream/extra/delay'
import * as test from 'tape'
import * as express from 'express'
//
const getPort = require('get-port')
const app = express()

app.get('/user', function (req, res) {
  res.status(200).json({ name: 'john' })
})

app.delete('/user', function (req, res) {
  res.status(200).json({ data: 'removed' })
})

let testPort: number

test('#start', (t) => {
  getPort().then((port: number) => {
    console.log('Test server is listening on port ' + port)
    testPort = port
    app.listen(port)
    t.end()
  })
})


let driver = makeHTTPDriver()
let getHostUrl = (): string => 'http://localhost:' + testPort

test('Url as String', (t) => {
  driver(xs.of(getHostUrl() + '/user').compose(delay(0)))
    .select<{ body: { name: string } }>()
    .flatten()
    .addListener({
      next: (res) => t.is(res.body.name, 'john'),
      error: (err) => { throw err },
      complete: () => { t.end() },
    })
})

test('Delete method', (t) => {
  let request = { method: 'delete', url: getHostUrl() + '/user' }
  driver(xs.of(request).compose(delay(0)))
    .select<{ body: { data: string } }>()
    .flatten()
    .addListener({
      next: (res) => t.is(res.body.data, 'removed'),
      error: (err) => { throw err },
      complete: () => { t.end() },
    })
})

let anyTest = <any>test
anyTest.onFinish(() => process.exit(0))
