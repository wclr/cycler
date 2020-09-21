import xs, { Stream, MemoryStream } from 'xstream'
import { MainDOMSource, div } from '@cycle/dom'
import { collect, collectList, collectObj } from '../collect'
import isolate from '@cycle/isolate'

type Source = {
  isolateSource: <T extends Stream<any>>(_: Source, scope: any) => Source
  isolateSink: <T extends MemoryStream<any>>(_: T, scope: any) => T
}

type R = ReturnType<Source['isolateSink']>

const CompA = ({}: { some: Source; DOM: MainDOMSource }) => {
  return {
    DOM: xs.of(div()).remember(),
    some: xs.of<boolean>(true).remember(),
    num$: xs.of<number>(1),
  }
}

const CompB = ({}: { some: Source; DOM: MainDOMSource }) => {
  return {
    DOM: xs.of(div()),
    some: xs.of<boolean>(false),
    num$: xs.of<number>(1),
  }
}

declare const DOM: MainDOMSource

const some: Source = {
  isolateSource: (_) => _,
  isolateSink: (_) => _,
}

const collected = collect([CompA, isolate(CompB)], {
  DOM: 'combine',
  num$: 'merge',
  some: 'combine',
})({
  DOM,
  some,
})

const ICompA = isolate(CompA)

const iCompA = ICompA({ some, DOM })
const iCompASome = iCompA.some
const iCompADOM = iCompA.DOM

const collectedObj = collect(
  { CompA: isolate(CompA), CompB: isolate(CompB) },
  { num$: 'merge', some: 'combine', DOM: 'combine' }
)({ some, DOM })


const X = (s: { DOM: MainDOMSource }) => {
  return {
    DOM: xs.of(div()),
  }
}

const IsolatedX = isolate(X)
const ix =  IsolatedX({ DOM })
// now x.DOM  is Stream<VNode> instead of Stream<any>
const d2 = ix.DOM