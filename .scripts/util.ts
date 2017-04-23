import minimist = require('minimist')
import { execSync } from 'child_process'
import { copySync, readJSONSync } from 'fs-extra'
import { existsSync, writeFileSync } from 'fs'

export const env = process.env
export const exit = process.exit
export const chdir = process.chdir

export const log = console.log

export const exists = existsSync

export const readJSON = readJSONSync
export const copy = copySync
export const writeFile = writeFileSync

export const argv = minimist(process.argv.slice(2), { boolean: true })
export const firstArg = argv._[0]

export const exec = (cmd: string, cwd?: string) => execSync(cmd, { stdio: 'inherit', cwd })
export const execSilent = (cmd: string) =>
  execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'] }).toString()

