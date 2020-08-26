import { execSync } from 'child_process'
import minimist from 'minimist'

// eslint-disable-next-line no-console
const log = console.log

const argv = minimist(process.argv.slice(2), { boolean: 'watch' })
const scope = argv._[0]

if (scope) {
  const runner = argv.watch
    ? 'ts-node-dev -T --prefer-ts-exts --respawn --deps'
    : 'ts-node -T --prefer-ts-exts'

  const mochaRun = `node_modules/mocha/bin/mocha  ${scope}/{,!(node_modules)/**}/test/**.test.ts`
  let cmd = `${scope}/test`
  if (['spy'].indexOf(scope) >= 0) {
    cmd = mochaRun
  }
  log('will run:', `pnpx ${runner} ${cmd}`)
  execSync(`pnpx ${runner} ${cmd}`, { stdio: 'inherit' })
}
