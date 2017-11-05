import { KoaConfig } from '../../src/decorators';
import { KoaConfigMetadata } from '../../src/interfaces';
import { METADATA_KEY } from '../../src/constants';

describe('KoaConfig decorator', () => {
  test('should add KoaConfig metadata to a class when decorated with @KoaConfig', () => {
    class TestConfig {
      @KoaConfig()
      testMethod() {}

      @KoaConfig()
      test2Method() {}
    }

    const koaConfigMetadata: KoaConfigMetadata[] = Reflect.getMetadata(
      METADATA_KEY.MiddlewareConfig,
      TestConfig
    );

    expect(koaConfigMetadata).toMatchSnapshot();
  });

  test('should add KoaConfig metadata to a class when decorated with @KoaConfig(order)', () => {
    class TestConfig {
      @KoaConfig(50)
      testMethod() {}

      @KoaConfig(100)
      test2Method() {}
    }

    const koaConfigMetadata: KoaConfigMetadata[] = Reflect.getMetadata(
      METADATA_KEY.MiddlewareConfig,
      TestConfig
    );

    expect(koaConfigMetadata).toMatchSnapshot();
  });

  test('should fail when decorated multiple times the same method with @KoaConfig', () => {
    expect(function() {
      class TestConfig {
        @KoaConfig()
        @KoaConfig(50)
        testMethod() {}

        @KoaConfig(100)
        test2Method() {}
      }
      // tslint:disable-next-line:no-unused-expression
      new TestConfig();
    }).toThrowError();
  });
});
