import * as test from 'tape'
import { Observable } from 'rx'
import * as express from 'express'
import { run } from '@cycle/rx-run'
import { makeRouterDriver, RouterSource, RouterResponse, RequestId } from '../rx'
import * as request from 'supertest'

const app = express()

interface Sources {
  router: RouterSource
}

interface Sinks {
  router: Observable<RouterResponse>
}

const Main = ({router}: Sources): Sinks => {    
  return {    
    router: Observable.merge<RouterResponse>(
      router.all('/all').map(x => ({
        id: x.id,
        send: { all: 'John' }
      })),
      router.get('/user').map<RouterResponse>(r => ({
        id: r.id,
        send: { name: 'John' }
      })),      
      router.route('/nested')
        .method('options', '/something').map(({id}) => ({
          id,
          status: 201,
          send: {nested: true}
        }))
    )
  }
}

run(Main, {
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