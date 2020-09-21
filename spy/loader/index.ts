import webpack from 'webpack'
import qs from 'querystring'
import fs from 'fs'
// import { ProxyOptions } from '../.'
import { Transformer } from '../transform'

export type Module = {
  id: number | null
}

export type SupportedFormat = 'cjs'

export interface SpyLoaderOptions {
  onlyEnabled?: boolean
  importFrom?: string
  format?: SupportedFormat
}

export interface LoaderContext {
  _module: Module
  query: string | SpyLoaderOptions
  resourcePath: string
}
const transformedComment = '@cycler/spy transformed'
const transformedCommentRegExp = new RegExp(transformedComment)

export default function (this: LoaderContext, source: string) {
  const noSpy = !/@spy/.test(source) || /@spy-(disable|off)/.test(source)

  if (noSpy) {
    return source
  }

  let options: SpyLoaderOptions = {}
  if (typeof this.query === 'string') {
    const queryStr = this.query.slice(1)
    try {
      options = JSON.parse(queryStr)
    } catch (e) {
      options = qs.parse(queryStr)
    }
  } else {
    const queryObj: SpyLoaderOptions = this.query || {}
    options = { ...queryObj }
  }

  // Don't want to transform multiple times
  if (transformedCommentRegExp.test(source)) {
    return source
  }

  if (options.onlyEnabled && !/@spy-(enable|on)/.test(source)) {
    return source
  }

  const format = options.format || 'cjs'
  const transformer: Transformer = require('../transform/' + format).transformer

  source = `// ${transformedComment}\n` + source

  return transformer(source, {
    importFrom: options.importFrom,
    sourceIdentifier: 'module.id',
    resourcePath: this.resourcePath,
  })
}
