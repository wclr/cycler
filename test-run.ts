import { execSync } from 'child_process'
import * as minimist from 'minimist'

const argv = minimist(process.argv.slice(2), { boolean: 'watch' })
const scope = argv._[0]
console.log('argv', argv, scope)

if (scope) {
  const runner = argv.watch
    ? 'ts-node-dev --respawn --prefer-ts'
    : 'ts-node --prefer-ts-exts'

  execSync(`yarn ${runner}  ${scope}/test`, { stdio: 'inherit' })
}