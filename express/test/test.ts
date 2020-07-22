import test from 'tape'
import xs, { Stream } from 'xstream'
import express from 'express'
import { run } from '@cycle/run'
import { makeRouterDriver, RouterRequest, RouterResponse } from '../index'
import { RouterSource } from '..'
import request from 'supertest'

const app = express()

interface Sources {
  router: RouterSource
}

interface MainSinks {
  router: Stream<RouterResponse>
}
interface MyRequest extends RouterRequest {}

const Main = ({ router }: Sources): MainSinks => {
  return {
    router: xs.merge<RouterResponse>(
      router.all('/all').map<RouterResponse>(x => ({
        id: x.id,
        send: { all: 'John' },
      })),
      router.get('/user').map<RouterResponse>(r => ({
        id: r.id,
        send: { name: 'John' },
      })),
      router
        .route('/nested')
        .method('options', '/something')
        .map<RouterResponse>(({ id }) => ({
          id,
          handle: res => {
            res.status(201).send({ nested: true })
          },
          // status: 201,
          // send: { nested: true },
        }))
    ),
  }
}

run(Main, {
  router: makeRouterDriver(app),
})

test('get request', t => {
  request(app)
    .get('/user')
    .expect(200)
    .expect({ name: 'John' })
    .end((err: Error) => {
      if (err) {
        throw err
      }
      t.pass()
      t.end()
    })
})

test('all method', t => {
  request(app)
    .put('/all')
    .expect(200)
    .expect({ all: 'John' })
    .end((err: Error) => {
      if (err) {
        throw err
      }
      t.pass()
      t.end()
    })
})

test('nested router and custom method', t => {
  request(app)
    .options('/nested/something')
    .expect(201)
    .expect({ nested: true })
    .end((err: Error) => {
      if (err) {
        throw err
      }
      t.pass()
      t.end()
    })
})
