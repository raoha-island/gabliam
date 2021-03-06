import { mongoose } from './mongoose';

export interface IRead<T extends mongoose.Document> {
  findAll(): Promise<T[]>;
  findById(_id: string): Promise<T | null>;
  findOne(cond?: Object): mongoose.Query<T | null>;
  find(cond?: Object, fields?: Object, options?: Object): mongoose.Query<T[]>;
}

export interface IWrite<T, U extends mongoose.Document> {
  create(item: T): Promise<U>;
  update(_id: mongoose.Types.ObjectId, item: T): Promise<U>;
  delete(_id: string): Promise<void>;
}

export interface MongooseConfiguration {
  name?: string;

  uri: string;

  options?: mongoose.ConnectionOptions;
}
