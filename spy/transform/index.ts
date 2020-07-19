export interface TransformOptions {
  importFrom?: string
  sourceIdentifier: string
  resourcePath?: string
}

export type Transformer = (source: string, options: TransformOptions) => string
