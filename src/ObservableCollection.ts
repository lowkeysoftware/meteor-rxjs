import { Observable, Subscriber } from 'rxjs';

import { ObservableCursor } from './ObservableCursor';
import { removeObserver } from './utils';

export module MongoObservable {

  export interface ConstructorOptions {
    connection?: Object;
    idGeneration?: string;
    transform?: Function;
  }

  export interface AllowDenyOptionsObject<T> {
    insert?: (userId: string, doc: T) => boolean;
    update?: (userId: string, doc: T, fieldNames: string[], modifier: any) => boolean;
    remove?: (userId: string, doc: T) => boolean;
    fetch?: string[];
    transform?: Function;
  }

  /**
   *  Creates a new MongoObservable.Collection from an existing of predefined Mongo.Collection.
   *  Use this feature to wrap existing collections such as Meteor.users.
   *  @param {Mongo.Collection} collection - The collection.
   *  @returns {MongoObservable.Collection} - Wrapped collection.
   *  @static
   */
  export function fromExisting<T>(collection: Mongo.Collection<T>): MongoObservable.Collection<T> {
    return new MongoObservable.Collection(collection);
  }

  /**
   * A class represents a MongoDB collection in the client side, wrapped with RxJS
   * Observables, so you can use it with your Angular 2 easier.
   * The wrapper has the same API as Mongo.Collection, only the "find" method returns
   * an ObservableCursor instead of regular Mongo.Cursor.
   *
   * T is a generic type - should be used with the type of the objects inside the collection.
   */
  export class Collection<T> {
    public insertAsync = this.insert;
    public removeAsync = this.remove;
    public updateAsync = this.update;
    public upsertAsync = this.upsert;
    public findAsync = this.find;
    public findOneAsync = this.findOne;

    private _collection: Mongo.Collection<T>;

    /**
     *  Creates a new Mongo.Collection instance wrapped with Observable features.
     *  @param {String | Mongo.Collection} nameOrExisting - The name of the collection. If null, creates an
     *  unmanaged (unsynchronized) local collection. If provided an instance of existing collection, will
     *  create a wrapper for the existing Mongo.Collection.
     *  @param {ConstructorOptions} options - Creation options.
     *  @constructor
     */
    constructor(nameOrExisting: string | Mongo.Collection<T>,
      // tslint:disable-next-line:align
      options?: ConstructorOptions) {
      if (nameOrExisting instanceof Mongo.Collection) {
        this._collection = nameOrExisting;
      } else {
        this._collection = new Mongo.Collection<T>(<string>nameOrExisting, options);
      }
    }

    /**
     *  Returns the Mongo.Collection object that wrapped with the MongoObservable.Collection.
     *  @returns {Mongo.Collection<T>} The Collection instance
     */
    get collection(): Mongo.Collection<T> {
      return this._collection;
    }

    /**
     *  Allow users to write directly to this collection from client code, subject to limitations you define.
     *
     *  @returns {Boolean}
     */
    allow(options: AllowDenyOptionsObject<T>): boolean {
      return this._collection.allow(options);
    }

    /**
     *  Override allow rules.
     *
     *  @returns {Boolean}
     */
    deny(options: AllowDenyOptionsObject<T>): boolean {
      return this._collection.deny(options);
    }

    /**
     *  Returns the Collection object corresponding to this collection from the npm
     *  mongodb driver module which is wrapped by Mongo.Collection.
     *
     *  @returns {Mongo.Collection} The Collection instance
     *
     * @see {@link https://docs.meteor.com/api/collections.html#Mongo-Collection-rawCollection|rawCollection on Meteor documentation}
     */
    rawCollection(): any {
      return this._collection.rawCollection();
    }

    /**
     *  Returns the Db object corresponding to this collection's database connection from the
     *  npm mongodb driver module which is wrapped by Mongo.Collection.
     *
     *  @returns {Mongo.Db} The Db instance
     *
     * @see {@link https://docs.meteor.com/api/collections.html#Mongo-Collection-rawDatabase|rawDatabase on Meteor documentation}
     */
    rawDatabase(): any {
      return this._collection.rawDatabase();
    }

