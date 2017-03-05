import { Stream } from 'xstream'
import { Router } from 'express'
import adapter from '@cycle/xstream-adapter'
import { StreamAdapter } from '@cycle/base'
import { LoggerDriverOptions, LoggerMessage } from './index'
import { makeLoggerDriver as _makeLoggerDriver } from './index'
export * from './index'

export function makeLoggerDriver(options?: LoggerDriverOptions) {
  return (message$: Stream<LoggerMessage>, runSA?: StreamAdapter) => {
    _makeLoggerDriver<any>(options)(message$, runSA || adapter)
  }  
}

export default makeLoggerDriver