export type KeyValue<T> = { key: string; value: T }
export type IndexedItems<T> = { [index: string]: T }
export type GetItemsResult<T> = IndexedItems<T>

export interface ForageInstance {
  getItem<T>(key: string): Promise<T | null>
  getItems<T>(keys: string[] | null): Promise<IndexedItems<T>>

  setItem<T>(key: string, value: T): Promise<void>
  setItems<T>(items: IndexedItems<T> | KeyValue<T>[]): Promise<void>

  removeItem(key: string): Promise<void>
  removeItems(key: string[]): Promise<void>

  clear(): Promise<void>
  length(): Promise<number>
  key(keyIndex: number): Promise<string>
  keys(): Promise<string[]>

  iterate<T, U>(
    iteratee: (value: T, key: string, iterationNumber: number) => U | undefined
  ): Promise<U | undefined>
}
