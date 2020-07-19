import webpack from 'webpack'
import qs from 'querystring'
import fs from 'fs'
import { ProxyOptions } from '../.'
import { Transformer } from '../transform'

export type Module = {
  id: number | null
}

export type SupportedFormat = 'cjs'

export interface LoaderOptions extends ProxyOptions {
  testExportName?: string
  importFrom?: string
  format?: SupportedFormat
  onlyEnabled?: boolean
}

export interface LoaderContext {
  _module: Module
  query: string | LoaderOptions
  resourcePath: string,
}

export default function (this: LoaderContext, source: string) {  
  let options: LoaderOptions = {}
  if (typeof this.query === 'string') {
    const queryStr = this.query.slice(1)
    try {
      options = JSON.parse(queryStr)
    } catch (e) {
      options = qs.parse(queryStr)
    }
  } else {
    const queryObj: LoaderOptions = this.query || {}
    options = { ...queryObj }
  }
  if (options.onlyEnabled && !/@hmr-(enable|on)/.test(source)) {
    return source
  }

  const noHmr = /@hmr-(disable|off)/.test(source)

  if (noHmr) {
    return source
  }
  const format = options.format || 'cjs'
  const transformer: Transformer = require('../transform/' + format).transformer

  const transformOptions = Object.assign(
    {
      sourceIdentifier: 'module.id',
      addHotAccept: true,
      resourcePath: this.resourcePath
    },
    options
  )

  return transformer(source, transformOptions)
}
