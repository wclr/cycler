import { makeHTTPDriver } from '../xstream'
import xs from 'xstream'
import delay from 'xstream/extra/delay'
import xsAdapter from '@cycle/xstream-adapter'
import * as test from 'tape'
import * as express from 'express'

var getPort = require('get-port')
var app = express()

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


let xsDriver = makeHTTPDriver()
let getHostUrl = (): string => 'http://localhost:' + testPort

test('Url as String', (t) => {
  xsDriver(xs.of(getHostUrl() + '/user').compose(delay(0)), xsAdapter)
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
  xsDriver(xs.of(request).compose(delay(0)), xsAdapter)
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
