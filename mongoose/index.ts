import { makeTaskDriver, TaskDriver, GetResponseCallback, TaskRequest } from '@cycler/task'
import * as mongoose from 'mongoose'
import { StreamAdapter, Observer } from '@cycle/base'

export interface QueryRootCall { [method: string]: any | any[] }
export interface QueryCall { [method: string]: any | any[] }
export type QueryChain = (QueryRootCall | QueryCall)[]
export type ConnectionEvent = 'error' | 'connected' | 'connecting' | 'disconnected' | 'disconnecting'

export interface MongooseModelRequest extends TaskRequest, QueryRootCall {
  model: string,
  query?: QueryCall[]
  lean?: boolean,
}

export interface MongooseCollectionModelRequest extends TaskRequest, QueryRootCall {
  collection: string
  model?: boolean
  query?: QueryCall[]
  lean?: boolean
}

export type MongooseRequest = MongooseModelRequest | MongooseCollectionModelRequest

export type ModelQuery = QueryChain

const isFunction = (x: any) => typeof x === 'function'

function getQueryChainFromRequest(request: any, Model: any, modelName: string) {
  let method: string = Object.keys(request)
    .filter(key => key !== 'model')
    .reduce((found: string, key: string) =>
      found || (typeof Model[key] === 'function' && key) || ''
    , '')
  if (!method) {
    throw new Error(
      `Could nof find method for quering model \`${modelName}\` ` +
      `in the request`)
  }
  return [{ [method]: request[method] }]
}

function executeQueryChain(queryChain: QueryChain, Model: any, modelName: string) {
  return queryChain
    .filter(_ => _)
    .reduce((queryObj: any, chainItem: any) => {
      let chainMethodName = Object.keys(chainItem)[0]
      let chainMethod = queryObj[chainMethodName]
      if (isFunction(chainMethod)) {
        let chainItemValue = chainItem[chainMethodName]
        let argList = Array.isArray(chainItemValue)
          ? chainItemValue : [chainItemValue]
        return chainMethod.apply(queryObj, argList)
      } else {
        throw new Error(`Query chain for model \`${modelName}\`` +
          ` contains illegal method \`${chainMethodName}\``)
      }
    }, Model)
}

export const makeGetResponse = (connection: mongoose.Connection) => {
  const collectionModels: any = {}
  const getModelForCollection = (modelName: string, collectionName: string) => {
    if (!collectionModels[collectionName]) {
      collectionModels[collectionName] =
        connection.model(modelName, <any>{}, collectionName)
    }
    return collectionModels[collectionName]
  }
  return (request: MongooseRequest, cb: GetResponseCallback<MongooseResponse, any>) => {
    const collectionName = (<any>request).collection
    let modelName = request.model
    let Model: any = null
    let isLean = request.lean
    if (collectionName) {
      if (request.model !== false) {
        modelName = 'collectionModel_' + collectionName
        Model = getModelForCollection(modelName, collectionName)
        isLean = typeof isLean === 'boolean' ? isLean : true
      } else {
        throw Error(`Request native query to mongoose collection (with \`model: false\` param) not implemented.`)
      }
    } else {
      if (!modelName || typeof modelName !== 'string') {
        throw Error(`Request to mongoose driver should contain model or collection name`)
      }
      Model = connection.model(modelName)
    }

    if (Model && modelName) {
      const queryChain = request.query
        ? request.query.concat([])
        : getQueryChainFromRequest(request, Model, modelName)
      if (typeof isLean === 'boolean') {
        queryChain.push({ lean: isLean })
      }
      const queryChainResult = executeQueryChain(queryChain, Model, modelName)

      if (queryChainResult) {
        if (typeof queryChainResult.exec === 'function') {
          return queryChainResult.exec()
        } else if (typeof queryChainResult.then === 'function') {
          return queryChainResult
        } else {
          throw Error(`Query chain for model ${modelName} returned illegal result`)
        }
      }
    }
  }
}

export interface MongooseResponse { }

export type MongooseDriver = TaskDriver<MongooseRequest, MongooseResponse>

export function makeMongooseDriver(mongoUrl: string, options?: mongoose.ConnectionOptions): MongooseDriver
export function makeMongooseDriver(connection: mongoose.Connection): MongooseDriver

export function makeMongooseDriver(connection: mongoose.Connection | string, options?: mongoose.ConnectionOptions) {
  if (typeof connection === 'string') {
    connection = mongoose.createConnection(connection, options)
  }
  const taskDriver = makeTaskDriver<MongooseRequest, MongooseResponse, any>(makeGetResponse(connection))

  return function (request$: any, runSA: any) {
    const registerEvent = (event: ConnectionEvent) => {
      return runSA.adapt({}, (_: any, observer: Observer<any>) => {
        (connection as any).on(event, (val: any) => {
          observer.next(val)
        })
      })
    }
    taskDriver(request$, runSA)
    const driverSource = taskDriver(request$, runSA) as any
    driverSource.on = registerEvent
    return driverSource
  }
}

