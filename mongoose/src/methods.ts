
type ObjectId = Object

export type ModelQuery = [{ [index: string]: Array<any> }]

interface QueryConstructor {
      /**
       * Finds a single document by its _id field. findById(id) is almost*
       * equivalent to findOne({ _id: id }). findById() triggers findOne hooks.
       * @param id value of _id to query by
       * @param projection optional fields to return
       */
      findById(id: ObjectId | string | number,
        ): ModelQuery
      findById(id: Object | string | number, projection: Object,
        ): ModelQuery
      findById(id: Object | string | number, projection: Object, options: Object,
        ): ModelQuery

      /**
       * Creates a Query and specifies a $where condition.
       * @param argument is a javascript string or anonymous function
       */
      //$where(argument: string | Function): ModelQuery<Model<T>[], T>;

      /**
       * Performs aggregations on the models collection.
       * @param ... aggregation pipeline operator(s) or operator array
       */
      //aggregate(...aggregations: Object[]): Aggregate<Object[]>;
      //aggregate(...aggregationsWithCallback: Object[]): _MongoosePromise<Object[]>;

      /** Counts number of matching documents in a database collection. */
      count(conditions: Object): ModelQuery

      /**
       * Shortcut for saving one or more documents to the database. MyModel.create(docs)
       * does new MyModel(doc).save() for every doc in docs.
       * Triggers the save() hook.
       */
      create(...docs: Object[]): ModelQuery;

      // /**
      //  * Adds a discriminator type.
      //  * @param name discriminator model name
      //  * @param schema discriminator model schema
      //  */
      // discriminator(name: string, schema: Schema): Model<T>;

      // /** Creates a Query for a distinct operation. Passing a callback immediately executes the query. */
      // distinct(field: string, callback?: (err: any, res: any[]) => void): Query<any[]>;
      // distinct(field: string, conditions: Object,
      //   callback?: (err: any, res: any[]) => void): Query<any[]>;

      // /**
      //  * Sends ensureIndex commands to mongo for each index declared in the schema.
      //  * @param options internal options
      //  * @param cb optional callback
      //  */
      // ensureIndexes(callback?: (err: any) => void): _MongoosePromise<void>;
      // ensureIndexes(options: Object, callback?: (err: any) => void): _MongoosePromise<void>;

      // /**
      //  * Finds documents.
      //  * @param projection optional fields to return
      //  */
      // find(callback?: (err: any, res: Model<T>[]) => void): ModelQuery<Model<T>[], T>;
      // find(conditions: Object, callback?: (err: any, res: Model<T>[]) => void): ModelQuery<Model<T>[], T>;
      // find(conditions: Object, projection: Object,
      //   callback?: (err: any, res: Model<T>[]) => void): ModelQuery<Model<T>[], T>;
      // find(conditions: Object, projection: Object, options: Object,
      //   callback?: (err: any, res: Model<T>[]) => void): ModelQuery<Model<T>[], T>;



      // /**
      //  * Issue a mongodb findAndModify remove command by a document's _id field.
      //  * findByIdAndRemove(id, ...) is equivalent to findOneAndRemove({ _id: id }, ...).
      //  * Finds a matching document, removes it, passing the found document (if any) to the callback.
      //  * Executes immediately if callback is passed, else a Query object is returned.
      //  * @param id value of _id to query by
      //  */
      // findByIdAndRemove(): ModelQuery
      // findByIdAndRemove(id: Object | number | string,
      //   ): ModelQuery
      // findByIdAndRemove(id: Object | number | string, options: {
      //   /** if multiple docs are found by the conditions, sets the sort order to choose which doc to update */
      //   sort?: Object;
      //   /** sets the document fields to return */
      //   select?: Object;
      // }, ): ModelQuery

      // /**
      //  * Issues a mongodb findAndModify update command by a document's _id field. findByIdAndUpdate(id, ...)
      //  * is equivalent to findOneAndUpdate({ _id: id }, ...).
      //  * @param id value of _id to query by
      //  */
      // findByIdAndUpdate(): ModelQuery
      // findByIdAndUpdate(id: Object | number | string, update: Object,
      //   ): ModelQuery
      // findByIdAndUpdate(id: Object | number | string, update: Object,
      //   options: ModelFindByIdAndUpdateOptions,
      //   ): ModelQuery

      // /**
      //  * Finds one document.
      //  * The conditions are cast to their respective SchemaTypes before the command is sent.
      //  * @param projection optional fields to return
      //  */
      // findOne(conditions?: Object,
      //   ): ModelQuery
      // findOne(conditions: Object, projection: Object,
      //   ): ModelQuery
      // findOne(conditions: Object, projection: Object, options: Object,
      //   ): ModelQuery

