# @cycler/fs

> File system driver based on ['fs'](https://nodejs.org/api/fs.html) module and ['fs-extra'](https://github.com/jprichardson/node-fs-extra) package.

## Install

```
yarn add @cycler/fs 
```

`@cycler/task` is a peer dependency for this driver.

## Example

```ts
import { config } from '../config'
import { run } from '@cycle/run'
import xs, { Stream } from 'xstream'
import flattenConcurrently from 'xstream/extra/flattenConcurrently'
import { pair, addCategory } from '@cycler/task'
import {
  FileSystemSource,
  FileSystemRequest,
  makeFileSystemDriver
} from '@cycler/fs';
import {
  makeLoggerDriver
} from '@cycler/logger';


const PropagateConfig = ({ fs }: { fs: FileSystemSource }) => {
  return {
    fs: xs.merge(
      xs.from(config.packages).map(packageConfig => ({
        method: 'readJson',
        args: [packageConfig.name + '/package.json'],
        packageConfig
      })).map(addCategory('read')),

      fs.select<PackageManifest, { packageConfig: PackageConfig }>('read')
        .map(pair)
        .compose(flattenConcurrently)
        .map(([{ args: [filePath], packageConfig }, json]) =>
          [filePath, updatePackageJson(json, packageConfig)]
        ).map(args => ({ method: 'writeJson', args }))
        .map(addCategory('write')),
    ),
    log: fs.select('write').map(pair)
      .compose(flattenConcurrently)
      .map(([{ args: [filePath] }]) => `${filePath} updated`)
  }
}

const propagateConfigRun = () => {
  run(PropagateConfig, {
    fs: makeFileSystemDriver(),
    log: makeLoggerDriver()
  })
}

```

## Licence

WTF.