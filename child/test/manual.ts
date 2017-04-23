import * as test from 'tape'
import {
  makeChildDriver, ChildSource, ExecRequest
} from '..'

import { execSync } from 'child_process'
import { run } from '@cycle/run'
import xs, { Stream } from 'xstream'
import delay from 'xstream/extra/delay'
import flattenConcurrently from 'xstream/extra/flattenConcurrently'

type Sources = { exec: ChildSource }

const { of, merge, combine } = xs

test('Manual sync input: node shell', (t) => {
  run(({ exec }: Sources) => {
    return {
      result: exec.select().flatten(),
      exec: merge(
        of<ExecRequest>({
          cmd: 'node',
          sync: true,
          options: {
            stdio: [0, 1, 2]
          }
        })
      )
    }
  }, {
      result: (result$) => {
        result$.addListener({
          next: (syncResult: any) => {
            t.is(syncResult, null, 'returned result is null')
            t.end()
          },
          error: (e: any) => {
            console.log('result error', e)
          }
        })
      },
      exec: makeChildDriver()
    })
})