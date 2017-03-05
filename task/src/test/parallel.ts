import { makeTaskDriver } from '../index'
import { TaskSource } from '../rx'
import Parallel from '../parallel/rx'
import { Observable } from 'rx'
import { run } from '@cycle/rx-run'
import * as test from 'tape'

let taskDriver = makeTaskDriver<string | { num: string }, { num: string }, number, number>
  ({
    getResponse: (request, callback) => {
      let timeScale = 1
      let num = parseInt(request.num)
      let isOdd = num % 2
      let randomDelay = Math.random() * 100 * timeScale
      let delay = isOdd ? randomDelay : randomDelay + 50 * timeScale
      setTimeout(() => {
        isOdd ? callback(null, num) : callback(-num)
      }, delay)
    },
    normalizeRequest: (num: string | { num: string }) =>
      typeof num === 'string' ? { num } : num
  })

const tasksOdd = ['1', '3', '5', '7', '9', '11']
const tasksWithEven = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '11']
const resultsWithFirstError = [1, -2,
  undefined, undefined, undefined, undefined, undefined, undefined]
const firstErrorIndex = 1
const firstError = [firstErrorIndex]
const resultsWithErrors = [1, -2, 3, -4, 5, -6, 7, -8, 9, 11]
const allErrorsIndexes = [1, 3, 5, 7]

type ResultsAndErrors = [number[], number[]]
type Tester = (t: test.Test) =>
  (combined: ResultsAndErrors) => void

const testSuccessful: Tester = (t) =>
  ([results, errors]) => {
    t.deepEqual(results, tasksOdd.map(x => parseInt(x)), 'results correct')
    t.deepEqual(errors, [], 'errors correct')
    t.end()
  }

const testParallelFirstError: Tester = (t: test.Test) =>
  ([results, errors]) => {
    t.is(errors.length, 1, 'got one item in errors')
    t.is(results.filter(x => x < 0).length, 1, 'got only one error in the results')
    t.ok(allErrorsIndexes.indexOf(errors[0]) >= 0, 'error value in the results is correct')
    //console.log('hm', errors[0], resultsWithErrors[errors[0]], results)  
    t.end()
  }

const testSequenceFirstError: Tester = (t: test.Test) =>
  ([results, errors]) => {
    t.deepEqual(results, resultsWithFirstError, 'results correct')
    t.deepEqual(errors, firstError, 'errors correct')
    t.end()
  }

const testParallelIgnoreErrors: Tester = (t: test.Test) =>
  ([results, errors]) => {
    t.deepEqual(results, resultsWithErrors, 'results correct')
    t.deepEqual(errors.sort(), allErrorsIndexes, 'errors correct')
    t.end()
  }

const testSequenceIgnoreErrors: Tester = (t) => ([results, errors]) => {  
  t.deepEqual(results, resultsWithErrors, 'results correct')
  t.deepEqual(errors.sort(), allErrorsIndexes, 'errors correct')
  t.end()
}
type Sources = {taskSource: TaskSource<string, number>}

test('Rx/Parallel successful', (t) => {
  function Main({taskSource}: Sources) {
    
    let [request$, results$, errors$] =
      Parallel(taskSource, tasksOdd)

    Observable.combineLatest(results$, errors$)
      .subscribe(testSuccessful(t))
    return {
      taskSource: request$
    }
  }
  run(Main, {
    taskSource: taskDriver
  })
})
//let source1 = taskDriver(Observable.of({name: 'Alex'}), )
let source: TaskSource<any, any> = {
  filter: () => source,
  select: () => {
    let r$ = <Observable<number> & { request: number }>Observable.of(1)
    return Observable.of(
      r$
    )
  }
}
test('Rx/Parallel until first error', (t) => {
  function Main({taskSource}: Sources) {
    let [request$, results$, errors$] =
      Parallel(taskSource, tasksWithEven)

    Observable.combineLatest([results$, errors$])
      //.do(x => console.log('combined', x))
      //.subscribe()
      .subscribe(testParallelFirstError(t))
    return {
      taskSource: request$
    }
  }
  run(Main, {
    taskSource: taskDriver
  })
})

test('Rx/Parallel ignore errors', (t) => {
  function Main({taskSource}: Sources) {
    let [request$, results$, errors$] =
      Parallel(taskSource, tasksWithEven, { ignoreErrors: true })

    Observable.combineLatest(results$, errors$)
      .subscribe(testParallelIgnoreErrors(t))

    return {
      taskSource: request$
    }
  }
  run(Main, {
    taskSource: taskDriver
  })
})
