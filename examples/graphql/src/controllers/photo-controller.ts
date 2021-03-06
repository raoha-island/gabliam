import {
  Args,
  GraphqlController,
  Mutation,
  Query,
  ResolveMap,
  Subscription,
} from '@gabliam/graphql-core';
import { Connection, Repository } from '@gabliam/typeorm';
import { PubSub } from 'graphql-subscriptions';
import * as _ from 'lodash';
import { Photo } from '../entities/photo';

const pubSub = new PubSub();

@GraphqlController({
  graphqlFiles: [`./photo/schema.gql`, `./photo/photo.gql`],
})
export class PhotoController {
  private photoRepository: Repository<Photo>;

  constructor(connection: Connection) {
    this.photoRepository = connection.getRepository<Photo>('Photo');
  }

  @ResolveMap({
    path: 'Photo',
  })
  photoResolver() {
    return {
      id(value: any, args: any, context: any) {
        return value.id;
      },
      name: _.property('name'),
      description: _.property('name'),
      fileName: _.property('fileName'),
      views: _.property('views'),
      isPublished: _.property('isPublished'),
    };
  }

  @Mutation()
  async submitPhoto(@Args('photoInput') photoInput: Photo) {
    const photo = await this.photoRepository.save(photoInput);
    pubSub.publish('photoAdded', { photoAdded: { ...photo } });
    return photo;
  }

  @Subscription()
  photoAdded() {
    return () => pubSub.asyncIterator('photoAdded');
  }

  @Query()
  async photos() {
    const photos = await this.photoRepository.find();
    if (photos.length > 0) {
      return photos;
    }
    return [];
  }

  @Query()
  async getPageOfPhotos(
    @Args('sortField') sortField: keyof Photo | undefined,
    @Args('sortOrder') sortOrder: 'ASC' | 'DESC' | undefined,
    @Args('page') page = 0,
    @Args('perPage') perPage = 10
  ) {
    if (page < 0) {
      page = 0;
    }
    if (perPage < 1) {
      perPage = 1;
    }
    const qb = this.photoRepository
      .createQueryBuilder('p')
      .offset(page * perPage)
      .limit(perPage);

    if (sortField && sortOrder) {
      qb.addOrderBy(sortField, sortOrder);
    }

    const [items, totalCount] = await qb.getManyAndCount();

    return {
      items,
      totalCount,
    };
  }
}
