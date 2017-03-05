import { StreamAdapter } from '@cycle/base'

export type LogParams = any[] 

export type NormalizedLoggerMessage =  {
  method: string
  message?: string
  params?: LogParams
}

export type LoggerMessage = string | NormalizedLoggerMessage | {
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

let normalizeMessage = (m: LoggerMessage, logger: any): NormalizedLoggerMessage => {
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
  return <NormalizedLoggerMessage>m
} 

export const makeLoggerDriver = <LoggerStream>
  (options: LoggerDriverOptions = {}) => {
  let logger: any = options.logger || console
  return (message$: LoggerStream, runSA: StreamAdapter) => {
    runSA.streamSubscribe<LoggerMessage>(message$, {
      next: (m) => {        
        m = normalizeMessage(m, logger)        
        logger[m.method].apply(
          logger, (m.message ? [m.message] : []).concat(m.params || []))
      },
      error: () => { },
      complete: () => { },
    })
  }
}
