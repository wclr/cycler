
export const setCategory = <C extends string>(category: C) =>
  <T>(obj: T): T & { category: C } => Object.assign({}, obj, { category })

export const makeLazy = <T>(obj: T): T & { lazy: boolean } =>
  Object.assign({}, obj, { lazy: true })
