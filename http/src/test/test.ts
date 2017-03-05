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

app.post('/user', function (req, res) {
  res.status(200).json({ data: 'created' })
})

app.delete('/user', function (req, res) {
  res.status(401).json({ data: 'no auth' })
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

test('Allows request to be a url string', (t) => {
  xsDriver(xs.of(getHostUrl() + '/user').compose(delay(0)), xsAdapter)
    .select<{ body: { name: string } }>()
    .flatten()
    .addListener({
      next: (res) => t.is(res.body.name, 'john'),
      error: (err) => { throw err },
      complete: () => { t.end() },
    })
})

test('Allows request as object with only url (default method `get`)', (t) => {
  let request = { url: getHostUrl() + '/user' }
  xsDriver(xs.of(request).compose(delay(0)), xsAdapter)
    .select<{ body: { name: string } }>()
    .flatten()
    .addListener({
      next: (res) => t.is(res.body.name, 'john'),
      error: (err) => { throw err },
      complete: () => { t.end() },
    })
})


test('Allows request as object with url and method', (t) => {
  let request = { method: 'post', url: getHostUrl() + '/user' }
  xsDriver(xs.of(request).compose(delay(0)), xsAdapter)
    .select<{ body: { data: string } }>()
    .flatten()
    .addListener({
      next: (res) => t.is(res.body.data, 'created'),
      error: (err) => { throw err },
      complete: () => { t.end() },
    })
})

test('Emits error object', (t) => {
  let request = { method: 'delete', url: getHostUrl() + '/user' }
  xsDriver(xs.of(request).compose(delay(0)), xsAdapter)
    .select<{ body: { data: string } }>()
    .flatten()
    .addListener({
      next: (res) => { },
      error: (err) => { t.is(err.response.body.data, 'no auth') },
      complete: () => { t.end() },
    })
})

let anyTest = test as any
anyTest.onFinish(() => process.exit(0))