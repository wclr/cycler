import { ProxyOptions } from '../.'

export interface TransformOptions extends ProxyOptions {
  testExportName?: string
  importFrom?: string
  sourceIdentifier: string
  addHotAccept?: boolean
}

export type Transformer = (source: string, options: TransformOptions) => string
