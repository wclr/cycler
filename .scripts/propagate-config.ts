// this is exeprimental script for assessing some driver's features

import { config } from '../config'
import * as fs from 'fs'
import * as path from 'path'
import { run } from '@cycle/run'
import isolate from '@cycle/isolate'
import xs, { Stream } from 'xstream'
import flattenConcurrently from 'xstream/extra/flattenConcurrently'
import { TaskSource, InputTaskSource } from '../task'
import { pair, setCategory, makeLazy } from '../task/helpers'
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
    const json = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as PackageManifest
    fs.writeFileSync(filePath, JSON.stringify(updatePackageJson(json, packageConfig), null, 2))
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
      })).map(setCategory('read')),

      fs.select<PackageManifest, { packageConfig: PackageConfig }>('read')
        .map(pair)
        .compose(flattenConcurrently)
        .map(([{ args: [filePath], packageConfig }, json]) =>
          [filePath, updatePackageJson(json, packageConfig)]
        ).map(args => ({ method: 'writeJson', args }))
        .map(setCategory('write')),
    ),
    log: fs.select('write').map(pair)
      .compose(flattenConcurrently)
      .map(([{ args: [filePath] }]) => `${filePath} updated`)
  }
}

const { from, merge } = xs

const PropagateConfig2 = ({ fs }: { fs: FileSystemSource }) => {

  return {
    fs: from(config.packages).map(packageConfig => ({
      method: 'readJSON',
      args: [packageConfig.name + '/package.json'],
      packageConfig
    })).map(request =>
      fs.pull<PackageManifest, { packageConfig: PackageConfig }>(request)
      ).map(pair)
      .compose(flattenConcurrently)
      .map(([{ args: [filePath], packageConfig }, json]) =>
        [filePath, updatePackageJson(json, packageConfig)]
      ).map(args => ({ method: 'writeJSON', args })),

    log: fs.select().map(pair)
      .compose(flattenConcurrently)
      .map(([{ args: [filePath] }]) => `${filePath} updated`)
  }
}


function pull<Res, Req>(request$: Stream<Req>) {
  return function <Request, Response>(source: TaskSource<Request, Response>) {
    const df = ({ source }: { source: TaskSource<Request, Response> }) => {
      return {
        response$: source.select<Res, Req>(),
        request$
      }
    }
    const isolated = (isolate(df) as typeof df)({ source })
    return {
      response$: isolated.response$,
      request$: isolated.request$.map(makeLazy)
    }
  }
}

const PropagateConfig3 = ({ fs }: { fs: FileSystemSource }) => {
  const read = pull<PackageManifest, { packageConfig: PackageConfig }>
    (from(config.packages).map(packageConfig => ({
      method: 'readJSON',
      args: [packageConfig.name + '/package.json'],
      packageConfig
    })))(fs)

  const write = pull(read.response$.map(pair)
    .compose(flattenConcurrently)
    .map(([{ args: [filePath], packageConfig }, json]) =>
      [filePath, updatePackageJson(json, packageConfig)]
    ).map(args => ({ method: 'writeJson', args })))(fs)

  return {
    fs: merge(
      read.request$,
      write.request$,
    ),
    log: write.response$.map(pair)
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
