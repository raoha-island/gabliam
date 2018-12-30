import {
  Container,
  GabliamPlugin,
  Plugin,
  reflection,
  Registry,
  Scan,
} from '@gabliam/core';
import * as d from 'debug';
import { AmqpConnectionManager } from './amqp-manager';
import { TYPE } from './constants';
import {
  CUnit,
  RabbitConsumer,
  RabbitHandler,
  RabbitListener,
} from './decorators';

const debug = d('Gabliam:Plugin:AmqpPlugin');

@Plugin()
@Scan()
export class AmqpPlugin implements GabliamPlugin {
  /**
   * binding phase
   *
   * Bind all controller and bind express app
   * @param  {Container} container
   * @param  {Registry} registry
   */
  bind(container: Container, registry: Registry) {
    debug('bind AmqpPlugin');
    registry.get(TYPE.RabbitController).forEach(({ id, target }) =>
      container
        .bind(id)
        .to(target)
        .inSingletonScope()
    );
  }

  build(container: Container, registry: Registry) {
    debug('build AmqpPlugin');
    const controllerIds = registry.get(TYPE.RabbitController);
    const connectionManager = container.get(AmqpConnectionManager);
    debug('controllerIds', controllerIds, container);
    controllerIds.forEach(({ id: controllerId }) => {
      const controller = container.get<any>(controllerId);
      debug('controller', controller);

      const handlerMetadatas = reflection.propMetadataOfDecorator<
        RabbitHandler
      >(controller.constructor, RabbitConsumer, RabbitListener);

      const [cunit] = reflection
        .annotationsOfDecorator<CUnit>(controller.constructor, CUnit)
        .slice(-1);

      if (Object.keys(handlerMetadatas)) {
        for (const [key, metas] of Object.entries(handlerMetadatas)) {
          const [handlerMetadata] = metas.slice(-1);
          if (cunit) {
            connectionManager
              .getConnection(cunit.name)
              .constructAndAddConsume(key, handlerMetadata, controller);
          } else {
            connectionManager
              .getDefaultConnection()
              .constructAndAddConsume(key, handlerMetadata, controller);
          }
        }
      }
    });
  }

  async start(container: Container, registry: Registry) {
    const connection = container.get(AmqpConnectionManager);
    await connection.start();
  }

  async stop(container: Container, registry: Registry) {
    const connection = container.get(AmqpConnectionManager);
    await connection.stop();
  }
}
