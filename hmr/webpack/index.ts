import * as webpack from 'webpack'
import * as qs from 'querystring'
import * as fs from 'fs'
import { ProxyOptions } from '../.'
import { Transformer } from '../transform'

export type Module = {
  id: number | null
}

export type supportedFormat = 'cjs'

export interface LoaderOptions extends ProxyOptions {
  testExportName?: string,
  importFrom?: string,
  format?: supportedFormat
}

export interface LoaderContext {
  _module: Module
  query: string | LoaderOptions
}

const hotAcceptCode = () => {
  return `if (module.hot) {` +
    `module.hot.accept(function(err) {` +
    `err && console.error("Can not accept module: ", err)` +
    `});` +
    `}`
}

export default function (this: LoaderContext, source: string) {
  let options: LoaderOptions = {}
  if (typeof this.query === 'string') {
    let queryStr = this.query.slice(1)
    try {
      options = JSON.parse(queryStr)
    } catch (e) {
      options = qs.parse(queryStr)
    }
  } else {
    const queryObj: LoaderOptions = this.query || {}
    options = { ...queryObj }
  }

  const format = options.format || 'cjs'
  const transformer: Transformer =
    require('../transform/' + format).transformer

  const transformOptions = Object.assign({
    sourceIdentifier: 'module.id'
  }, options)

  let transformed = transformer(source, transformOptions)

  if (transformed !== source) {
    transformed = transformed + '\n' + hotAcceptCode() + '\n'
  }

  return transformed
}
