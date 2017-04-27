export const requestOps = {
  namespaceProp: '_namespace',
  addProperty: <Request>(request: Request, name: string, value: any) => {
    const newRequest = typeof request === 'object' ?
      Object.assign({}, request) : request
    return Object.assign(newRequest, { [name]: value })
  },
  readProperty: <T>(request: any, propertyName: string) =>
    (request as any)[propertyName] as T,
  removeProperty: (request: Request, propertyName: string) => {
    const newRequest = typeof request === 'object' ?
      Object.assign({}, request) : request as any
    delete newRequest[propertyName]
    return newRequest
  },
  isolateRequest: <Request>(requestToIsolate: Request,
    scope: string): Request => {
    if (scope) {
      const namespace =
        requestOps.readProperty<string[]>(requestToIsolate, requestOps.namespaceProp)

      if (namespace) {
        if (namespace.indexOf(scope) === -1) {
          namespace.push(scope)
        }
        return requestToIsolate
      } else {
        return requestOps.isolateRequest(
          requestOps.addProperty(requestToIsolate, requestOps.namespaceProp, []), scope)
      }
    }
    return requestToIsolate
  },
  filterIsolatedRequest: <Request>(req: Request, scope: string) => {
    const namespace = requestOps.readProperty(req, requestOps.namespaceProp)
    return Array.isArray(namespace) &&
      namespace.indexOf(scope) !== -1
  }
}

export type Partial<T> = {
  [P in keyof T]?: T[P]
}
export function setRequestOps<Request>
  (ops: Partial<typeof requestOps>) {
  Object.assign(requestOps, ops)
}
