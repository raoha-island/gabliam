import {
  Container,
  Registry,
  toPromise,
  ValueExtractor,
  VALUE_EXTRACTOR,
} from '@gabliam/core';
import { find, get } from 'lodash';
import {
  CONTEXT,
  DEFAULT_PARAM_VALUE,
  METADATA_KEY,
  PARAMETER_TYPE,
  TYPE,
  WEB_PLUGIN_CONFIG,
} from './constants';
import {
  ControllerMetadata,
  ControllerMethodMetadata,
  ControllerParameterMetadata,
  getInterceptors,
  InterceptorInfo,
  ParameterMetadata,
} from './decorators';
import { ExecutionContext } from './execution-context';
import { GabContext } from './gab-context';
import { MethodInfo, RestMetadata, WebPluginConfig } from './plugin-config';
import { getValidateInterceptor } from './validate';
import { convertValueFn } from './interface';

export const cleanPath = (path: string) => {
  return path.replace(/\/+/gi, '/');
};

export const extractParameters = <T extends Object, U extends keyof T, V>(
  target: T,
  key: U,
  execCtx: ExecutionContext | null | undefined,
  ctx: GabContext,
  next: V,
  params: ParameterMetadata[]
): any[] => {
  const args = [];
  if (!params || !params.length) {
    return [ctx.request, ctx.response, next];
  }

  // create de param getter
  const getParam = getFuncParam(target, key);
  for (const item of params) {
    switch (item.type) {
      case PARAMETER_TYPE.CONTEXT:
      default:
        args[item.index] = ctx;
        break; // response
      case PARAMETER_TYPE.RESPONSE:
        args[item.index] = getParam(ctx.response, null, item);
        break;
      case PARAMETER_TYPE.REQUEST:
        args[item.index] = getParam(ctx.request, null, item);
        break;
      case PARAMETER_TYPE.NEXT:
        args[item.index] = next;
        break;
      case PARAMETER_TYPE.PARAMS:
        args[item.index] = getParam(ctx.request, 'params', item);
        break;
      case PARAMETER_TYPE.QUERY:
        args[item.index] = getParam(ctx.request, 'query', item);
        break;
      case PARAMETER_TYPE.BODY:
        args[item.index] = getParam(ctx.request, 'body', item);
        break;
      case PARAMETER_TYPE.HEADERS:
        args[item.index] = getParam(ctx.request, 'headers', item);
        break;
      case PARAMETER_TYPE.COOKIES:
        args[item.index] = getParam(ctx, 'cookies', item, true);
        break;
      case PARAMETER_TYPE.EXEC_CONTEXT:
        args[item.index] = execCtx;
        break;
    }
  }

  return args;
};

const getFuncParam = <T extends Object, U extends keyof T>(
  target: T,
  key: U
) => {
  return (
    source: any,
    paramType: string | null,
    itemParam: ParameterMetadata,
    getter = false
  ) => {
    const name = itemParam.parameterName;

    // get the param source
    let param = source;
    if (paramType !== null && source[paramType]) {
      param = source[paramType];
    }

    let res = getter ? param.get(name) : get(param, name, undefined);
    if (res !== undefined) {
      /**
       * For query, all value sare considered to string value.
       * If the query waits for a Number, we try to convert the value
       */
      if (paramType === 'query' || paramType === 'params') {
        const type: Function[] = Reflect.getMetadata(
          'design:paramtypes',
          target,
          <any>key
        );
        if (Array.isArray(type) && type[itemParam.index]) {
          try {
            if (type[itemParam.index].name === 'Number') {
              // parseFloat for compatibility with integer and float
              res = Number.parseFloat(res);
            }
          } catch (e) {}
        }
      }
      return res;
    } else {
      return name === DEFAULT_PARAM_VALUE ? param : undefined;
    }
  };
};

/**
 * Build all controllers
 *
 * @param  {Container} container
 * @param  {Registry} registry
 */
