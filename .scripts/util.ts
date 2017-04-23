import minimist = require('minimist')
import { execSync } from 'child_process'
import { copySync, readJSONSync, writeJSONSync } from 'fs-extra'
import { readdirSync, existsSync, writeFileSync } from 'fs'

export const env = process.env
export const exit = process.exit
export const chdir = process.chdir

export const log = console.log

export const exists = existsSync

export const copy = copySync
export const writeFile = writeFileSync
export const readJSON = readJSONSync
export const writeJSON = writeJSONSync

export const argv = minimist(process.argv.slice(2), { boolean: true })
export const firstArg = argv._[0]

export const exec = (cmd: string, cwd?: string) => execSync(cmd, { stdio: 'inherit', cwd })
export const execSilent = (cmd: string) => execSync(cmd).toString()

export function testPackage(packageName: string) {
  const mochaTestModule = packageName + '/test/mocha.js'
  const cwd = packageName + '/test'
  if (exists(mochaTestModule)) {
    const nodeCmd = 'yarn run mocha' + (argv.watch ? ' --watch' : '')
    log(`Starting mocha test in ${packageName}`)
    exec(nodeCmd + ' -r source-map-support/register mocha', cwd)
  }

  const testModule = packageName + '/test/test.js'
  const nodeDev = __dirname + '/../node_modules/.bin/node-dev'
  if (exists(testModule)) {
    const nodeCmd = argv.watch ? nodeDev + ' --poll --respawn' : 'node'
    log(`Starting test in ${packageName}`)
    exec(nodeCmd + ' -r source-map-support/register test', cwd)
  }
}

export const packages = readdirSync(__dirname + '/..')
  .filter(d => /^[a-z-]+$/.test(d))

export const installDeps = (packages: string[]) => {
  exec('yarn')
  packages.forEach(p => exec('yarn', __dirname + '/../' + p))
}