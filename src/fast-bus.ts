import { CloudPubSubBus, CloudPubSubBusOpts } from './cloud-pubsub-bus';
import { BaseBus } from './fast-bus.interface';
import { LocalBus, LocalBusOpts } from './local-bus';
import { RedisBus, RedisBusOpts } from './redis-bus';

type FastBusOpts = RedisBusOpts | CloudPubSubBusOpts | LocalBusOpts;

export enum BusType {
  REDIS = 'Redis',
  CLOUD_PUBSUB = 'CloudPubSub',
  LOCAL = 'Local',
}

export class FastBus {
  static create({ fastBusOpts, busType }: { fastBusOpts: FastBusOpts; busType?: BusType }): BaseBus {
    if (busType) {
      switch (busType) {
        case BusType.REDIS:
          return new RedisBus(fastBusOpts as RedisBusOpts);
        case BusType.CLOUD_PUBSUB:
          return new CloudPubSubBus(fastBusOpts as CloudPubSubBusOpts);
        case BusType.LOCAL:
          return new LocalBus(fastBusOpts as LocalBusOpts);
        default:
          break;
      }
    }

    const fastBusBackEnd = process.env.FASTBUS_BACKEND;
    if (fastBusBackEnd === 'redis') {
      return new RedisBus(fastBusOpts as RedisBusOpts);
    } else if (fastBusBackEnd === 'gcp_pubsub') {
      return new CloudPubSubBus(fastBusOpts as CloudPubSubBusOpts);
    } else if (fastBusBackEnd === 'local') {
      return new LocalBus(fastBusOpts as LocalBusOpts);
    }

    if ('createRedisClient' in fastBusOpts) {
      return new RedisBus(fastBusOpts as RedisBusOpts);
    } else if ('createPubSubClient' in fastBusOpts) {
      return new CloudPubSubBus(fastBusOpts as CloudPubSubBusOpts);
    }

    throw new Error('no selected bus client');
  }
}
