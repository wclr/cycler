export const attachRequest = <T1, T2>
  (response$: T1, request: T2): T1 & { request: T2 } =>
  Object.defineProperty(response$, 'request', {
    value: request,
    writable: false
  })

export default attachRequest