import { Transformer, TransformOptions } from '../transform'
import * as fs from 'fs'

type Options = {
  testExportName: string,
  testFileName: string[]
  importFrom?: string
}

let options = {} as Options
const configFiles = ['.hmr', '.hmr.json', '.cycle-hmr', '.cycle-hmr.json']

configFiles.forEach((configFile) => {
  try {
    options = JSON.parse(fs.readFileSync(configFile, 'utf-8'))
  } catch (e) { }
})

const format = 'cjs'
const transformer = require('../transform/' + format)
  .transformer as Transformer

const originalJsHandler =
  require.extensions['.js'] as (m: NodeModule, filename: string) => any

const testFileName = (testers: string[], fileName: string) =>
  testers.map(tester => new RegExp(tester))
    .reduce((prev, tester) => prev || tester.test(fileName), false)

function registerExtension(
  ext: string,    
) {
  const old = require.extensions[ext] || originalJsHandler

  require.extensions[ext] = function (m: any, filename: string) {
    if (options.testFileName
      && !testFileName(options.testFileName, filename)) {
      return old(m, filename)
    }

    const _compile = m._compile

    m._compile = function (code: string, fileName: string) {
      const moduleId = fileName.replace(/\\/g, '/').replace(/\//g, '_')
      const transformed = transformer(code, {
        testExportName: options.testExportName,
        sourceIdentifier: `"${moduleId}"`,
        importFrom: options.importFrom
      })
      return _compile.call(this, transformed, fileName)
    }

    return old(m, filename)
  }
}

registerExtension('.js')
registerExtension('.ts')
