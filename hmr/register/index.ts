import { Transformer, TransformOptions } from '../transform'
import fs from 'fs'

export type Options = {
  testExportName?: string
  testFileName?: string[]
  importFrom?: string
  noHotAccept?: boolean
  debug?: string | boolean
}

const configFiles = ['.hmr', '.hmr.json', '.cycle-hmr', '.cycle-hmr.json']

export function register(options?: Options) {
  if (!options) {
    options = {}
    configFiles.forEach(configFile => {
      try {
        options = JSON.parse(fs.readFileSync(configFile, 'utf-8'))
      } catch (e) {}
    })

    if (options.debug) {
      const anyConsole = console as any
      const method =
        typeof anyConsole[options.debug as string] === 'function'
          ? (options.debug as string)
          : 'log'
      anyConsole[method]('Registred HMR options', options)
    }
  }

  const format = 'cjs'
  const transformer = require('../transform/' + format)
    .transformer as Transformer

  const originalJsHandler = require.extensions['.js'] as (
    m: NodeModule,
    filename: string
  ) => any

  const testFileName = (testers: string[], fileName: string) =>
    testers
      .map(tester => new RegExp(tester))
      .reduce((prev, tester) => prev || tester.test(fileName), false)

  function registerExtension(ext: string) {
    const old = require.extensions[ext] || originalJsHandler

    require.extensions[ext] = function (m: any, filename: string) {
      if (
        options!.testFileName &&
        !testFileName(options!.testFileName || [], filename)
      ) {
        return old(m, filename)
      }

      const _compile = m._compile

      m._compile = function (this: any, code: string, fileName: string) {
        const moduleId = fileName.replace(/\\/g, '/').replace(/\//g, '_')
        const transformed = transformer(code, {
          testExportName: options!.testExportName,
          sourceIdentifier: `"${moduleId}"`,
          addHotAccept: !options!.noHotAccept,
          importFrom: options!.importFrom,
          debug: options!.debug,
        })
        return _compile.call(this, transformed, fileName)
      }

      return old(m, filename)
    }
  }

  registerExtension('.js')
  registerExtension('.ts')
}

register()
