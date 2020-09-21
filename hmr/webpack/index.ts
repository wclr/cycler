import qs from 'querystring'
import { ProxyOptions } from '../.'
import { Transform } from '../transform'

export type Module = {
  id: number | null
}

export type SupportedFormat = 'cjs'

export interface HmrLoaderOptions extends ProxyOptions {
  testExportName?: string
  importFrom?: string
  format?: SupportedFormat
  onlyEnabled?: boolean
}

export interface LoaderContext {
  _module: Module
  query: string | HmrLoaderOptions
  resourcePath: string
}

export default function (this: LoaderContext, source: string) {
  let options: HmrLoaderOptions = {}
  if (typeof this.query === 'string') {
    const queryStr = this.query.slice(1)
    try {
      options = JSON.parse(queryStr)
    } catch (e) {
      options = qs.parse(queryStr)
    }
  } else {
    const queryObj: HmrLoaderOptions = this.query || {}
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
  const transform: Transform = require('../transform/' + format).transform

  const transformOptions = Object.assign(
    {
      sourceIdentifier: 'module.id',
      addHotAccept: true,
      resourcePath: this.resourcePath,
    },
    options
  )

  return transform(source, transformOptions)
}
