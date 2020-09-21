import { ProxyOptions } from '../.'

export interface TransformOptions extends ProxyOptions {
  testExportName?: string
  importFrom?: string
  sourceIdentifier: string
  resourcePath?: string
  addHotAccept?: boolean,
  makeExport?: (exportAssign: string, str: string) => string
}

export type Transform = (source: string, options: TransformOptions) => string
