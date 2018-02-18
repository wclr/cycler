import { h } from 'snabbdom/h';
import { VNode, VNodeData as _VNodeData } from 'snabbdom/vnode'
import { Hooks } from 'snabbdom/hooks'
import hh, {
  SVGHelperFn
} from '@cycle/dom/lib/hyperscript-helpers';
import * as props from './HtmlProperties'
import { HtmlTagName, SvgTagName } from './HtmlTagNames'

// fixed VNodeStyle
// https://github.com/snabbdom/snabbdom/commit/4adbd971cba738c38d6158b38fdb81a6509d1553
// export interface VNodeStyle {
//   delayed?: { [prop: string]: string }
//   remove?: { [prop: string]: string }
//   [prop: string]: string | {
//     [prop: string]: string
//   } | undefined
// }

export type VNodeStyle = {  
  delayed?: { [prop: string]: string };
  remove?: { [prop: string]: string };
  [prop: string]: string | {
    [prop: string]: string
  } | undefined
}

const st: VNodeStyle = {

}

export interface VNodeData<Props> extends _VNodeData {
  props?: Props
}

export { h } from 'snabbdom/h'
export { VNode } from 'snabbdom/vnode'

export type HyperScriptChildren =
  string |
  number |
  Array<string | VNode | null> |
  ReadonlyArray<string | VNode | null>;

export interface HyperScriptHelperFn
  <T extends Element = Element, Props = any> {
  (): VNode;
  (selector: string, data: VNodeData<Props>, children: HyperScriptChildren): VNode;
  (selector: string, data: VNodeData<Props>): VNode;
  (selector: string, children: HyperScriptChildren): VNode;
  (selector: string): VNode;
  (data: VNodeData<Props>): VNode;
  (data: VNodeData<Props>, children: HyperScriptChildren): VNode;
  (children: HyperScriptChildren): VNode;
}

function tagHelper
  <Element extends HTMLElement | SVGElement = HTMLElement, Props = any>
  (tagName: HtmlTagName | SvgTagName): HyperScriptHelperFn<Element, Props> {
  return function (...args: any[]): VNode {
    if ((typeof args[0] !== 'string')) {
      args.unshift('')
    }
    args[0] = tagName + args[0]
    return h.apply(h, args)
  }
}

function svgTagHelper
  <Element extends SVGElement = SVGElement, Props = any>
  (tagName: SvgTagName) {
  return tagHelper<Element, Props>(tagName)
}

export type HtmlTags = {
  input: [HTMLInputElement, props.HTMLInputElementProperties]
}


function tagHelperT
  <T extends keyof HtmlTags>(tagName: T):
  HyperScriptHelperFn<HtmlTags[T][0], HtmlTags[T][1]> {
  return tagHelper(tagName)
}

// const tags: {[T in keyof HtmlTags]: HyperScriptHelperFn<HtmlTags[T][0], HtmlTags[T][1]>} = {

// } as any



