import xs, { Stream } from 'xstream'
import { Telegraf, Context } from 'telegraf'
import { makeTaskDriver } from '@cycler/task'
import {
  LaunchWebhookOptions,
  LaunchPollingOptions,
} from 'telegraf/typings/telegraf'
import crypto from 'crypto'

import { TelegramOptions } from 'telegraf/typings/telegram'

export type TelegrafRequest<T = any> = {
  ctx?: Context
  task: (bot: Telegraf<Context>) => Promise<T>
}

export type TelegrafSource = ReturnType<ReturnType<typeof makeTelegrafDriver>>

type Arguments<F extends (...x: any[]) => any> = F extends (
  ...x: infer A
) => any
  ? A
  : never

const enableTelegrafDebug = () => {
  const debug = require('debug')
  debug.enable('telegraf*')
}

const modWebhook = (
  webhook: LaunchWebhookOptions & { addRandomPath?: boolean }
): LaunchWebhookOptions => {
  const { addRandomPath, hookPath } = webhook || {}
  return {
    ...webhook,
    ...(addRandomPath && typeof hookPath === 'string'
      ? {
          hookPath:
            hookPath.replace(/\/$/, '') +
            '/' +
            crypto.randomBytes(32).toString('hex'),
        }
      : {}),
  }
}

export const makeTelegrafDriver = ({
  token,
  telegram,
  username,
  webhook,
  polling,
  debug,
  launch = true,
}: {
  launch?: boolean
  token: string
  telegram?: TelegramOptions
  username?: string
  debug?: boolean
  polling?: LaunchPollingOptions
  webhook?: LaunchWebhookOptions & { addRandomPath?: boolean }
}) => {
  if (debug) {
    enableTelegrafDebug()
  }

  return (request$: Stream<TelegrafRequest>) => {
    const waitingUpdates: { [UpdateId: number]: () => void } = {}

    const bot = new Telegraf(token, {
      telegram,
      username,
    })
    const launchP = launch
      ? bot.launch({
          polling,
          webhook: webhook && modWebhook(webhook),
        })
      : new Promise(() => {})

    if (!launch && webhook) {
      const { port, host, tlsOptions, cb, hookPath = '/' } = modWebhook(webhook)
      bot.startWebhook(hookPath, tlsOptions, port, host, cb)
    }

    const webhookReply = webhook && telegram?.webhookReply !== false

    const taskDriver = makeTaskDriver<TelegrafRequest, unknown, unknown>((r) => {
      return r.task(bot).finally(() => {
        const id = r.ctx && r.ctx.update.update_id
        const resolveWaiting = id && waitingUpdates[id]

        if (id && resolveWaiting) {
          resolveWaiting()
          waitingUpdates[id]
        }
      })
    })

    const turnMethod = <M extends 'action' | 'command' | 'on'>(method: M) => {
      return (
        event: Arguments<typeof bot[M]>[0],
        opts: { waitForTask?: boolean } = {}
      ) => {
        return xs.create<Context>({
          start(listener) {
            //console.log('start listen action', event)

            bot[method](event as any, (ctx, next) => {
              listener.next(ctx)
              next()

              if (webhookReply) {
                return new Promise((resolve) => {
                  if (opts.waitForTask) {
                    const id = ctx.update.update_id
                    const existingResolve = waitingUpdates[id]
                    waitingUpdates[id] = () => {
                      existingResolve && existingResolve()
                      resolve()
                    }
                  } else {
                    setTimeout(() => {
                      resolve()
                    }, 0)
                  }
                })
              }
              return
            })
          },
          // maybe we should remove/disable middleware on stop
          // https://github.com/telegraf/telegraf/issues/658
          stop() {},
        })
      }
    }
    const source = {
      task: taskDriver(request$),
      action: turnMethod('action'),
      on: turnMethod('on'),
      command: turnMethod('command'),
      started: () => {
        return xs.createWithMemory({
          start(listener) {
            launchP
              .then(() => {
                listener.next(bot)
              })
              .catch((e) => {
                listener.error(e)
              })
          },
          stop() {},
        })
      },
    }
    ;(source as any).dispose = () => {
      bot.stop()
    }
    return source
  }
}
