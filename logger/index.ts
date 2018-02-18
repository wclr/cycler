import { Stream } from 'xstream'

export type LogParams = any[]

export type LogMessageRequest = {
  method: string
  params?: LogParams
}

export type LoggerMessage = string | LogMessageRequest | LogParams

export interface LoggerDriverOptions {
  logger?: Object
}

const normalizeMessage = (m: LoggerMessage, logger: any): LogMessageRequest => {
  if (Array.isArray(m)) {
    return { method: 'log', params: m }
  } else {
    const request = m as LogMessageRequest
    if (request && typeof request.method === 'string' && request.params) {
      return request
    }
    return { method: 'log', params: [m] }
  }
}

export const makeLoggerDriver =
  (options: LoggerDriverOptions = {}) => {
    const logger: any = options.logger || console
    return (message$: Stream<LoggerMessage>) => {
      message$.addListener({
        next: (m) => {
          m = normalizeMessage(m, logger)
          if (typeof logger[m.method] !== 'function') {
            throw new Error(`Illegal method on logger \`${m.method}\``)
          }
          logger[m.method].apply(logger, m.params)
        }
      })
    }
  }
