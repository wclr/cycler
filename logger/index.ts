import xs, { Stream, MemoryStream } from 'xstream'
export type LogRequest =
  | string
  | { args: any[] }
  | any[]
  | ((console: Console) => any)

export const makeLoggerDriver = () => {
  const logger = console
  return (request$: Stream<LogRequest>) => {
    request$.addListener({
      next: (r) => {
        if (typeof r === 'function') {
          r(logger)
          return
        }
        const args = typeof r === 'string' ? [r] : Array.isArray(r) ? r : r.args
        logger.log(...args)
      },
    })
  }
}
