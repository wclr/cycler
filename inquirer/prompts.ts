import { InquirerRequest } from '.'

export type AutocomplteMatch = (str: string, input: string) => boolean

export type InquirerResponse = {
  value?: string,
  type: string
}


export type AutocomplteResponse = InquirerResponse & {
  list: string[]
}

const defaultAutocomplteMatch: AutocomplteMatch =
  (str, input) => str.indexOf(input) === 0

export const autocompletePrompt =
  (message: string,
    items: string[] | { value: string, name: string }[],
    match?: AutocomplteMatch): InquirerRequest => {    
    const matchFn = match || defaultAutocomplteMatch
    return {
      type: 'autocomplete',
      message,
      source: (answers: any, input: string) => {
        const list = (items as any[]).filter((item) => {
          return input
            ? matchFn(item.name || item, input)
            : true
        })
        return Promise.resolve(
          list.map(item => ({
            name: item.name || item,
            value: {value: item.value || item, list }
          }))
        )
      }
    }
  }