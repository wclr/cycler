import * as test from 'tape'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import { HmrEnabledDataflow } from '..'

const originalJsSource = `
exports.Dataflow = function (_a) {
  x = 1
}
// some comment
exports.something = function (_a) {
  x = 2
}
`

const jsFileName = 'cycler-hmr-test-' + '.js'
const jsFileDir = path.join(__dirname, 'tmp')
const jsFilePath = path.join(jsFileDir, jsFileName)
if (!fs.existsSync(jsFileDir)) {
  fs.mkdirSync(jsFileDir)
}
fs.writeFileSync(jsFilePath, originalJsSource)

test('register', t => {
  require('../register')
  const { Dataflow, something } = require(jsFilePath) as {
    Dataflow: HmrEnabledDataflow
    something: HmrEnabledDataflow
  }

  t.ok(Dataflow.__hmrOriginalDataflow, 'exported dataflow wrapped with hmr')
  t.ok(!something.__hmrOriginalDataflow, 'exported dataflow ignored')
  t.end()
})