      // /**
      //  * Issue a mongodb findAndModify remove command.
      //  * Finds a matching document, removes it, passing the found document (if any) to the callback.
      //  * Executes immediately if callback is passed else a Query object is returned.
      //  */
      // findOneAndRemove(): ModelQuery
      // findOneAndRemove(conditions: Object,
      //   ): ModelQuery
      // findOneAndRemove(conditions: Object, options: {
      //   /**
      //    * if multiple docs are found by the conditions, sets the sort order to choose
      //    * which doc to update
      //    */
      //   sort?: Object;
      //   /** puts a time limit on the query - requires mongodb >= 2.6.0 */
      //   maxTimeMS?: number;
      //   /** sets the document fields to return */
      //   select?: Object;
      // }, ): ModelQuery

      // /**
      //  * Issues a mongodb findAndModify update command.
      //  * Finds a matching document, updates it according to the update arg, passing any options,
      //  * and returns the found document (if any) to the callback. The query executes immediately
      //  * if callback is passed else a Query object is returned.
      //  */
      // findOneAndUpdate(): ModelQuery
      // findOneAndUpdate(conditions: Object, update: Object,
      //   ): ModelQuery
      // findOneAndUpdate(conditions: Object, update: Object,
      //   options: ModelFindOneAndUpdateOptions,
      //   ): ModelQuery

      // /**
      //  * geoNear support for Mongoose
      //  * @param GeoJSON point or legacy coordinate pair [x,y] to search near
      //  * @param options for the qurery
      //  * @param callback optional callback for the query
      //  */
      // geoNear(point: number[] | {
      //   type: string;
      //   coordinates: number[]
      // }, options: {
      //   /** return the raw object */
      //   lean?: boolean;
      //   [other: string]: any;
      // }, callback?: (err: any, res: Model<T>[], stats: any) => void): ModelQuery<Model<T>[], T>;

      // /**
      //  * Implements $geoSearch functionality for Mongoose
      //  * @param conditions an object that specifies the match condition (required)
      //  * @param options for the geoSearch, some (near, maxDistance) are required
      //  * @param callback optional callback
      //  */
      // geoSearch(conditions: Object, options: {
      //   /** x,y point to search for */
      //   near: number[];
      //   /** the maximum distance from the point near that a result can be */
      //   maxDistance: number;
      //   /** The maximum number of results to return */
      //   limit?: number;
      //   /** return the raw object instead of the Mongoose Model */
      //   lean?: boolean;
      // }, callback?: (err: any, res: Model<T>[]) => void): ModelQuery<Model<T>[], T>;

      // /**
      //  * Shortcut for creating a new Document from existing raw data,
      //  * pre-saved in the DB. The document returned has no paths marked
      //  * as modified initially.
      //  */
      // hydrate(obj: Object): Model<T>;

      // /**
      //  * Shortcut for validating an array of documents and inserting them into
      //  * MongoDB if they're all valid. This function is faster than .create()
      //  * because it only sends one operation to the server, rather than one for each
      //  * document.
      //  * This function does not trigger save middleware.
      //  */
      // insertMany(docs: any[], callback?: (error: any, docs: Model<T>[]) => void): _MongoosePromise<Model<T>[]>;
      // insertMany(doc: any, callback?: (error: any, doc: Model<T>) => void): _MongoosePromise<Model<T>>;
      // insertMany(...docsWithCallback: Object[]): _MongoosePromise<Model<T>>;

      // /**
      //  * Executes a mapReduce command.
      //  * @param o an object specifying map-reduce options
      //  */
      // mapReduce<Key, Value>(
      //   o: ModelMapReduceOption<Model<T>, Key, Value>,
      //   callback?: (err: any, res: any) => void
      // ): _MongoosePromise<any>;

      // /**
      //  * Populates document references.
      //  * @param docs Either a single document or array of documents to populate.
      //  * @param options A hash of key/val (path, options) used for population.
      //  * @param callback Optional callback, executed upon completion. Receives err and the doc(s).
      //  */
      // populate(docs: Object[], options: ModelPopulateOptions | ModelPopulateOptions[],
      //   callback?: (err: any, res: Model<T>[]) => void): _MongoosePromise<Model<T>[]>;
      // populate<T>(docs: Object, options: ModelPopulateOptions | ModelPopulateOptions[],
      //   ): _MongoosePromise<Model<T>>;

      /** Removes documents from the collection. */
      remove(conditions: Object): ModelQuery

      /**
       * Updates documents in the database without returning them.
       * All update values are cast to their appropriate SchemaTypes before being sent.
       */
      update(conditions: Object, doc: Object,
        ): ModelQuery;
      // update(conditions: Object, doc: Object, options: ModelUpdateOptions,
      //   callback?: (err: any, raw: any) => void): ModelQuery;

      /** Creates a Query, applies the passed conditions, and returns the Query. */
//      where(path: string, val?: Object): Query<any>;
}    