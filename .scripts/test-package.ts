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

chdir(packageName)

const nodeCmd = argv.watch ? 'node-dev --poll --respawn' : 'node'

if (exists('test/test.js')) {
  log(`Starting test in ${packageName}`)
  exec(nodeCmd + ' -r source-map-support/register test/test.js')
}
