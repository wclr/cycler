import { TransformOptions } from '../transform'
import { transform } from '../transform/cjs'

export const makeSourceTransformer = ({
  testExportName = '^[A-Z]',
  debug,
}: {
  testExportName?: string
  debug?: boolean
} = {}) => {
  return ({
    src,
    filename,
    options,
  }: {
    src: string
    filename: string
    options: any
  }) => {
    const transformOptions: TransformOptions = {
      testExportName,
      sourceIdentifier: JSON.stringify(filename),
      makeExport: (a, str) => {
        const name = `__Fn_` + Math.random().toString().replace('.', '')
        return [
          `var ${name} = ${str}`,
          a + `(...args: any[]) => ${name}(...args)`,
          '',
        ].join(';\n')
      },
      debug,
    }

    return {
      src: transform(src, transformOptions),
      filename,
      options,
    }
  }
}