    /**
     *  Insert a document in the collection.
     *
     *  @param {T} doc - The document to insert. May not yet have an _id
     *  attribute, in which case Meteor will generate one for you.
     *  @returns {Observable<string>} Observable which completes with the inserted ObjectId
     *
     * @see {@link https://docs.meteor.com/api/collections.html#Mongo-Collection-insert|insert on Meteor documentation}
     */
    async insert(doc: T): Promise<Observable<string>> {
      let observers: Subscriber<string>[] = [];
      let obs = this._createObservable<string>(observers);

      let result, error;

      try {
        //@ts-ignore
        result = await this._collection.insertAsync(doc);
      } catch (e) {
        error = e;
      }

      observers.forEach(observer => {
        error ? observer.error(error) :
          observer.next(result);
        observer.complete();
      });

      return obs;
    }


    /**
     *  Remove documents from the collection.
     *
     *  @param {Collection~MongoQueryMongo.Selector} selector - Specifies which documents to modify
     *  @returns {Observable<Number>} Observable which completes with the number of affected rows
     *
     * @see {@link https://docs.meteor.com/api/collections.html#Mongo-Collection-remove|remove on Meteor documentation}
     */
    async remove(selector: Mongo.Selector | Mongo.ObjectID | string): Promise<Observable<number>> {
      let observers: Subscriber<number>[] = [];
      let obs = this._createObservable<number>(observers);

      let result, error;

      try {
        //@ts-ignore
        result = await this._collection.removeAsync(selector);
      } catch (e) {
        error = e;
      }

      observers.forEach(observer => {
        error ? observer.error(error) :
          observer.next(result);
        observer.complete();
      });

      return obs;
    }


    /**
     *  Modify one or more documents in the collection.
     *
     *  @param {Collection~MongoQueryMongo.Selector} selector - Specifies which documents to modify
     *  @param {Modifier} modifier - Specifies how to modify the documents
     *  @param {MongoUpdateOptions} options - Update options
     *  first argument and, if no error, the number of affected documents as the second
     *  @returns {Observable<Number>} Observable which completes with the number of affected rows
     *
     * @see {@link https://docs.meteor.com/api/collections.html#Mongo-Collection-update|update on Meteor documentation}
     */
    async update(selector: Mongo.Selector | Mongo.ObjectID | string,
      // tslint:disable-next-line:align
      modifier: Mongo.Modifier,
      // tslint:disable-next-line:align
      options?: { multi?: boolean; upsert?: boolean; }): Promise<Observable<number>> {
      let observers: Subscriber<number>[] = [];
      let obs = this._createObservable<number>(observers);

      let result, error;

      try {
        //@ts-ignore
        result = await this._collection.updateAsync(selector, modifier, options);
      } catch (e) {
        error = e;
      }

      observers.forEach(observer => {
        error ? observer.error(error) :
          observer.next(result);
        observer.complete();
      });

      return obs;
    }


    /**
     *  Finds the first document that matches the selector, as ordered by sort and skip options.
     *
     *  @param {Collection~MongoQueryMongo.Selector} selector - Specifies which documents to modify
     *  @param {Modifier} modifier - Specifies how to modify the documents
     *  @param {MongoUpsertOptions} options - Upsert options
     *  first argument and, if no error, the number of affected documents as the second.
     *  @returns {Observable<{numberAffected, insertedId}>} Observable which completes with an
     *  Object that contain the keys numberAffected and insertedId.
     *
     * @see {@link https://docs.meteor.com/api/collections.html#Mongo-Collection-upsert|upsert on Meteor documentation}
     */
    async upsert(selector: Mongo.Selector | Mongo.ObjectID | string,
      // tslint:disable-next-line:align
      modifier: Mongo.Modifier,
      // tslint:disable-next-line:align
      options?: { multi?: boolean; }): Promise<Observable<number>> {
      let observers: Subscriber<number>[] = [];
      let obs = this._createObservable<number>(observers);

      let result, error;

      try {
        //@ts-ignore
        result = await this._collection.upsertAsync(selector, modifier, options);
      } catch (e) {
        error = e;
      }

      observers.forEach(observer => {
        error ? observer.error(error) :
          observer.next(result);
        observer.complete();
      });

      return obs;
    }


