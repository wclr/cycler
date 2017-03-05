import { Observable } from 'rx'
import { Router } from 'express'
import adapter from '@cycle/rx-adapter'
import { StreamAdapter } from '@cycle/base'
import { LoggerDriverOptions, LoggerMessage } from './index'
import { makeLoggerDriver as _makeLoggerDriver } from './index'
export * from './index'

export function makeLoggerDriver(options?: LoggerDriverOptions) {
  return (message$: Observable<LoggerMessage>, runSA?: StreamAdapter) => {
    _makeLoggerDriver<any>(options)(message$, runSA || adapter)
  }  
}

export default makeLoggerDriver