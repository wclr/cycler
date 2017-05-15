export type StatePath = string | number | (string | number)[]

const arrify = (obj: any) => Array.isArray(obj) ? obj : [obj]

// code taken from ramda
export const path = (paths: StatePath, obj: any) => {
  paths = arrify(paths)
  var val = obj
  var idx = 0
  while (idx < paths.length) {
    if (val == null) {
      return
    }
    val = val[paths[idx]]
    idx += 1
  }
  return val
}

export const assoc = (prop: string | number, val: any, obj: any) => {
  var result = {} as any
  for (var p in obj) {
    result[p] = obj[p]
  }
  result[prop] = val
  return result
}

const has = (prop: any, obj: any) =>
  Object.prototype.hasOwnProperty.call(obj, prop)
const isArray = Array.isArray
const isInteger = Number.isInteger || ((n: any) => (n << 0) === n)
const isNil = (x: any) => x == null

export const assocPath = (path: StatePath, val: any, obj: any) => {
  path = arrify(path)
  if (path.length === 0) {
    return val
  }
  var idx = path[0] as any
  if (path.length > 1) {
    var nextObj = (!isNil(obj) && has(idx, obj)) ? obj[idx]
      : isInteger(path[1] as number) ? [] : {}
    val = assocPath(Array.prototype.slice.call(path, 1), val, nextObj)
  }
  if (isInteger(idx as number) && isArray(obj)) {
    var arr: any = [].concat(obj as any)
    arr[idx] = val
    return arr
  } else {
    return assoc(idx, val, obj)
  }
}
