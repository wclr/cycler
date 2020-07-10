import loader, { LoaderContext } from '../webpack'
import test from 'tape'

const context: LoaderContext = {
  resourcePath:  '/path/to/this/file.js',
  _module: {
    id: 123,
  },
  query: {
    testExportName: '^([A-Z]|default)',
    debug: 'info',
  },
}

const importStr = `var _hmrProxy = require("@cycler/hmr").hmrProxy;`
const hotAccept =
  'if (module.hot) {module.hot.accept(function(err) {err && console.error("Can not accept module: ", err)});}'
const proxyOptions = '{"debug":"info"}'

const someFunctionExported = `_hmrProxy(__hmr_SomeFunction, module.id + "__hmr_SomeFunction_", ${proxyOptions})`
const defaultExported = `_hmrProxy(__hmr_default, module.id + "__hmr_default_", ${proxyOptions})`

const samples = [
  {
    name: 'transforms multiple exports',
    loader,
    context,
    original: `
exports.SomeFunction = function (_a) {
  x = 1
}
// some comment
exports.OtherFunction = function (_a) {
  x = 2
}

`,
    tranformed: `
${importStr}
var __hmr_SomeFunction = function (_a) {
  x = 1
}
// some comment
var __hmr_OtherFunction = function (_a) {
  x = 2
}
exports.SomeFunction = ${someFunctionExported};
exports.OtherFunction = _hmrProxy(__hmr_OtherFunction, module.id + "__hmr_OtherFunction_", ${proxyOptions});
${hotAccept}
`,
  },
  {
    name: 'uses  testExportName options',
    loader,
    context,
    original: `
exports.smallCaseFun = function (_a) {
  x = 2
}
`,
    tranformed: `
exports.smallCaseFun = function (_a) {
  x = 2
}
`,
  },

  {
    name: 'ES6 exports',
    loader,
    context,
    original: `
export let smallCaseFun = 'xxx'
export const SomeFunction = 'fun'

`,
    tranformed: `
${importStr}
export let smallCaseFun = 'xxx'

var __hmr_SomeFunction = 'fun'

export const SomeFunction = ${someFunctionExported};
${hotAccept}
`,
  },
  {
    name: 'ES6 default export',
    loader,
    context,
    original: `
export default = 'fun'

`,
    tranformed: `
${importStr}
var __hmr_default = 'fun'
export default = ${defaultExported};
${hotAccept}
`,
  },
  {
    name: 'skips exports',
    loader,
    context,
    original: `
export let smallCaseFun = 'xxx'

// @hmr-skip
export const SomeFunction = 'fun'

`,
    tranformed: `
export let smallCaseFun = 'xxx'

// @hmr-skip
export const SomeFunction = 'fun'

`,
  },
]

test('Webpack transform', (t) => {
  samples.forEach(sample => {
    t.test('webpack loader transform: ' + sample.name, t => {
      const actual = loader.call(sample.context, sample.original)
      const expected = sample.tranformed
      const removeLineBreaks = (s: string) => s.replace(/\n+/g, '\n')
      t.is(removeLineBreaks(actual), removeLineBreaks(expected))
      t.end()
    })
  })
})
