import { inversifyInterfaces, Container } from '@gabliam/core';
import { MiddlewareMetadata, MiddlewareConfigurator } from '../interfaces';
import { METADATA_KEY } from '../constants';
import { isMiddlewareDefinition } from '../utils';
import { koaRouter } from '../koa';

/**
 * Add middlewares metadata.
 *  If key is undefined, add the list of middlewares for a class (target)
 *  else add the list of middlewares for a method (key) of a class (target)
 *
 * @param  {MiddlewareMetadata[]} middlewares
 * @param  {Object} target
 * @param  {string} key?
 */
export function addMiddlewareMetadata(
  middlewares: MiddlewareMetadata[],
  target: Object,
  key?: string
) {
  let metadataList: MiddlewareMetadata[] = [];

  // add key! for disable false error
  // if key is undefined => middleware metadata for class else for method
  if (!Reflect.hasOwnMetadata(METADATA_KEY.middleware, target, key!)) {
    Reflect.defineMetadata(METADATA_KEY.middleware, metadataList, target, key!);
  } else {
    metadataList = Reflect.getOwnMetadata(
      METADATA_KEY.middleware,
      target,
      key!
    );
  }

  metadataList.push(...middlewares);
}

/**
 * Get middlewares metadata.
 * If key is undefined, return the list of middlewares for a class (target)
 *  else return the list of middlewares for a method (key) of a class (target)
 * @param  {Container} container
 * @param  {Object} target
 * @param  {string} key?
 * @returns koaRouter.IMiddleware[]
 */
export function getMiddlewares(
  container: Container,
  target: Object,
  key?: string
): koaRouter.IMiddleware[] {
  let metadataList: MiddlewareMetadata[] = [];
  if (Reflect.hasOwnMetadata(METADATA_KEY.middleware, target, key!)) {
    metadataList = Reflect.getOwnMetadata(
      METADATA_KEY.middleware,
      target,
      key!
    );
  }

  /**
   * resolve a middleware
   * @param middleware
   */
  function resolveMiddleware(
    middleware: MiddlewareMetadata
  ): koaRouter.IMiddleware {
    try {
      // test if the middleware is a ServiceIdentifier
      return container.get<
        koaRouter.IMiddleware
      >(<inversifyInterfaces.ServiceIdentifier<any>>middleware);
    } catch (e) {
      return <koaRouter.IMiddleware>middleware;
    }
  }

  return metadataList.reduce<koaRouter.IMiddleware[]>((prev, metadata) => {
    if (isMiddlewareDefinition(metadata)) {
      // if is a middleware definition, so get MiddlewareConfigurator and call with values
      const middleware = container.get<MiddlewareConfigurator>(
        `${metadata.name}Middleware`
      )(...metadata.values);

      // MiddlewareConfigurator can return an array or one middleware
      if (Array.isArray(middleware)) {
        prev.push(...middleware);
      } else {
        prev.push(middleware);
      }
    } else {
      prev.push(resolveMiddleware(metadata));
    }

    return prev;
  }, []);
}