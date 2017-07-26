import * as path from 'path';
import { Gabliam } from '../gabliam';
import { LoaderTest } from './loader';
import { METADATA_KEY } from '../constants';
import { RegistryMetada } from '../interfaces';

export class GabliamTest {
  public gab: Gabliam;

  public loader: LoaderTest;

  constructor(gab?: Gabliam) {
    if (gab) {
      this.gab = gab;
    } else {
      this.gab = new Gabliam({
        scanPath: path.resolve(__dirname, 'gabliam'),
        configPath: path.resolve(__dirname, 'gabliam')
      });
    }

    this.loader = this.gab.loader = new LoaderTest();
  }

  async start() {
    await this.gab.build();
  }

  async destroy() {
    await this.gab.destroy();
  }

  addConf(p: string, conf: any) {
    this.loader.addConfig(p, conf);
  }

  addClass(ctrl: any) {
    if (Reflect.hasOwnMetadata(METADATA_KEY.register, ctrl)) {
      const metadata = <RegistryMetada>Reflect.getOwnMetadata(
        METADATA_KEY.register,
        ctrl
      );
      this.gab.registry.add(metadata.type, metadata.value);
    }
    return this;
  }
}