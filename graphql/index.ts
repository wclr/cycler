import * as gq from 'graphql'
import xs, { Stream } from 'xstream'
import cuid = require('cuid')

import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLID,
  GraphQLResolveInfo
} from 'graphql'

export interface GraphQLResolveQuery<Root, Args, Context> {
  id: string,
  fieldName: string,
  typeName: string,
  root: Root,
  args: Args,
  context: Context,
  resolveInfo: GraphQLResolveInfo
}

export interface GraphQLResolveResult {
  id: string,
  resolve?: any
  reject?: any
}

export interface GraphQLTypeSource<Root> {
  field: <Args, Context>(name?: string) =>
    Stream<GraphQLResolveQuery<Root, Args, Context>>
}

export interface GraphQLSource {
  type: <Root>(name?: string) => GraphQLTypeSource<Root>,
  field: <Args, Context>(name?: string) =>
    Stream<GraphQLResolveQuery<any, Args, Context>>
}

type ResolveRequests = {
  [index: string]: {
    resolve: (result: any) => void,
    reject: (error: any) => void
  }
}

export const makeGraphQLDriver = (schema: GraphQLSchema) => {
  const rootType = schema.getQueryType()
  const resolveRequests: ResolveRequests = {}
  const stream$ = xs.create<GraphQLResolveQuery<any, any, any>>()

  let addResolver = (fieldName: string, type: GraphQLObjectType) => {
    let typeName = type.name
    let typeFields = type.getFields()
    let field = typeFields[fieldName]
    if (!field.resolve) {
      field.resolve = (root, args, context, resolveInfo) => {
        return new Promise((resolve, reject) => {
          let id = cuid()
          resolveRequests[id] = { resolve, reject }
          stream$.shamefullySendNext({
            id,
            fieldName: resolveInfo.fieldName,
            typeName,
            root,
            args,
            context,
            resolveInfo
          })
        })
      }
    }
  }

  const makeFieldForType = (typeObj: GraphQLObjectType | undefined) =>
    (name?: string) => {
      let typeStream$ = stream$
      if (typeObj) {
        let typeName = typeObj.name
        typeStream$ = stream$
          .filter(query => query.typeName === typeName)
        if (name) {
          let typeFields = typeObj.getFields()
          if (!typeFields[name]) {
            throw new Error(`Field ${name} not found on type ${typeName} in GraphQL schema`)
          }
          addResolver(name, typeObj)
        }
      }
      return name
        ? typeStream$.filter(query => query.fieldName === name)
        : typeStream$
    }

  const source: GraphQLSource = {
    type: (name?: string) => {
      let typeObj: GraphQLObjectType | undefined
      if (name) {
        typeObj = <GraphQLObjectType>schema.getType(name)
        if (!typeObj) {
          throw new Error(`Type ${name} not found in GraphQL schema`)
        }
      }
      return {
        field: makeFieldForType(typeObj)
      }
    },
    field: makeFieldForType(rootType)
  }
  return (result$: Stream<GraphQLResolveResult>) => {
    let empty = () => { }
    result$.addListener({
      next: (result) => {
        let request = resolveRequests[result.id]
        if (request) {
          if (result.resolve) {
            request.resolve(result.resolve)
          } else if (result.reject) {
            request.resolve(result.reject)
          } else {
            request.resolve(undefined)
          }
        }
      },
      error: empty,
      complete: empty
    })
    return source
  }
}
