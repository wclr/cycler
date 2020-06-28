import * as webpack from 'webpack'
import * as qs from 'querystring'
import * as fs from 'fs'
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
  if (options.onlyEnabled && !source.match(/@(cycle-hmr|hmr-enabled)/)) {
    return source
  }

  const noHmr = source.match(/@(no-hmr|hmr-disabled)/)

  if (noHmr) {
    return source
  }
  const format = options.format || 'cjs'
  const transformer: Transformer = require('../transform/' + format).transformer

  const transformOptions = Object.assign(
    {
      sourceIdentifier: 'module.id',
      addHotAccept: true,
    },
    options
  )

  return transformer(source, transformOptions)
}
