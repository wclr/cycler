import * as test from 'tape'
import {
  makeChildDriver,
  ChildSource,
  ExecResponse,
  ExecRequest, SpawnRequest, ChildRequest
} from '..'
import { run } from '@cycle/run'
import xs, { Stream } from 'xstream'
import delay from 'xstream/extra/delay'
import flattenConcurrently from 'xstream/extra/flattenConcurrently'

type Sources = { child: ChildSource }

const { of, merge, combine } = xs

const pipeOptions = {
  stdio: [0, 1, 2]
}

test('A and B parallel execute', (t) => {
  run(({ child }: Sources) => {
    return {
      stdout: child
        .stdout('A')
        .take(2)
        .compose(flattenConcurrently)
        .map(x => x.trim())
        .fold((x, y) => x + y, '')
        .last(),
      child: merge<ChildRequest>(
        of<SpawnRequest>({
          mode: 'spawn',
          file: 'node',
          args: ['output', 'A'],
          pipe: true,
          options: {
            cwd: __dirname
          },
          category: 'A'
        }),
        of<ExecRequest>({
          cmd: 'node output B',
          pipe: true,
          options: {
            cwd: __dirname
          },
          category: 'A'
        }),
        of<ExecRequest>({
          cmd: 'node output C',
          pipe: true,
          options: {
            cwd: __dirname
          },
          category: 'C'
        })
      )
    }
  }, {
      stdout: (stdout$: Stream<string>) => {
        stdout$.addListener({
          next: (data) => {
            t.is(data.length, 6)
            t.ok(/A.*B/.test(data))
            t.end()
          }
        })
      },
      child: makeChildDriver()
    })
})

test('Handle error', (t) => {
  makeChildDriver()(of({
    cmd: `node throws`,
    options: {
      cwd: __dirname
    }
  })).select<ExecResponse>().flatten().addListener({
    next: (res) => {
      t.is(res.code, 1)
      t.end()
    }
  })
})