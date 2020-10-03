import localforage from './localforage'

import {
  ForageRequest,
  Options,
  LocalForageOptions,
  ForageDriverOption,
  ForageExecRequest,
  ForageTaskRequest,
  ForageNamedRequest,
  ForageMethodRequest,
} from './interfaces'

const getDriverName = (
  driver: ForageDriverOption | ForageDriverOption[] | undefined
): string => {
  const getName = (driver: ForageDriverOption | undefined) => {
    if (typeof driver === 'string' || !driver) {
      return driver || ''
    } else {
      return driver && driver._driver
    }
  }
  return (Array.isArray(driver) ? driver : [driver]).map(getName).join('_')
}

const getStoreInstanceKey = (options: LocalForageOptions) => {
  return [
    'store',
    getDriverName(options.driver),
    options.name || '',
    options.storeName || '',
  ]
    .filter((_) => _)
    .join('_')
}

const storeInstances: {
  [index: string]: LocalForageDriverDbMethods
} = {}

const geStoreOptionsForRequest = (
  options: Options,
  request: ForageRequest | ForageTaskRequest
): LocalForageOptions => {
  const storeOptions: LocalForageOptions = {}
  // const storeOptions: LocalForageOptions = {
  //   ...options,
  //   driver: ([] as ForageDriverOption[])
  //   .concat(options.driver)
  //   .map(getDriverName)
  // }
  if (options.driver) {
    storeOptions.driver = ([] as ForageDriverOption[])
      .concat(options.driver)
      .map(getDriverName)
  }
  if (options.size) {
    storeOptions.size = options.size
  }
  if (options.version) {
    storeOptions.version = options.version
  }
  if (options.description) {
    storeOptions.description = options.description
  }
  const name = request.name || options.name
  if (name) {
    storeOptions.name = name
  }
  const storeName = request.storeName || options.storeName
  if (storeName) {
    storeOptions.storeName = storeName
  }
  return storeOptions
}

export const getStoreInstance = (options: LocalForageOptions): any => {
  const key = getStoreInstanceKey(options)
  if (!storeInstances[key]) {
    storeInstances[key] = localforage.createInstance(options)
  }
  return storeInstances[key]
}

const methods = [
  'getItem',
  'setItem',
  'removeItem',
  'keys',
  'length',
  'clear',
  'iterate',
  'getItems',
  'setItems',
  'removeItems',
]

const defineDrivers = (driver: ForageDriverOption | ForageDriverOption[]) => {
  const drivers = ([] as ForageDriverOption[]).concat(driver)
  drivers.forEach((driver) => {
    if (typeof driver === 'object' && driver._driver) {
      localforage.defineDriver(driver as any).catch(() => {})
    }
  })
}

const getParamsFromNamedRequest = (
  request: ForageNamedRequest
): [string, string[]] | undefined => {
  const method = methods.reduce(
    (found, method) => found || (request.hasOwnProperty(method) ? method : ''),
    ''
  )
  const param = (<any>request)[method]
  let params = [param]
  if (method === 'setItem') {
    params = [param.key, param.value]
  }
  return method ? [method, params] : undefined
}

const getParamsFromMethodRequest = (
  request: ForageMethodRequest
): [string, string[]] | undefined => {
  const method = request.method
  const params = request.args
  return method && params ? [method, params] : undefined
}

export const makeGetResponse = (options: Options) => {
  options.driver && defineDrivers(options.driver)

  return {
    getResponse: (request: ForageRequest) => {
      const storeOptions = geStoreOptionsForRequest(options, request)
      const instance = getStoreInstance(storeOptions)
      const task =
        (request as ForageExecRequest).execute ||
        (request as ForageTaskRequest).task
      if (task) {
        return task(instance)
      }
      const [method, params] =
        getParamsFromMethodRequest(request as ForageMethodRequest) ||
        getParamsFromNamedRequest(request as ForageNamedRequest) ||
        []

      if (!method) {
        throw new Error(`No valid method found in request`)
      }

      if (!instance[method]) {
        throw new Error(`Method ${method} is absent on localforage instance.`)
      }
      if (!params) {
        throw Error(
          `Could not find params in localforage request for method ${method}`
        )
      }
      return instance[method](...params)
    },
    dispose: () => {},
  }
}
