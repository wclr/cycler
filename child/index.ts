import * as cp from 'child_process'
import {
  makeTaskDriver, makeTaskSource,
  InputTaskSource, TaskRequest
} from '@cycler/task'
import xs, { Stream, MemoryStream } from 'xstream'
const execa = require('execa')
import { adapt } from '@cycle/run/lib/adapt'

export type ChildMode = 'exec' | 'file' | 'spawn' | 'execa' | 'shell'

export interface ExecRequestBase extends TaskRequest {
  sync?: boolean
  pipe?: boolean
  mode?: ChildMode
}

export interface ExecaResponse {
  stdout: string,
  stderr: string,
  code: number
  killed: boolean,
  failed: boolean,
  cmd: string,
  signal: string | null,
  timeOut: boolean
}

export interface ExecResponse {
  stdout: string,
  stderr: string,
  code: number
}

export type ChildResponse = ExecResponse | ExecaResponse

export interface ExecRequest extends ExecRequestBase {
  cmd: string,
  options?: cp.ExecOptions | cp.ExecSyncOptions
}

export interface ExecFileRequest extends ExecRequestBase {
  mode: 'file'
  cmd: string,
  options?: cp.ExecFileOptions
}

export interface ExecaRequest extends ExecRequestBase {
  mode: 'execa'
  file: string,
  args?: string[]
  options?: cp.SpawnOptions
}

export interface ShellRequest extends ExecRequestBase {
  mode: 'shell'
  cmd: string,
  options?: cp.SpawnOptions
}

export interface SpawnRequest extends ExecRequestBase {
  mode: 'spawn'
  file: string,
  args?: string[]
  options?: cp.SpawnOptions
}

export type ChildRequest = ExecRequest | SpawnRequest | ExecaRequest | ShellRequest

export type ChildRequestInput = ChildRequest | string

export interface ChildSource extends InputTaskSource<ChildRequestInput, ChildRequest, string> {
  stdout(catetory?: string): Stream<MemoryStream<string>>
  stderr(catetory?: string): Stream<MemoryStream<string>>
}

export interface ExecDriverOptions {

}

type ModeCommands = {
  async: (request: ChildRequest) => cp.ChildProcess
  sync: (request: ChildRequest) => any
}

const pipeChildProcess = (cp: cp.ChildProcess) => {
  cp.stdout.pipe(process.stdout)
  cp.stderr.pipe(process.stderr)
}

const modeCommands: {[key in ChildMode]: ModeCommands} = {
  exec: {
    sync: (r: ExecRequest) =>
      cp.execSync(r.cmd, r.options),
    async: (r: ExecRequest) =>
      cp.exec(r.cmd, r.options || {})
  },
  file: {
    sync: (r: ExecFileRequest) =>
      cp.execFileSync(r.cmd, r.options),
    async: (r: ExecFileRequest) =>
      cp.execFile(r.cmd, r.options || {})
  },
  spawn: {
    sync: (request: SpawnRequest) =>
      cp.spawnSync(request.file, request.options),
    async: (r: SpawnRequest) =>
      cp.spawn(r.file, r.args || [], r.options || {})
  },
  execa: {
    sync: (r: ExecaRequest) =>
      execa.sync(r.file, r.args || [], r.options),
    async: (r: ExecaRequest) =>
      execa(r.file, r.args || [], r.options)
  },
  shell: {
    sync: (r: ShellRequest) =>
      execa.shellSync(r.cmd, r.options),
    async: (r: ShellRequest) =>
      execa.shell(r.cmd, r.options)
  }
}

const determineMode = (request: ChildRequest): ChildMode => {
  return request.mode || 'exec'
}

export function makeChildDriver(options: ExecDriverOptions = {}) {
  return makeTaskDriver<ChildSource, ChildRequestInput, ChildRequest, ChildResponse, any>({
    normalizeRequest: (requestInput) => {
      if (typeof requestInput === 'string') {
        return <ExecRequest>{ cmd: requestInput }
      }
      return requestInput
    },
    getResponse: (request, cb, onDispose, response$: any) => {
      const mode = determineMode(request)
      const command = modeCommands[mode]
      const stdout$ = xs.createWithMemory<string>()
      const stderr$ = xs.createWithMemory<string>()

      response$.stdout = stdout$
      response$.stderr = stderr$

      if (request.sync) {
        try {
          const syncResult = command.sync(request)
          cb(null, syncResult)
        } catch (syncError) {
          console.log('@cycler/exec driver sync exeception')
          cb(syncError)
        }
        return
      } else {
        const child = command.async(request)
        const promise = new Promise((resolve, reject) => {
          let stdout = ''
          let stderr = ''

          if (child.stdout) {
            child.stdout.on('data', (data: string) => {
              stdout$.shamefullySendNext(data.toString())
              stdout += data.toString()
            })
          }

          if (child.stderr) {
            child.stderr.on('data', (data: string) => {
              stderr$.shamefullySendNext(data.toString())
              stderr += data.toString()
            })
          }
          child.on('close', (code: number) => {
            stdout$.shamefullySendComplete()
            stderr$.shamefullySendComplete()
            resolve({ stdout, stderr, code })
          })
          child.on('error', (err: Error) => {
            console.log('on error', 'error')
            stdout$.shamefullySendError(err)
            stderr$.shamefullySendError(err)
            reject(err)
          })
          if (request.pipe) {
            pipeChildProcess(child)
          }
        })
        if (typeof (child as any).then === 'function') {
          return child as any
        }
        return promise
      }
    },
    makeSource: (response$$, options) => {
      const source = makeTaskSource<ChildRequestInput, ChildRequest, ChildResponse>
        (response$$, options)
      return Object.assign(source, {
        stdout: (category?: string) =>
          xs.from(source.select(category))
            .map((r$: any) => r$.stdout),
        stderr: (category?: string) =>
          xs.from(source.select(category))
            .map((r$: any) => adapt(r$.stdout))
      })
    }
  })
}
