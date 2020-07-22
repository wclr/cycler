import { Stream } from 'xstream'
import * as express from 'express'

export type RoutePath = string | RegExp | (string | RegExp)[]
export type RequestId = string & { __RequestId: true }
export type RouterRequest = express.Request & { id: RequestId }

export interface RouterResponseParams {
  id: RequestId
  charset?: string
  status?: number
  handle?: (res: express.Response) => void
}

export interface RouterOptions {}

export type RouterResponse =
  | RouterResponseParams  
  | (RouterResponseParams & { send: any })
  | (RouterResponseParams & { end: any })
  | (RouterResponseParams & { sendStatus: number })

export interface RouterSource {
  /**
   * Returns the stream of all requests comming thought the router
   * @param  {string|RegExp} path
   */
  all<R>(path: string | RegExp): Stream<RouterRequest & R>
  /**
   * Returns the stream of GET request scomming thought the router
   * @param  {string|RegExp} path
   */
  get<R>(path: string | RegExp): Stream<RouterRequest & R>
  /**
   * Returns the stream of POST requests comming thought the router
   * @param  {string|RegExp} path
   */
  post<R>(path: string | RegExp): Stream<RouterRequest & R>
  /**
   * Returns the stream of PUT requests comming thought the router
   * @param  {string|RegExp} path
   */
  put<R>(path: string | RegExp): Stream<RouterRequest & R>
  /**
   * Returns the stream of DELETE requests comming thought the router
   * @param  {string|RegExp} path
   */
  delete<R>(path: string | RegExp): Stream<RouterRequest & R>
  /**
   * Returns the stream of request for given HTTP method
   * @param  {string|RegExp} path
   */
  method<R>(name: string, path: string | RegExp): Stream<RouterRequest & R>
  /**
   * Returns returns new router source for given path
   * @param  {string|RegExp} path
   * @param  {} options Options passed to created express router
   */
  route(path: string | RegExp, options?: any): RouterSource
}
