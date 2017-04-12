import loader, { LoaderContext } from '../webpack'
import * as test from 'tape'

const context: LoaderContext = {
  _module: {
    id: 123
  },
  query: {
    testExportName: "^([A-Z]|default)",
    debug: 'info'
  }  
}

const importStr = `var _hmrProxy = require("@cycler/hmr").hmrProxy;`
const hotAccept = 'if (module.hot) {module.hot.accept(function(err) {err && console.error("Can not accept module: ", err)});}'
const proxyOptions = '{"debug":"info"}'

const samples = [{  
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
exports.SomeFunction = _hmrProxy(__hmr_SomeFunction, module.id + "__hmr_SomeFunction_", ${proxyOptions});
exports.OtherFunction = _hmrProxy(__hmr_OtherFunction, module.id + "__hmr_OtherFunction_", ${proxyOptions});
${hotAccept}
`
}, {  
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
`
},

]

samples.forEach((sample) => {
  test('webpack loader: ' + sample.name, (t) => {    
    const actual = loader.call(sample.context, sample.original)
    const expected = sample.tranformed
    const removeLineBreaks = (s: string) => s.replace(/\n+/g, '\n')
    t.is(removeLineBreaks(actual), removeLineBreaks(expected))
    t.end()
  })
})
