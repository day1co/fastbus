import { BaseBus } from './fast-bus.interface';
import { RedisBus, RedisBusOpts } from './redis-bus';
import { CloudPubSubBus, CloudPubSubBusOpts } from './cloud-pubsub-bus';

type FastBusOpts = RedisBusOpts | CloudPubSubBusOpts;

export enum BusType {
  REDIS = 'Redis',
  CLOUD_PUBSUB = 'CloudPubSub',
}

export class FastBus {
  static create({ fastBusOpts, busType }: { fastBusOpts: FastBusOpts; busType?: BusType }): BaseBus | Error {
    if (busType) {
      switch (busType) {
        case BusType.REDIS:
          return new RedisBus(fastBusOpts as RedisBusOpts);
        case BusType.CLOUD_PUBSUB:
          return new CloudPubSubBus(fastBusOpts as CloudPubSubBusOpts);
        default:
          break;
      }
    }

    const fastBusBackEnd = process.env.FASTBUS_BACKEND;
    if (fastBusBackEnd === 'redis') {
      return new RedisBus(fastBusOpts as RedisBusOpts);
    } else if (fastBusBackEnd === 'gcp_pubsub') {
      return new CloudPubSubBus(fastBusOpts as CloudPubSubBusOpts);
    }

    if ('createRedisClient' in fastBusOpts) {
      return new RedisBus(fastBusOpts as RedisBusOpts);
    } else if ('createPubSubClient' in fastBusOpts) {
      return new CloudPubSubBus(fastBusOpts as CloudPubSubBusOpts);
    }

    throw new Error('no selected bus client');
  }
}