    /**
     *  Method has the same notation as Mongo.Collection.find, only returns Observable.
     *
     *  @param {Collection~MongoQueryMongo.Selector} selector - A query describing the documents to find
     *  @param {Collection~MongoQueryOptions} options - Query options, such as sort, limit, etc.
     *  @returns {ObservableCursor<T>} RxJS Observable wrapped with Meteor features.
     *  @example <caption>Using Angular2 Component</caption>
     *  const MyCollection = MongoObservable.Collection("myCollection");
     *
     *  class MyComponent  {
     *     private myData: ObservableCursor<any>;
     *
     *     constructor() {
     *        this.myData = MyCollection.find({}, {limit: 10});
     *     }
     *  }
     *
     * @see {@link https://docs.meteor.com/api/collections.html#Mongo-Collection-find|find on Meteor documentation}
     */
    find(selector?: Mongo.Selector | Mongo.ObjectID | string, options?: {
      sort?: Mongo.SortSpecifier;
      skip?: number;
      limit?: number;
      fields?: Mongo.FieldSpecifier;
      reactive?: boolean;
      transform?: Function;
    }): ObservableCursor<T> {
      // @ts-ignore
      const cursor = this._collection.find.apply(
        this._collection, arguments);
      return ObservableCursor.create<T>(cursor);
    }


    /**
     *  Finds the first document that matches the selector, as ordered by sort and skip options.
     *
     *  @param {Collection~MongoQueryMongo.Selector} selector - A query describing the documents to find
     *  @param {Collection~MongoQueryOptions} options - Query options, such as sort, limit, etc.
     *  @returns {any} The first object, or `undefined` in case of non-existing object.
     *
     * @see {@link https://docs.meteor.com/api/collections.html#Mongo-Collection-findOne|findOne on Meteor documentation}
     */
    findOne(selector?: Mongo.Selector | Mongo.ObjectID | string, options?: {
      sort?: Mongo.SortSpecifier;
      skip?: number;
      fields?: Mongo.FieldSpecifier;
      reactive?: boolean;
      transform?: Function;
    }): T {
      // @ts-ignore
      return this._collection.findOneAsync.apply(
        this._collection, arguments);
    }


    private _createObservable<T>(observers: Subscriber<T>[]) {
      return Observable.create((observer: Subscriber<T>) => {
        observers.push(observer);
        return () => {
          removeObserver(observers, observer);
        };
      });
    }
  }
}


/**
 * An options object for MongoDB queries.
 * @typedef {Object} Collection~MongoQueryOptions
 * @property {Object} sort - Sort order (default: natural order)
 * @property {Number} skip - Number of results to skip at the beginning
 * @property {Object} fields - Dictionary of fields to return or exclude.
 * @property {Boolean} reactive - (Client only) Default true; pass false to disable reactivity
 * @property {Function} transform - Overrides transform on the Collection for this cursor. Pass null to disable transformation.
 */

/**
 * A MongoDB query selector representation.
 * @typedef {(Mongo.Mongo.Selector|Mongo.Mongo.ObjectID|string)} Collection~MongoQueryMongo.Selector
 */

/**
 * A MongoDB query options for upsert action
 * @typedef {Object} Collection~MongoUpsertOptions
 * @property {Boolean} multi - True to modify all matching documents;
 * false to only modify one of the matching documents (the default).
 */

/**
 * A MongoDB query options for update action
 * @typedef {Object} Collection~MongoUpdateOptions
 * @property {Boolean} multi - True to modify all matching documents;
 * @property {Boolean} upsert - True to use upsert logic.
 */
