
export const addCategory = <C extends string>(category: C) =>
  <T>(obj: T): T & { category: C } => Object.assign({}, obj, { category })