export const a = tagHelper<HTMLAnchorElement, props.HTMLAnchorElementProperties>('a');
export const abbr = tagHelper('abbr')
export const acronym = tagHelper('acronym')
export const address = tagHelper('address')
export const applet = tagHelper('applet')
export const area = tagHelper('area')
export const article = tagHelper('article')
export const aside = tagHelper('aside')
export const audio = tagHelper('audio')
export const b = tagHelper('b')
export const base = tagHelper('base')
export const basefont = tagHelper('basefont')
export const bdi = tagHelper('bdi')
export const bdo = tagHelper('bdo')
export const bgsound = tagHelper('bgsound')
export const big = tagHelper('big')
export const blink = tagHelper('blink')
export const blockquote = tagHelper('blockquote')
export const body = tagHelper('body')
export const br = tagHelper('br')
export const button = tagHelper('button')
export const canvas = tagHelper('canvas')
export const caption = tagHelper('caption')
export const center = tagHelper('center')
export const cite = tagHelper('cite')
export const code = tagHelper('code')
export const col = tagHelper('col')
export const colgroup = tagHelper('colgroup')
export const command = tagHelper('command')
export const content = tagHelper('content')
export const data = tagHelper('data')
export const datalist = tagHelper('datalist')
export const dd = tagHelper('dd')
export const del = tagHelper('del')
export const details = tagHelper('details')
export const dfn = tagHelper('dfn')
export const dialog = tagHelper('dialog')
export const dir = tagHelper('dir')
export const div = tagHelper('div')
export const dl = tagHelper('dl')
export const dt = tagHelper('dt')
export const element = tagHelper('element')
export const em = tagHelper('em')
export const embed = tagHelper('embed')
export const fieldset = tagHelper('fieldset')
export const figcaption = tagHelper('figcaption')
export const figure = tagHelper('figure')
export const font = tagHelper('font')
export const footer = tagHelper('footer')
export const form = tagHelper('form')
export const frame = tagHelper('frame')
export const frameset = tagHelper('frameset')
export const h1 = tagHelper('h1')
export const h2 = tagHelper('h2')
export const h3 = tagHelper('h3')
export const h4 = tagHelper('h4')
export const h5 = tagHelper('h5')
export const h6 = tagHelper('h6')
export const head = tagHelper('head')
export const header = tagHelper('header')
export const hgroup = tagHelper('hgroup')
export const hr = tagHelper('hr')
export const html = tagHelper('html')
export const i = tagHelper('i')
export const iframe = tagHelper('iframe')
export const image = tagHelper('image')
export const img = tagHelper('img')
export const input = tagHelperT('input')
export const ins = tagHelper('ins')
export const isindex = tagHelper('isindex')
export const kbd = tagHelper('kbd')
export const keygen = tagHelper('keygen')
export const label = tagHelper('label')
export const legend = tagHelper('legend')
export const li = tagHelper('li')
export const link = tagHelper('link')
export const listing = tagHelper('listing')
export const main = tagHelper('main')
export const map = tagHelper('map')
export const mark = tagHelper('mark')
export const marquee = tagHelper('marquee')
export const math = tagHelper('math')
export const menu = tagHelper('menu')
export const menuitem = tagHelper('menuitem')
export const meta = tagHelper('meta')
export const meter = tagHelper('meter')
export const multicol = tagHelper('multicol')
export const nav = tagHelper('nav')
export const nextid = tagHelper('nextid')
export const nobr = tagHelper('nobr')
export const noembed = tagHelper('noembed')
export const noframes = tagHelper('noframes')
export const noscript = tagHelper('noscript')
export const object = tagHelper('object')
export const ol = tagHelper('ol')
export const optgroup = tagHelper('optgroup')
export const option = tagHelper('option')
export const output = tagHelper('output')
export const p = tagHelper('p')
export const param = tagHelper('param')
export const picture = tagHelper('picture')
export const plaintext = tagHelper('plaintext')
export const pre = tagHelper('pre')
export const progress = tagHelper('progress')
export const q = tagHelper('q')
export const rb = tagHelper('rb')
export const rbc = tagHelper('rbc')
export const rp = tagHelper('rp')
export const rt = tagHelper('rt')
export const rtc = tagHelper('rtc')
export const ruby = tagHelper('ruby')
export const s = tagHelper('s')
export const samp = tagHelper('samp')
export const script = tagHelper('script')
export const section = tagHelper('section')
export const select = tagHelper('select')
export const shadow = tagHelper('shadow')
export const small = tagHelper('small')
export const source = tagHelper('source')
export const spacer = tagHelper('spacer')
export const span = tagHelper('span')
export const strike = tagHelper('strike')
export const strong = tagHelper('strong')
export const style = tagHelper('style')
export const sub = tagHelper('sub')
export const summary = tagHelper('summary')
export const sup = tagHelper('sup')
export const table = tagHelper('table')
export const tbody = tagHelper('tbody')
export const td = tagHelper('td')
export const template = tagHelper('template')
export const textarea = tagHelper('textarea')
export const tfoot = tagHelper('tfoot')
export const th = tagHelper('th')
export const thead = tagHelper('thead')
export const time = tagHelper('time')
export const title = tagHelper('title')
export const tr = tagHelper('tr')
export const track = tagHelper('track')
export const tt = tagHelper('tt')
export const u = tagHelper('u')
export const ul = tagHelper('ul')
export const video = tagHelper('video')
export const wbr = tagHelper('wbr')
export const xmp = tagHelper('xmp')