export const extractControllerMetadata = (
  container: Container,
  registry: Registry
) => {
  const restConfig = container.get<WebPluginConfig>(WEB_PLUGIN_CONFIG);
  const valueExtractor = container.get<ValueExtractor>(VALUE_EXTRACTOR);

  const controllerIds = registry.get(TYPE.Controller);
  const restMetadata: RestMetadata = {
    ...restConfig,
    controllerInfo: new Map(),
  };

  controllerIds.forEach(({ id: controllerId }) => {
    const controller = container.get<object>(controllerId);

    const controllerMetadata: ControllerMetadata = Reflect.getOwnMetadata(
      METADATA_KEY.controller,
      controller.constructor
    );

    const controllerInterceptors = getInterceptors(
      container,
      controller.constructor
    );

    const methodMetadatas: ControllerMethodMetadata[] = Reflect.getOwnMetadata(
      METADATA_KEY.controllerMethod,
      controller.constructor
    );

    const parameterMetadata: ControllerParameterMetadata = Reflect.getOwnMetadata(
      METADATA_KEY.controllerParameter,
      controller.constructor
    );
    // if the controller has controllerMetadata and methodMetadatas
    if (controllerMetadata && methodMetadatas) {
      const controllerPath = valueExtractor(
        controllerMetadata.path,
        controllerMetadata.path
      );

      const methods: MethodInfo[] = [];

      restMetadata.controllerInfo.set(controllerId, {
        controllerPath,
        methods,
      });

      methodMetadatas.forEach((methodMetadata: ControllerMethodMetadata) => {
        let paramList: ParameterMetadata[] = [];
        if (parameterMetadata) {
          paramList = parameterMetadata.get(methodMetadata.key) || [];
        }
        let methodPath = cleanPath(
          valueExtractor(methodMetadata.path, methodMetadata.path)
        );

        if (methodPath[0] !== '/') {
          methodPath = '/' + methodPath;
        }

        const methodInterceptors = getInterceptors(
          container,
          controller.constructor,
          methodMetadata.key
        );

        const validatorInterceptors = getValidateInterceptor(container);

        const methodJson = Reflect.getMetadata(
          METADATA_KEY.responseBody,
          controller.constructor,
          methodMetadata.key
        );

        const interceptors = [
          ...validatorInterceptors,
          ...controllerInterceptors,
          ...methodInterceptors,
        ];

        // if method is true or controller is true and method undefined
        const json =
          methodJson || (controllerMetadata.json && methodJson === undefined);

        methods.push({
          controllerId,
          methodName: methodMetadata.key,
          json,
          paramList,
          methodPath,
          method: methodMetadata.method,
          interceptors,
        });
      });
    }
  });

  return restMetadata;
};

export const getContext = (req: any) => {
  return <GabContext>(<any>req)[CONTEXT];
};

export const setContext = (req: any, context: GabContext) => {
  (<any>req)[CONTEXT] = context;
};

export function compose(
  interceptors: InterceptorInfo[],
  converterValue: convertValueFn
) {
  return async function(
    ctx: GabContext,
    execCtx: ExecutionContext,
    next: () => Promise<any>
  ) {
    let index = -1;
    async function dispatch(i: number) {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;
      const interceptor = interceptors[i];

      if (i === interceptors.length) {
        const nextRes = converterValue(ctx, execCtx, await next());
        return Promise.resolve(nextRes);
      }

      if (!interceptor) {
        return Promise.resolve();
      }

      const { instance, paramList } = interceptor;

      const callNext = dispatch.bind(null, i + 1);
      const interceptorArgs = extractParameters(
        instance,
        'intercept',
        execCtx,
        ctx,
        callNext,
        paramList
      );
      const res = await toPromise(instance.intercept(...interceptorArgs));
      converterValue(ctx, execCtx, res);
      // call next if interceptor not use next
      if (find(paramList, { type: PARAMETER_TYPE.NEXT }) === undefined) {
        await callNext();
      }
    }

    return dispatch(0);
  };
}