import { Observable } from 'rxjs'
import { RouterRequest, RouterResponse } from './index'

export interface RouterSource {
  /**
   * Returns the Observable of all requests comming thought the router
   * @param  {string|RegExp} path
   */
  all<R>(path: string | RegExp): Observable<RouterRequest & R>
  /**
   * Returns the Observable of GET request scomming thought the router
   * @param  {string|RegExp} path
   */
  get<R>(path: string | RegExp): Observable<RouterRequest & R>
  /**
   * Returns the Observable of POST requests comming thought the router
   * @param  {string|RegExp} path
   */
  post<R>(path: string | RegExp): Observable<RouterRequest & R>
  /**
   * Returns the Observable of PUT requests comming thought the router
   * @param  {string|RegExp} path
   */
  put<R>(path: string | RegExp): Observable<RouterRequest & R>
  /**
   * Returns the Observable of DELETE requests comming thought the router
   * @param  {string|RegExp} path
   */
  delete<R>(path: string | RegExp): Observable<RouterRequest & R>
  /**
 * Returns the Observable of request for given HTTP method
 * @param  {string|RegExp} path
 */
  method<R>(name: string, path: string | RegExp): Observable<RouterRequest & R>
  /**
 * Returns returns new router source for given path
 * @param  {string|RegExp} path
 * @param  {} options Options passed to created express router   
 */
  route(path: string | RegExp, options?: any): RouterSource
}