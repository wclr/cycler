import { prompt, registerPrompt, Inquirer } from 'inquirer';
import { makeTaskDriver, TaskSource } from '@cycler/task';
import { Stream } from 'xstream'
import { InquirerResponse } from './prompts'

registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))

export type InquirerRequest = {
  type: string
  abort?: boolean
  // items: string[] | { value: string, name: string }[]
} & { [index: string]: any }

export type InquirerSource = TaskSource<InquirerRequest, InquirerResponse>


export interface Options {

}

const disposePrompt = (prompt: any) => {
  if (prompt) {
    prompt.ui.close()
  }
}

export function makeInquirerDriver(options: Options = {}) {
  let current: {
    prompt: any,
    resolveWithEmptyResponse: () => any
  } | null = null

  const disposeCurrentPrompt = () => {
    if (current) {
      disposePrompt(current.prompt)
      current.resolveWithEmptyResponse()
    }
  }

  return makeTaskDriver<InquirerRequest, InquirerResponse, any>({
    getResponse: (request, cb, onDispose) => {

      disposeCurrentPrompt()

      const type = request.type

      const inquirerOptions: InquirerRequest & { name: string } =
        Object.assign(
          { name: 'value' },
          request)

      const requestPrompt = prompt(inquirerOptions)

      current = {
        prompt: requestPrompt,
        resolveWithEmptyResponse: () => cb(null, { type })
      }

      onDispose(() => {
        disposePrompt(requestPrompt)
      })

      return requestPrompt.then((
        ({ value }: { value: any }) => {
          const response: any = { type, value }
          if (type === 'autocomplete') {
            response.value = type === 'autocomplete' ? value.value : value
            response.list = value.list
          }
          if (current && requestPrompt === current.prompt) {
            current = null
          }
          return response
        }
      )).catch(() => {

      })
    },
    dispose: () => {
      disposeCurrentPrompt()
    }
  })
}
