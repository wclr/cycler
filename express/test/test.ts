import * as test from 'tape'
import { Observable } from 'rxjs'
import * as express from 'express'
import { Sinks } from '@cycle/run'
import { run } from '@cycle/rxjs-run'
import { makeRouterDriver, RouterRequest, RouterResponse, RequestId } from '../index'
import { RouterSource } from '../rxjs'
import * as request from 'supertest'

const app = express()

interface Sources {
  router: RouterSource
}

interface MainSinks extends Sinks {
  router: Observable<RouterResponse>
}
interface MyRequest extends RouterRequest {
  
}

const Main = ({router}: Sources): MainSinks => {
  return {
    router: Observable.merge<RouterResponse>(
      router.all('/all').map(x => ({
        id: x.id,
        send: { all: 'John' }
      })),
      router.get('/user').map(r => ({
        id: r.id,
        send: { name: 'John' }
      })),
      router.route('/nested')
        .method('options', '/something').map(({id}) => ({
          id,
          status: 201,
          send: { nested: true }
        }))
    )
  }
}

run<Sources, MainSinks>(Main, {
  router: makeRouterDriver(app)
})



test('get request', (t) => {
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

test('all method', (t) => {
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

test('nested router and custom method', (t) => {
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