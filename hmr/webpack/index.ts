import * as webpack from 'webpack'
import * as qs from 'querystring'
import * as fs from 'fs'
import { ProxyOptions } from '../.'

export type Module = {
  id: number | null
}

export type supportedFormat = 'cjs'

export interface LoaderOptions extends ProxyOptions {
  testExportName?: string,
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
  const proxyOptions: ProxyOptions = {
    debug: options.debug
  }
  if (!proxyOptions.debug) {
    var debugMatch = source.match(/@hmr-debug (\w*)/)
    if (debugMatch) {
      proxyOptions.debug = debugMatch[1] || true
    }
  }

  const regEx = /\nexports\.(\S*) = |\nexports() = /g
  const exportsToAdd: string[] = []
  const testExportName = options.testExportName
    ? new RegExp(options.testExportName) : null
  
  source = source.replace(regEx,
    (exportAssign: string, exportName: string): string => {
      exportName = exportName || 'default'
      const validExportName = !testExportName || testExportName.test(exportName)
      if (validExportName) {
        const hmrName = '__hmr_' + exportName
        exportsToAdd.push(exportAssign +
          `_hmrProxy(${hmrName}, module.id + "${hmrName}_", ${JSON.stringify(proxyOptions)});\n`)
        return `\nvar ${hmrName} = `
      }
      return exportAssign
    })
  if (exportsToAdd.length) {
    const importFrom = '@cycler/hmr'
    source = source.replace(/^("use strict";)?/, (whole) => {
      return whole +
        `\nvar _hmrProxy = require("${importFrom}").hmrProxy;\n`
    }) + '\n' + exportsToAdd.join('\n') + '\n' + hotAcceptCode() + '\n'
  }
  return source
}
