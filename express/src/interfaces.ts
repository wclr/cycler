import {
  Request as ExpressRequest,
  Response as ExpressResponse
} from 'express'

export type RoutePath = string | RegExp | (string | RegExp)[];
export type RequestId = string & {__RequestId: true}
export type RouterRequest = ExpressRequest & { id: RequestId }

export interface RouterResponseParams {
  id: RequestId
  charset?: string
  status?: number
}

export type RouterResponse =
  RouterResponseParams |
  RouterResponseParams & { send: any } |
  RouterResponseParams & { end: any } |
  RouterResponseParams & { sendStatus: number }

  export interface RouterSource<RequestStream> {
  /**
   * Returns the stream of all request handled by the router
   * @param  {string|RegExp} path
   */
  all(path: string | RegExp): RequestStream
  get(path: string | RegExp): RequestStream
  post(path: string | RegExp): RequestStream
  put(path: string | RegExp): RequestStream
  delete(path: string | RegExp): RequestStream
    /**
   * Returns the stream of request for give HTTP method
   * @param  {string|RegExp} path
   */
  method(name: string, path: string | RegExp): RequestStream
    /**
   * Returns returns new router source for given path
   * @param  {string|RegExp} path
   * @param  {} options Options passed to created express router   
   */
  route(path: string | RegExp, options?: any): RouterSource<RequestStream>

}

export interface RouterOptions { }