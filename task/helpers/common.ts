import { requestOps } from '../requestOps'

export const setCategory = <C extends string>(category: C) =>
  <T>(obj: T): T & { category: C } => requestOps
    .addProperty(obj, 'category', category) as any

export const makeLazy = <T>(obj: T): T & { lazy: boolean } =>
  requestOps.addProperty(obj, 'lazy', true) as any

