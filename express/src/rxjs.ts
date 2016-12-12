import { Observable } from 'rxjs'
import { Router } from 'express'
import adapter from '@cycle/rx-adapter'
import { StreamAdapter } from '@cycle/base'
import { RouterSource as _RouterSource, RouterRequest, RouterResponse } from './index'
import { makeRouterDriver as _makeRouterDriver } from './index'
export * from './interfaces'

export type RouterSource = _RouterSource<Observable<RouterRequest>>

export type RouterDriver = (
  response$: Observable<RouterResponse>, runSA: StreamAdapter
) => RouterSource

export function makeRouterDriver(router: Router): RouterDriver {
  return _makeRouterDriver<Observable<RouterRequest>>(router)
}

export default makeRouterDriver