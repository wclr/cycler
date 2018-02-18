import { Stream, MemoryStream } from 'xstream';

export interface EventsFnOptions {
  useCapture?: boolean;
  preventDefault?: boolean;
}

export type MouseEventType = 'mousedown' | 'mouseup' | 'mousemove' |
  'click' | 'dblclick' | 'mouseover' |
  'mouseout' | 'mouseenter' | 'mouseleave' | 'contextmenu'

export interface DOMSource {
  select<S extends DOMSource>(selector: string): S;
  elements<DOMElement = Document | Element | Array<Element> | string>
    (): MemoryStream<DOMElement>;  
  events<DOMEvent = MouseEvent>
    (eventType: MouseEventType, options?: EventsFnOptions): Stream<DOMEvent>;
  events<DOMEvent = Event>
    (eventType: string, options?: EventsFnOptions): Stream<DOMEvent>;
}

// export {thunk, Thunk, ThunkData} from '@cycle/dom/lib/thunk';
// export {VNode, VNodeData} from 'snabbdom/vnode';
// export {MainDOMSource} from '@cycle/dom/lib/MainDOMSource';
// export { makeDOMDriver, DOMDriverOptions } from '@cycle/dom/lib/makeDOMDriver';

export * from './helpers'
