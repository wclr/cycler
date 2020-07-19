import { Transformer, TransformOptions } from '.'

const parseKeyValueLine = (str: string) => {
  const m = str.match(/(\s*(?:[\w\d]+|\[.+\]):)(.*)/)
}

const matchIdentifier = (str: string) => {
  // const m = str.match(/(.*?)(;|,|)\s*$/)
  const m = str.match(
    /(\s*(?:(?:[0-9a-zA-Z_$]+|\[.+\]):\s?)|\s*return\s)?(.*?)(;|,|)\s*$/
  )
  return m ? m.slice(1) : m
}

export const transformer: Transformer = (source: string, options) => {
  const sourceIdentifier = options.sourceIdentifier

  const getSpyHame = (name: string) => '__spy_' + name

  let spyCount: number = 0

  const spyFnName = '_spyProxy'

  const concat = (lines: string[], ...newLines: string[]) => {
    lines.push(...newLines)
    return lines
  }
  const getLineIndentStr = (line: string) => {
    return line.match(/^\s*/)![0]
  }
  const getLineIndent = (line: string) => {
    return getLineIndentStr(line).length
  }

  const sourceLines = source.split('\n')
  const { resourcePath } = options

  const parseOptions = (str: string | undefined) => {
    const optsStr = (str || '{}').trim()
    return resourcePath
      ? optsStr
          .replace(/([^{])}$/, '$1,}')
          .replace(/}$/, `"source": "${resourcePath}"}`)
      : optsStr
  }

  const getSpyBlockStart = (target: string = '') => `${spyFnName}(${target}`
  const getSpyEnd = (name: string, options?: string) =>
    `, "${name}", ${parseOptions(options)})`
  const getSpyWrap = (target: string, name: string, options?: string) =>
    getSpyBlockStart(target) + getSpyEnd(name, options)

  source = sourceLines
    .reduce<{
      lines: string[]
      spyThis?: { name?: string; options?: string; block?: boolean }
      insert?: {
        indent: number
        line: string
      }
    }>(
      (prev, line, i) => {
        const failedToParseRet = (waring?: string) => {
          return {
            // maybe insert some warning
            lines: concat(prev.lines, line),
          }
        }
        const skipAndGoToNextRet = () => {
          return {
            lines: concat(prev.lines, line),
            spyThis: prev.spyThis,
            insert: prev.insert,
          }
        }

        // const isCommentLine = /^\s*\/([/*])/.test(line)

        const lineMatch = line.match(
          /(.*)?(?:\/[/*])\s*@spy(?:-this)?(?:-(start|chain))?(?: ([\S]+))?(?: ({.*}))?\s*$/
          // /([^\/*]+).*@spy(?:-this)?(?:-(start|chain))?(?: ([\S]+))?(?: ({.*}))?\s*$/
        )
        const nonCommentInMatch = lineMatch ? lineMatch[1].trim() : ''

        // skip @spy is actually commented
        if (/(^\s*(\/[/*])|([/*]\/)\s*$)/.test(nonCommentInMatch)) {
          return skipAndGoToNextRet()
        }

        const commentEnding = lineMatch && line.slice(lineMatch[1].length)

        // // skip commentLines
        // if (nonCommentInMatch && isCommentLine) {
        //   return
        // }

        const spyThisMatch = lineMatch ? lineMatch.slice(1) : null
        const spyMethod = !!spyThisMatch
          ? (spyThisMatch[1] as 'chain' | 'start' | '')
          : ''
        // line contains: @spy-chain

        const lineLooksLikeChainEnd =
          !spyMethod &&
          (/^[}\)]+[,;]?$/.test(nonCommentInMatch) ||
            // start with dot ends with bracket
            /^\..*\)[,;]?$/.test(nonCommentInMatch))

        if (spyThisMatch && (spyMethod == 'chain' || lineLooksLikeChainEnd)) {
          spyCount++
          const [keyPart = '', id, ending] =
            matchIdentifier(nonCommentInMatch) || []

          const name = spyThisMatch[2] || 'unnamed chain'
          const options = spyThisMatch[3]
          return {
            lines: concat(
              prev.lines,
              keyPart +
                id +
                `.compose(_ => ${getSpyWrap('_', name, options)})` +
                ending +
                ' ' +
                commentEnding
              // line.replace(
              //   /([\s\*\/])+@spy.*/,
              //   `.compose(_ => ${getSpyWrap('_', name, options)})` + ending + ' ' + commentEnding
              // )
            ),
          }
        }

        const spyThisEnd = !spyThisMatch && /@spy-this-end/.test(line)

        const isEmptyLine = !/\S/.test(line)
        const isLastLine = i === sourceLines.length - 1

        const spyThis = spyThisMatch
          ? {
              block: spyMethod === 'start',
              name: spyThisMatch[2],
              options: spyThisMatch[3],
            }
          : undefined

        // line contains: @spy-start
        if (spyThis && spyThis.block) {
          spyCount++
          return {
            lines: concat(
              prev.lines,
              line,
              getLineIndentStr(line) + getSpyBlockStart()
            ), //
            spyThis,
          }
        }

        if (spyThis && nonCommentInMatch) {
          spyCount++
          const [keyPart = '', toWrap, ending] =
            matchIdentifier(nonCommentInMatch) || []
          if (!toWrap) {
            return failedToParseRet()
          }
          const name = spyThis.name || toWrap.trim()
          const newLine =
            keyPart +
            getSpyWrap(toWrap.trim(), name) +
            `${ending}` +
            ' ' +
            commentEnding
          spyCount++

          return {
            lines: concat(prev.lines, getLineIndentStr(line) + newLine),
          }
        }
        // line contains: @spy ...
        if (spyThis && !prev.insert) {
          return {
            lines: concat(prev.lines, line),
            spyThis,
          }
        }

        // line goes after @spy-spy line with no name provided
        if (
          prev.spyThis &&
          prev.spyThis.block &&
          !prev.spyThis.name &&
          !isEmptyLine
        ) {
          // get the name, assume named blocks for now
        }

        if (spyThisEnd) {
          if (!prev.spyThis || !prev.spyThis.block) {
            return failedToParseRet('Failed to parse spy-this end block')
          }
          return {
            lines: concat(
              prev.lines,
              getLineIndentStr(line) +
                getSpyEnd(prev.spyThis.name || 'Unnamed', prev.spyThis.options),
              line
            ),
          }
        }

        if (isEmptyLine && !isLastLine) {
          return skipAndGoToNextRet()
        }

        if (prev.insert) {
          const indent = getLineIndent(line)

          if ((!isEmptyLine && indent <= prev.insert.indent) || isLastLine) {
            const isClosing = /\s*}/.test(line)
            return {
              lines: concat(
                prev.lines,
                ...(isClosing
                  ? [line, prev.insert.line] // insert after
                  : [prev.insert.line, ...(isEmptyLine ? [] : ['']), line]) // insert before
              ),
              spyThis,
            }
          } else {
            return {
              lines: concat(prev.lines, line),
              insert: prev.insert,
              spyThis,
            }
          }
        }

        if (prev.spyThis && !prev.spyThis.block && !isEmptyLine) {
          const declRegEx = /\s*(export(?:s\.|\s))?((?:var|let|const)\s)?(\S*)( = .*)/

          const declMatch = line.match(declRegEx)

          if (!declMatch) {
            const [keyPart = '', toWrap, ending] = matchIdentifier(line) || []
            if (!toWrap) {
              return failedToParseRet()
            }
            const name = prev.spyThis.name || toWrap.trim()
            const newLine =
              keyPart + getSpyWrap(toWrap.trim(), name) + `${ending}`
            spyCount++

            return {
              lines: concat(prev.lines, getLineIndentStr(line) + newLine),
            }
          }

          spyCount++

          const [exportDecl, varDcl, name, rest] = declMatch.slice(1)

          // console.log('exportDecl, varDcl, name', exportDecl, varDcl, name)

          const indentStr = getLineIndentStr(line)
          const indent = indentStr.length
          const spyName = getSpyHame(name)
          const newLine =
            indentStr + (varDcl || 'var ') + getSpyHame(name) + rest
          const insertLine =
            indentStr +
            (exportDecl || '') +
            (varDcl || '') +
            name +
            ' = ' +
            //`${spyFnName}(${spyName}, "${name}");`
            getSpyWrap(spyName, name) +
            ';'

          return {
            lines: concat(prev.lines, newLine),
            insert: {
              indent,
              line: insertLine,
            },
          }
        }

        return skipAndGoToNextRet()
      },
      { lines: [] }
    )
    .lines.join('\n')

  if (spyCount) {
    const importFrom = options.importFrom || '@cycler/spy'
    source = source.replace(/^("use strict";)?/, whole => {
      return whole + `\nvar ${spyFnName} = require("${importFrom}").spy;`
    })
  }

  return source
}
