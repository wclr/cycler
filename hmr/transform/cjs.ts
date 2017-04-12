import { ProxyOptions } from '../.'
import { Transformer, TransformOptions } from '.'

export const transformer: Transformer = (source: string, options) => {  
  const proxyOptions: ProxyOptions = {
    debug: options.debug
  }
  const sourceIdentifier = options.sourceIdentifier
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
  }
  return source
}
