import {
  env, exit, log,
  firstArg as packageName,
  exec, execSilent,
  chdir,
  readJSON, copy, writeFile
} from './util'

const NPM_TOKEN = env.NPM_TOKEN

if (!packageName) {
  log('You need to provide package name')
  exit(1)
}

if (!NPM_TOKEN) {
  log('You need to have NPM_TOKEN env variable set.')
  exit(1)
}

exec(`yarn test ${packageName}`)

chdir(packageName)

const version = readJSON('package.json').version
let publishedVersions: string[] = []

try {
  publishedVersions =
    JSON.parse(
      execSilent(`npm show @cycler/${packageName} versions`)
        .replace(/'/g, '"')) as string[]
} catch (e) {
  const errorOutput = e.stderr.toString()
  if (/404 Not found/.test(errorOutput)) {
    log('Package yet not published.')
  } else {
    exit(1)
  }
}

if (publishedVersions.indexOf(version) >= 0) {
  log(`Version ${packageName}@${version} already published."`)
} else {
  writeFile('.npmrc', `//registry.npmjs.org/:_authToken=${NPM_TOKEN}`)
  copy('../.npmignore', '.npmignore')
  log(`Publishing ${packageName}@${version}..."`)
  exec('npm publish --access=public')
}
