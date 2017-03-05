import {hmrProxy as _hmrProxy} from './hmr'
import adapter from '@cycle/xstream-adapter'

export const hmrProxy = (...args: any[]) => {
  args.unshift([adapter])
  return _hmrProxy.apply(null, args)
}
export default hmrProxy