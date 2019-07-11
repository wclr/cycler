export type KeyValue<T> = { key: string; value: T }
export type IndexedItems<T> = { [index: string]: T }
export type GetItemsResult<T> = IndexedItems<T>

export interface ForageInstance {
  getItem<T>(key: string, callback?: (err: any, value: T) => void): Promise<T>
  setItem<T>(key: string, value: T): Promise<T>
  removeItem(key: string): Promise<void>

  getItems<T>(keys: string[]): Promise<IndexedItems<T>>
  setItems<T>(items: IndexedItems<T> | KeyValue<T>[]): Promise<T>
  removeItems(key: string[]): Promise<void>

  clear(): Promise<void>
  length(): Promise<number>
  key(keyIndex: number): Promise<string>
  keys(): Promise<string[]>
  iterate<T, U>(
    iteratee: (value: T, key: string, iterationNumber: number) => U
  ): Promise<U>
}
