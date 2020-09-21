import xs, { MemoryStream, Stream } from 'xstream'
import concat from 'xstream/extra/concat'
export type Component<So, Si> = (sources: So, ...rest: any[]) => Si

const isStream = (s: any) => {
  return typeof s._add === 'function'
}

const isArray = Array.isArray

const mapObj = <T, R, K extends string>(
  obj: Record<K, T>,
  mapValue: (value: T, key: K) => R
): Record<string, R> => {
  if (Object.keys(obj).length === 0) return {}

  return Object.keys(obj).reduce<Record<string, R>>((resObj, key) => {
    if (obj[key as K]) {
      resObj[key] = mapValue(obj[key as K], key as K)
    }
    return resObj
  }, {})
}

const mapObjOrList = <O extends Record<any, any>, L extends ArrayLike<any>, R>(
  obj: O | L,
  mapValue: (value: any, key: any) => R
) => {
  return isArray(obj) ? obj.map(mapValue) : mapObj(obj, mapValue)
}

const combineObj = <T, M extends { [K in string]: Stream<T> }>(
  m: M
): Stream<{ [K in keyof M]: T }> => {
  const keys = Object.keys(m) as (keyof M)[]
  const values = keys.map((key) => m[key])
  const combined$ = xs.combine(...values)
  return combined$.map((combined) => {
    return keys.reduce((obj, key, index) => {
      ;(obj as any)[key] = combined[index]
      return obj
    }, {} as any)
  })
}

const getObjValues = <T extends any, O extends Record<string, T>>(obj: O) => {
  const keys = Object.keys(obj) as (keyof O)[]
  return keys.map((key) => obj[key])
}

type UnpackStream<T> = T extends Stream<infer U> ? U : any

interface CollectListSignature {
  <
    So,
    Si,
    SinksCollect extends {
      [K in keyof Si]: ((list: Si[K][]) => Stream<any>) | 'combine' | 'merge'
    }
  >(
    items: Component<So, Partial<Si>>[] | MemoryStream<Component<So, Partial<Si>>[]>,
    sinksCollect: SinksCollect
  ): (
    sources: So
  ) => {
    [C in keyof Si]: SinksCollect[C] extends 'combine'
      ? Stream<UnpackStream<Si[C]>[]>
      : SinksCollect[C] extends 'merge'
      ? Stream<UnpackStream<Si[C]>>
      : SinksCollect[C] extends (list: any[]) => Stream<any>
      ? ReturnType<SinksCollect[C]>
      : any
  }
}

interface CollectObjSignature {
  <
    So,
    Si,
    IK extends string,
    SinksCollect extends {
      [K in keyof Si]: ((p: { [KK in IK]: Si[K] }) => any) | 'combine' | 'merge'
    }
  >(
    items:
      | { [K in IK]: Component<So, Si> }
      | MemoryStream<{ [K in IK]: Component<So, Si> }>,
    sinksCollect: SinksCollect
  ): (
    sources: So
  ) => {
    [C in keyof Si]: SinksCollect[C] extends 'combine'
      ? Stream<Record<IK, UnpackStream<Si[C]>>>
      : SinksCollect[C] extends 'merge'
      ? Stream<UnpackStream<Si[C]>>
      : SinksCollect[C] extends (...args: any[]) => Stream<any>
      ? ReturnType<SinksCollect[C]>
      : any
  }
}

const streamify = <T>(s: T | MemoryStream<T>): MemoryStream<T> => {
  return concat(
    isStream(s) ? (s as MemoryStream<T>) : xs.of(s as T),
    xs.never() as Stream<T>
  ).remember()
}

export const collectList: CollectListSignature = (items, sinksCollect) => {
  return (sources) => {
    const items$ = streamify(items)

    const sinksList$ = items$
      .map((items) => {
        return items.map((C) => C(sources))
      })
      .remember()

    return mapObj(sinksCollect, (collectSink, sinkKey) => {
      const collectFn =
        collectSink === 'merge'
          ? (arg: any[]) => xs.merge(...arg)
          : collectSink === 'combine'
          ? (arg: any[]) => xs.combine(...arg)
          : collectSink
      return sinksList$
        .map((sinksList) => {
          return collectFn(
            sinksList.map((s: any) => (s[sinkKey] || xs.empty()) as any)
          )
        })
        .flatten()
    }) as any
  }
}

export const collectObj: CollectObjSignature = (items, sinksCollect) => {
  return (sources) => {
    const items$ = streamify(items)

    const sinksObj$ = items$
      .map((items) => {
        return mapObj(items, (Comp) => Comp(sources))
      })
      .remember()

    return mapObj(sinksCollect, (collectSink, sinkKey) => {
      const collectFn =
        collectSink === 'merge'
          ? (obj: any) => xs.merge(...getObjValues(obj))
          : collectSink === 'combine'
          ? combineObj
          : collectSink

      return sinksObj$
        .map((sinksObj) => {
          const mapped = mapObj(sinksObj, (si) => {
            return si[sinkKey as keyof typeof si] || xs.empty()
          })

          return collectFn(mapped as any)
        })
        .flatten()
    }) as any
  }
}

interface CollectSignature extends CollectListSignature, CollectObjSignature {}

export const collect: CollectSignature = (items: any, sinksCollect: any) => {
  return (sources: any) => {
    const items$ = streamify(items)

    const sinksToCollect$ = items$
      .map((items) => {
        return mapObjOrList(items, (Comp) => Comp(sources))
      })
      .remember()

    return mapObj(sinksCollect, (collectSink: any, sinkKey) => {
      const collectFn: (arg: any) => Stream<any> =
        collectSink === 'merge'
          ? (obj: any) => xs.merge(...(isArray(obj) ? obj : getObjValues(obj)))
          : collectSink === 'combine'
          ? (obj: any) => (isArray(obj) ? xs.combine(...obj) : combineObj(obj))
          : collectSink

      return sinksToCollect$
        .map((sinksToCollect) => {
          const arg = isArray(sinksToCollect)
            ? sinksToCollect.map((s: any) => (s[sinkKey] || xs.empty()) as any)
            : mapObj(sinksToCollect, (si) => {
                return si[sinkKey as keyof typeof si] || xs.empty()
              })
          return collectFn(arg)
        })
        .flatten()
    }) as any
  }
}
