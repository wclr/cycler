import { ProxyOptions } from '../.'

export interface TransformOptions extends ProxyOptions {
  testExportName?: string
  importFrom?: string
  sourceIdentifier: string
  resourcePath?: string
  addHotAccept?: boolean
}

export type Transformer = (source: string, options: TransformOptions) => string
