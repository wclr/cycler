import xs, { Stream } from 'xstream'
import { Telegraf, Context } from 'telegraf'
import { makeTaskDriver } from '@cycler/task'
import {
  LaunchWebhookOptions,
  LaunchPollingOptions,
} from 'telegraf/typings/telegraf'

import { TelegramOptions } from 'telegraf/typings/telegram'

export type TelegrafRequest = {
  ctx?: Context
  task: (bot: Telegraf<Context>) => Promise<any>
}

export type TelegrafSource = ReturnType<ReturnType<typeof makeTelegrafDriver>>

type Arguments<F extends (...x: any[]) => any> = F extends (
  ...x: infer A
) => any
  ? A
  : never

export const makeTelegrafDriver = ({
  token,
  telegram,
  username,
  webhook,
  polling,
  launch = true,
}: {
  launch?: boolean
  token: string
  telegram?: TelegramOptions
  username?: string
  polling?: LaunchPollingOptions
  webhook?: LaunchWebhookOptions
}) => {
  return (request$: Stream<TelegrafRequest>) => {
    const waitingUpdates: { [UpdateId: number]: () => void } = {}

    const bot = new Telegraf(token, {
      telegram,
      username,
    })
    const launchP = launch
      ? bot.launch({
          polling,
          webhook,
        })
      : new Promise(() => {})

    if (!launch && webhook) {
      const { port, host, tlsOptions, cb, hookPath = '/' } = webhook
      bot.startWebhook(hookPath, tlsOptions, port, host, cb)
    }

    const webhookReply = webhook && telegram?.webhookReply !== false

    const taskDriver = makeTaskDriver<TelegrafRequest, any>(r => {
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
                return new Promise(resolve => {
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
              .catch(e => {
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
