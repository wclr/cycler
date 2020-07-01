import { ProxyOptions } from '../.'
import { Transformer, TransformOptions } from '.'

export const hotAcceptCode = () => {
  return (
    `if (module.hot) {` +
    `module.hot.accept(function(err) {` +
    `err && console.error("Can not accept module: ", err)` +
    `});` +
    `}`
  )
}

export const transformer: Transformer = (source: string, options) => {
  const proxyOptions: ProxyOptions = {
    debug: options.debug,
  }
  const sourceIdentifier = options.sourceIdentifier

  if (!proxyOptions.debug) {
    const debugMatch = source.match(/@hmr-debug\s*(\w*)/)
    if (debugMatch) {
      proxyOptions.debug = debugMatch[1] || true
    }
  }

  //const regEx = /\nexport(?:s\.|\s(?:(?:var|let|const)\s)?)(\S*) = /g
  const regEx = /^export(?:s\.|\s(?:(?:var|let|const)\s)?)(\S*) = /
  const exportsToAdd: string[] = []
  const testExportName = options.testExportName
    ? new RegExp(options.testExportName)
    : null

  const getHmrHame = (name: string) => '__hmr_' + name

  const exportedNames: string[] = []

  const testOnly = (text: string) => /@hmr-only/.test(text)
  const testSkip = (text: string) => /@hmr-skip/.test(text)

  const containsOnlyExports = testOnly(source)
  const containsSkipExports = testSkip(source)

  source = source
    .split('\n')
    .map((line, i, sourceLines) => {
      const checkPrevLine = () => {
        const prevLine = sourceLines[i - 1] || ''
        if (containsOnlyExports && !testOnly(prevLine)) return false
        if (containsSkipExports && testSkip(prevLine)) return false
        return true
      }
      const replaceExport = (
        exportAssign: string,
        exportName: string
      ): string => {
        if (!checkPrevLine()) {
          return exportAssign
        }
        exportName = exportName || 'default'
        const validExportName =
          !testExportName || testExportName.test(exportName)
        if (validExportName) {
          const hmrName = getHmrHame(exportName)
          exportedNames.push(exportName)
          exportsToAdd.push(
            exportAssign +
              `_hmrProxy(${hmrName}, ${sourceIdentifier} + "${hmrName}_",` +
              ` ${JSON.stringify(proxyOptions)});\n`
          )
          return `var ${hmrName} = `
        }
        return exportAssign
      }
      return line.replace(regEx, replaceExport)
    })
    .join('\n')

  // source = source.replace(
  //   regEx,
  //   (exportAssign: string, exportName: string): string => {
  //     exportName = exportName || 'default'
  //     const validExportName = !testExportName || testExportName.test(exportName)
  //     if (validExportName) {
  //       const hmrName = getHmrHame(exportName)
  //       exportedNames.push(exportName)
  //       exportsToAdd.push(
  //         exportAssign +
  //           `_hmrProxy(${hmrName}, ${sourceIdentifier} + "${hmrName}_",` +
  //           ` ${JSON.stringify(proxyOptions)});\n`
  //       )
  //       return `\nvar ${hmrName} = `
  //     }
  //     return exportAssign
  //   }
  // )

  // // replace used cases of exported name in the source with new one
  // exportedNames.forEach(name => {
  //   const regEx = new RegExp(name + '\\s*(', 'g')
  //   source = source.replace(regEx, getHmrHame(name) + '(')
  // })

  if (exportsToAdd.length) {
    const importFrom = options.importFrom || '@cycler/hmr'
    source =
      source.replace(/^("use strict";)?/, whole => {
        return whole + `\nvar _hmrProxy = require("${importFrom}").hmrProxy;\n`
      }) +
      '\n' +
      exportsToAdd.join('\n') +
      '\n'

    if (options.addHotAccept) {
      source = source + '\n' + hotAcceptCode() + '\n'
    }
  }
  return source
}
