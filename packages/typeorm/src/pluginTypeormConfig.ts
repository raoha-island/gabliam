import { PluginConfig, Value, optional, Bean, CORE_CONFIG, inject, interfaces } from '@gabliam/core';
import { ConnectionOptions, Connection, createConnection } from './typeorm';
import { ConnectionOptionsBeanId } from './constant';
import * as d from 'debug';

const debug = d('Gabliam:Plugin:Typeorm');

@PluginConfig()
export class PluginTypeormConfig {

  @Value('application.typeorm.connectionOptions')
  connectionOptions: ConnectionOptions;

  @Value('application.typeorm.entitiesPath')
  entitiesPath: string;

  constructor(
    @inject(ConnectionOptionsBeanId) @optional() connectionOptions: ConnectionOptions,
    @inject(CORE_CONFIG) config: interfaces.GabliamConfig
  ) {
    debug('constructor PluginTypeormConfig', connectionOptions, config);
    this.connectionOptions = connectionOptions;
    this.entitiesPath = `${config.scanPath}/**/*{.js,.ts}`;
  }

  @Bean(Connection)
  create() {
    debug('connectionOptions', this.connectionOptions);
    if (!this.connectionOptions) {
      throw new Error(`PluginTypeormConfig connectionOptions is mandatory`);
    }
    const connectionOptions = this.connectionOptions;
    const entities: any = connectionOptions.entities || [];
    entities.push(this.entitiesPath);

    return createConnection({
      ...connectionOptions,
      entities
    });
  }
}