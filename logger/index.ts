import { Stream } from 'xstream'

export type LogParams = any[]

export type ObjectLoggerMessage = {
  method: string
  message?: string
  params?: LogParams
}

export type LoggerMessage = string | ObjectLoggerMessage | {
  log: LogParams
} | {
    warn: LogParams
  } | {
    error: LogParams
  } | {
    info: LogParams
  } | {
    dir: LogParams
  } | LogParams

export interface LoggerDriverOptions {
  logger?: Object
}

let normalizeMessage = (m: LoggerMessage, logger: any): ObjectLoggerMessage => {
  if (typeof m === 'string') {
    return { method: 'log', message: m }
  }
  if (Array.isArray(m)) {
    return { method: 'log', params: m }
  }
  if (!(<any>m).method) {
    let method: string = Object.keys(m).reduce(
      (found: string, key: string) =>
        found || (typeof logger[key] === 'function' && key) || ''
      , '')
    if (!method) {
      throw Error(`Method not found on logger`)
    }
    return { method: method, params: <LogParams>((<any>m)[method]) }
  }
  return <ObjectLoggerMessage>m
}

export const makeLoggerDriver =
  (options: LoggerDriverOptions = {}) => {
    let logger: any = options.logger || console
    return (message$: Stream<LoggerMessage>) => {
      message$.addListener({
        next: (m) => {
          m = normalizeMessage(m, logger)
          logger[m.method].apply(
            logger, (m.message ? [m.message] : []).concat(m.params || []))
        }
      })
    }
  }
