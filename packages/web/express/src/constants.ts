/**
 * Represent a custom router creator
 *
 * If you want a custom router use this const for create your router
 *
 * ## Sample
 * @Config()
 * class Conf {
 *  @Bean(CUSTOM_ROUTER_CREATOR)
 *  custom() {
 *    return () =>
 *      e.Router({
 *        caseSensitive: true
 *      });
 *  }
 * }
 */
export const CUSTOM_ROUTER_CREATOR = Symbol('GABLIAM/CUSTOM_ROUTER_CREATOR');

export const EXPRESS_PLUGIN_CONFIG = Symbol('GABLIAM/EXPRESS_PLUGIN_CONFIG');

export const METADATA_KEY = {
  expressInterceptor: '_express_interceptor',
};
