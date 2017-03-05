import * as superagent from 'superagent'
import { HTTPRequest, HTTPRequestInput, HTTPResponse } from './interfaces'
import { GetProgressiveResponse } from '@cycler/task'

function preprocessReqOptions(reqOptions: HTTPRequest): HTTPRequest & { method: string } {
  // TODO: make immutable
  reqOptions.withCredentials = reqOptions.withCredentials || false;
  reqOptions.redirects = typeof reqOptions.redirects === 'number' ? reqOptions.redirects : 5;
  reqOptions.method = reqOptions.method || `get`;
  return reqOptions as HTTPRequest & { method: string }
}
type SuperAgentRequest = superagent.SuperAgentRequest
function optionsToSuperagent(request: HTTPRequest): SuperAgentRequest {
  const reqOptions = preprocessReqOptions(request);

  const lowerCaseMethod = reqOptions.method.toLowerCase();

  let saRequest: SuperAgentRequest = (<any>superagent)[lowerCaseMethod](reqOptions.url);

  if (reqOptions.redirects) {
    saRequest.redirects(reqOptions.redirects)
  }
  if (reqOptions.type) {
    saRequest.type(reqOptions.type)
  }
  if (reqOptions.send) {
    saRequest.send(reqOptions.send)
  }
  if (reqOptions.accept) {
    saRequest.accept(reqOptions.accept)
  }
  if (reqOptions.query) {
    saRequest.query(reqOptions.query)
  }
  if (reqOptions.withCredentials) {
    saRequest.withCredentials()
  }
  if (typeof reqOptions.user === 'string' && typeof reqOptions.password === 'string') {
    saRequest.auth(reqOptions.user, reqOptions.password);
  }
  if (reqOptions.headers) {
    for (let key in reqOptions.headers) {
      if (reqOptions.headers.hasOwnProperty(key)) {
        saRequest.set(key, reqOptions.headers[key]);
      }
    }
  }
  if (reqOptions.field) {
    for (let key in reqOptions.field) {
      if (reqOptions.field.hasOwnProperty(key)) {
        saRequest.field(key, reqOptions.field[key]);
      }
    }
  }
  if (reqOptions.attach) {
    reqOptions.attach.forEach(a => {
      saRequest.attach(a.name, a.path, a.filename);
    })
  }
  return saRequest;
}

export function normalizeRequest(request: HTTPRequestInput): HTTPRequest {
  if (typeof request === 'string') {
    return { url: request }
  } else if (typeof request === 'object') {
    return request
  } else {
    throw new Error(`Request input given to HTTP driver must be ` +
      `either URL string or object with parameters.`)
  }
}

export const getProgressiveResponse:
  GetProgressiveResponse<HTTPRequest, HTTPResponse, any> =
  (request, observer, onDispose) => {
    try {
      let saRequest = optionsToSuperagent(request);
      if (request.progress) {
        saRequest.on('progress', observer.next)
      }

      saRequest.end((err: any, res: HTTPResponse) => {
        if (request.url === '/api/readings/bundles/demo') {
          console.log('end', '/api/readings/bundles/demo', request)
        }
        if (err) {
          observer.error(err);
        } else {
          observer.next(res);
          observer.complete();
        }
      });
      onDispose(() => {
        saRequest.abort()
      })
    } catch (err) {
      observer.error(err);
    }
  } 