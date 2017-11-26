import { GabliamTest } from '@gabliam/core/lib/testing';
import {
  SimpleCacheManager,
  MemoryCache,
  CACHE_MANAGER,
  CachePut,
} from '../../src/index';
import { Bean, Config, Service } from '@gabliam/core';

let g: GabliamTest;
let cache: SimpleCacheManager;
beforeEach(async () => {
  g = new GabliamTest();

  @Config()
  class CacheConfig {
    @Bean(CACHE_MANAGER)
    createCache() {
      cache = new SimpleCacheManager(new Map(), true, MemoryCache);
      return cache;
    }
  }

  g.addClass(CacheConfig);
});

describe('cache put', async () => {
  test('simple cache', async () => {
    @Service()
    class TestService {
      @CachePut('hi')
      async hi(surname: string, name: string) {
        return `hi ${surname} ${name}`;
      }
    }
    g.addClass(TestService);
    await g.build();

    const s = g.gab.container.get(TestService);
    expect(await s.hi('test', 'test')).toMatchSnapshot();
    expect(await s.hi('test', 'test')).toMatchSnapshot();
    expect(cache.getCache('hi')).toMatchSnapshot();
    expect(await s.hi('test2', 'test2')).toMatchSnapshot();
    expect(cache.getCache('hi')).toMatchSnapshot();
  });

  test('cache muliple cachenames', async () => {
    @Service()
    class TestService {
      @CachePut(['hi', 'hi2'])
      async hi(name: string) {
        return `hi ${name}`;
      }
    }
    g.addClass(TestService);
    await g.build();

    const s = g.gab.container.get(TestService);
    expect(await s.hi('test')).toMatchSnapshot();
    expect(await s.hi('test')).toMatchSnapshot();
    expect(cache.getCache('hi')).toMatchSnapshot();
    expect(cache.getCache('hi2')).toMatchSnapshot();
    expect(await s.hi('test2')).toMatchSnapshot();
    expect(cache.getCache('hi')).toMatchSnapshot();
    expect(cache.getCache('hi2')).toMatchSnapshot();
  });

  test('cache muliple cachenames', async () => {
    @Service()
    class TestService {
      @CachePut({ cacheNames: ['hi', 'hi2'] })
      async hi(name: string) {
        return `hi ${name}`;
      }
    }
    g.addClass(TestService);
    await g.build();

    const s = g.gab.container.get(TestService);
    expect(await s.hi('test')).toMatchSnapshot();
    expect(await s.hi('test')).toMatchSnapshot();
    expect(cache.getCache('hi')).toMatchSnapshot();
    expect(cache.getCache('hi2')).toMatchSnapshot();
    expect(await s.hi('test2')).toMatchSnapshot();
    expect(cache.getCache('hi')).toMatchSnapshot();
    expect(cache.getCache('hi2')).toMatchSnapshot();
  });

  test('cache args object', async () => {
    @Service()
    class TestService {
      @CachePut({ cacheNames: ['hi', 'hi2'] })
      async hi(user: { name: string }) {
        return `hi ${user.name}`;
      }
    }
    g.addClass(TestService);
    await g.build();

    const s = g.gab.container.get(TestService);
    expect(await s.hi({ name: 'test' })).toMatchSnapshot();
    expect(await s.hi({ name: 'test' })).toMatchSnapshot();
    expect(cache.getCache('hi')).toMatchSnapshot();
  });

  test('cache key', async () => {
    @Service()
    class TestService {
      @CachePut({ cacheNames: ['hi'], key: '$args[0].id' })
      async hi(user: { name: string; id: number }) {
        return `hi ${user.name}`;
      }
    }

    g.addClass(TestService);
    await g.build();

    const s = g.gab.container.get(TestService);
    expect(await s.hi({ name: 'test', id: 1 })).toMatchSnapshot();
    expect(await s.hi({ name: 'test', id: 2 })).toMatchSnapshot();
    expect(cache.getCache('hi')).toMatchSnapshot();
    expect(await s.hi({ name: 'test', id: 1 })).toMatchSnapshot();
    expect(cache.getCache('hi')).toMatchSnapshot();
  });

  test('cache condition', async () => {
    @Service()
    class TestService {
      @CachePut({ cacheNames: ['hi'], condition: '$args[0].id !== 1' })
      async hi(user: { name: string; id: number }) {
        return `hi ${user.name}`;
      }
    }

    g.addClass(TestService);
    await g.build();

    const s = g.gab.container.get(TestService);
    expect(await s.hi({ name: 'test', id: 1 })).toMatchSnapshot();
    expect(await s.hi({ name: 'test', id: 2 })).toMatchSnapshot();
    expect(cache.getCache('hi')).toMatchSnapshot();
    expect(await s.hi({ name: 'test', id: 1 })).toMatchSnapshot();
    expect(cache.getCache('hi')).toMatchSnapshot();
  });

  test('cache condition + key', async () => {
    @Service()
    class TestService {
      @CachePut({
        cacheNames: 'hi',
        condition: '$args[0].id !== 1',
        key: '$args[0].name'
      })
      async hi(user: { name: string; id: number }) {
        return `hi ${user.name}`;
      }
    }

    g.addClass(TestService);
    await g.build();

    const s = g.gab.container.get(TestService);
    expect(await s.hi({ name: 'test', id: 1 })).toMatchSnapshot();
    expect(await s.hi({ name: 'test', id: 2 })).toMatchSnapshot();
    expect(await s.hi({ name: 'test', id: 3 })).toMatchSnapshot();
    expect(cache.getCache('hi')).toMatchSnapshot();
    expect(await s.hi({ name: 'test', id: 4 })).toMatchSnapshot();
    expect(cache.getCache('hi')).toMatchSnapshot();
  });

  describe('errors', () => {
    test('Throw error when @CachePut on a sync method', async () => {
      expect(() => {
        @Service()
        class TestService {
          @CachePut({
            cacheNames: 'hi',
            condition: '$args[0].id !== 1',
            key: '$args[0].name'
          })
          hi(user: { name: string; id: number }) {
            return `hi ${user.name}`;
          }
        }
        // tslint:disable-next-line:no-unused-expression
        new TestService();
      }).toThrowErrorMatchingSnapshot();
    });

    test('error on condition', async () => {
      @Service()
      class TestService {
        @CachePut({ cacheNames: 'hi', condition: 'const test = lol'})
        async hi(surname: string, name: string) {
          return `hi ${surname} ${name}`;
        }
      }
      g.addClass(TestService);
      await g.build();

      const s = g.gab.container.get(TestService);
      expect(await s.hi('test', 'test')).toMatchSnapshot();
      expect(await s.hi('test', 'test')).toMatchSnapshot();
      expect(cache.getCache('hi')).toMatchSnapshot();
      expect(await s.hi('test2', 'test2')).toMatchSnapshot();
      expect(cache.getCache('hi')).toMatchSnapshot();
    });

    test('error on key', async () => {
      @Service()
      class TestService {
        @CachePut({ cacheNames: 'hi', key: '{const test = lol}'})
        async hi(surname: string, name: string) {
          return `hi ${surname} ${name}`;
        }
      }
      g.addClass(TestService);
      await g.build();

      const s = g.gab.container.get(TestService);
      expect(await s.hi('test', 'test')).toMatchSnapshot();
      expect(await s.hi('test', 'test')).toMatchSnapshot();
      expect(cache.getCache('hi')).toMatchSnapshot();
      expect(await s.hi('test2', 'test2')).toMatchSnapshot();
      expect(cache.getCache('hi')).toMatchSnapshot();
    });
  });
});