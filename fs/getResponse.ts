import { FileSystemRequest } from '.'
const fs = require('fs-extra')
import * as f from 'fs'
f.accessSync
const isFunction = (x: any) => typeof x === 'function'

export const getResponse = (request: FileSystemRequest) =>
  new Promise((resolve, reject) => {
    const callback = (err: any, res: any) =>
      err ? reject(err) : resolve(res)
    if (isFunction(fs[request.method])) {
      fs[request.method].apply(fs, request.args.concat(callback))
    } else {
      throw new Error(`Illegal fs method '{request.method}'`)
    }
  })
