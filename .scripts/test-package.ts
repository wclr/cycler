#!/bin/node
import {
  exit, chdir, log,
  exists, exec,
  firstArg as packageName,
  argv
} from './util'

if (!packageName) {
  log('Need package name')
  exit(1)
}

const mochaTestModule = packageName + '/test/mocha.js'
const cwd = packageName + '/test'
if (exists(mochaTestModule)) {
  const nodeCmd = 'yarn run mocha' + (argv.watch ? ' --watch' : '')
  log(`Starting mocha test in ${packageName}`)
  exec(nodeCmd + ' -r source-map-support/register mocha', cwd)
}

const testModule = packageName + '/test/test.js'
if (exists(testModule)) {
  const nodeCmd = argv.watch ? 'node-dev --poll --respawn' : 'node'
  log(`Starting test in ${packageName}`)
  exec(nodeCmd + ' -r source-map-support/register test', cwd)
}
