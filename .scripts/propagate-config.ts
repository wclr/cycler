import { config } from '../config'
import * as fs from 'fs-extra'
import * as path from 'path'
import { run } from '@cycle/run'
import xs, { Stream } from 'xstream'
import flattenConcurrently from 'xstream/extra/flattenConcurrently'
import { pair, addCategory } from '../task/helpers'
import {
  FileSystemSource,
  FileSystemRequest,
  makeFileSystemDriver
} from '../fs';

import {
  makeLoggerDriver
} from '../logger';

import { getResponse } from '../fs/getResponse'

type PackageConfig = {
  description: string
}

type PackageManifest = {
  description: string,
  repository: string
}

const updatePackageJson = (json: PackageManifest, packageConfig: PackageConfig) => {
  return Object.assign({}, json, {
    description: packageConfig.description
  })
}

const propagateConfigSync = () => {
  config.packages.forEach(packageConfig => {
    const filePath = packageConfig.name + '/package.json'
    const json = fs.readJsonSync(filePath) as PackageManifest
    fs.writeJson(filePath, updatePackageJson(json, packageConfig))
    console.log(filePath, 'updated')
  })
}

const propagateConfigAsync = () => {
  config.packages.map(async (packageConfig) => {
    const filePath = packageConfig.name + '/package.json'
    const json = await getResponse({
      method: 'readJson', args: [filePath]
    }) as PackageManifest
    await getResponse({
      method: 'writeJson', args: [
        filePath, updatePackageJson(json, packageConfig)
      ]
    })
  })
}

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

propagateConfigRun()