function svgTagHelpers() {
  return {
    a: svgTagHelper('a'),
    altGlyph: svgTagHelper('altGlyph'),
    altGlyphDef: svgTagHelper('altGlyphDef'),
    altGlyphItem: svgTagHelper('altGlyphItem'),
    animate: svgTagHelper('animate'),
    animateColor: svgTagHelper('animateColor'),
    animateMotion: svgTagHelper('animateMotion'),
    animateTransform: svgTagHelper('animateTransform'),
    circle: svgTagHelper('circle'),
    clipPath: svgTagHelper('clipPath'),
    colorProfile: svgTagHelper('colorProfile'),
    cursor: svgTagHelper('cursor'),
    defs: svgTagHelper('defs'),
    desc: svgTagHelper('desc'),
    ellipse: svgTagHelper('ellipse'),
    feBlend: svgTagHelper('feBlend'),
    feColorMatrix: svgTagHelper('feColorMatrix'),
    feComponentTransfer: svgTagHelper('feComponentTransfer'),
    feComposite: svgTagHelper('feComposite'),
    feConvolveMatrix: svgTagHelper('feConvolveMatrix'),
    feDiffuseLighting: svgTagHelper('feDiffuseLighting'),
    feDisplacementMap: svgTagHelper('feDisplacementMap'),
    feDistantLight: svgTagHelper('feDistantLight'),
    feFlood: svgTagHelper('feFlood'),
    feFuncA: svgTagHelper('feFuncA'),
    feFuncB: svgTagHelper('feFuncB'),
    feFuncG: svgTagHelper('feFuncG'),
    feFuncR: svgTagHelper('feFuncR'),
    feGaussianBlur: svgTagHelper('feGaussianBlur'),
    feImage: svgTagHelper('feImage'),
    feMerge: svgTagHelper('feMerge'),
    feMergeNode: svgTagHelper('feMergeNode'),
    feMorphology: svgTagHelper('feMorphology'),
    feOffset: svgTagHelper('feOffset'),
    fePointLight: svgTagHelper('fePointLight'),
    feSpecularLighting: svgTagHelper('feSpecularLighting'),
    feSpotlight: svgTagHelper('feSpotlight'),
    feTile: svgTagHelper('feTile'),
    feTurbulence: svgTagHelper('feTurbulence'),
    filter: svgTagHelper('filter'),
    font: svgTagHelper('font'),
    fontFace: svgTagHelper('fontFace'),
    fontFaceFormat: svgTagHelper('fontFaceFormat'),
    fontFaceName: svgTagHelper('fontFaceName'),
    fontFaceSrc: svgTagHelper('fontFaceSrc'),
    fontFaceUri: svgTagHelper('fontFaceUri'),
    foreignObject: svgTagHelper('foreignObject'),
    g: svgTagHelper('g'),
    glyph: svgTagHelper('glyph'),
    glyphRef: svgTagHelper('glyphRef'),
    hkern: svgTagHelper('hkern'),
    image: svgTagHelper('image'),
    line: svgTagHelper('line'),
    linearGradient: svgTagHelper('linearGradient'),
    marker: svgTagHelper('marker'),
    mask: svgTagHelper('mask'),
    metadata: svgTagHelper('metadata'),
    missingGlyph: svgTagHelper('missingGlyph'),
    mpath: svgTagHelper('mpath'),
    path: svgTagHelper('path'),
    pattern: svgTagHelper('pattern'),
    polygon: svgTagHelper('polygon'),
    polyline: svgTagHelper('polyline'),
    radialGradient: svgTagHelper('radialGradient'),
    rect: svgTagHelper('rect'),
    script: svgTagHelper('script'),
    set: svgTagHelper('set'),
    stop: svgTagHelper('stop'),
    style: svgTagHelper('style'),
    switch: svgTagHelper('switch'),
    symbol: svgTagHelper('symbol'),
    text: svgTagHelper('text'),
    textPath: svgTagHelper('textPath'),
    title: svgTagHelper('title'),
    tref: svgTagHelper('tref'),
    tspan: svgTagHelper('tspan'),
    use: svgTagHelper('use'),
    view: svgTagHelper('view'),
    vkern: svgTagHelper('vkern'),
  }
}

export const svg = Object.assign(
  tagHelper<SVGElement>('svg'),
  svgTagHelpers()
)
