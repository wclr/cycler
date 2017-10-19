import { ProxyOptions } from '../.'
import { Transformer, TransformOptions } from '.'

export const hotAcceptCode = () => {
  return `if (module.hot) {` +
    `module.hot.accept(function(err) {` +
    `err && console.error("Can not accept module: ", err)` +
    `});` +
    `}`
}

export const transformer: Transformer = (source: string, options) => {
  const proxyOptions: ProxyOptions = {
    debug: options.debug
  }
  const sourceIdentifier = options.sourceIdentifier
  const noHmr = source.match(/@(no-hmr|hmr-disabled)/)
  if (noHmr) {
    return source
  }
  if (!proxyOptions.debug) {
    const debugMatch = source.match(/@hmr-debug (\w*)/)
    if (debugMatch) {
      proxyOptions.debug = debugMatch[1] || true
    }
  }

  const regEx = /\nexports\.(\S*) = |\nexports() = |\nexport\s(\S*) = |\nexport (default) /g
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
          `_hmrProxy(${hmrName}, ${sourceIdentifier} + "${hmrName}_",` +
          ` ${JSON.stringify(proxyOptions)});\n`)
        return `\nvar ${hmrName} = `
      }
      return exportAssign
    })
  if (exportsToAdd.length) {
    const importFrom = options.importFrom || '@cycler/hmr'
    source = source.replace(/^("use strict";)?/, (whole) => {
      return whole +
        `\nvar _hmrProxy = require("${importFrom}").hmrProxy;\n`
    }) + '\n' + exportsToAdd.join('\n') + '\n'

    if (options.addHotAccept) {
      source = source + '\n' + hotAcceptCode() + '\n'
    }
  }
  return source
}
