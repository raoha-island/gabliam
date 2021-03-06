/** Type in registry */
export const TYPE = {
  Controller: 'GraphqlController',
};

export const METADATA_KEY = {
  controllerParameter: 'graphql_controller-parameter',
  controller: 'graphql_controller',
  resolver: 'graphql_resolver',
};

export const GRAPHQL_CONFIG = Symbol('GABLIAM/GRAPHQL_PLUGIN_CONFIG');

export const DEBUG_PATH = 'Gabliam:Plugin:GraphqlCore';

export const DEFAULT_END_POINT_URL = '/graphql';

export enum PARAMETER_TYPE {
  PARENT = 'parent',
  ARGS = 'args',
  CONTEXT = 'context',
  INFO = 'info',
}
