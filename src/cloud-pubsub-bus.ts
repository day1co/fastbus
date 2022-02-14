import Debug from 'debug';
import { PubSub, ClientConfig } from '@google-cloud/pubsub';
import { BaseBus, FastBusOpts, FastBusSubscriber } from './fast-bus.interface';
const debug = Debug('fastbus');

interface CloudPubsubBusOpts extends FastBusOpts {
  ClientConfig: ClientConfig;
}

export class CloudPubSubBus implements BaseBus {
  prefix?: string;
  pubsub: PubSub;

  constructor(opts?: CloudPubsubBusOpts) {
    this.pubsub = new PubSub(opts?.ClientConfig);
    this.prefix = opts?.prefix;
  }

  publish(topic: string, message: string, broadcast: boolean = false) {
    if (broadcast) {
      debug('**warning** broadcast is not implemented!');
      return;
    }
    // to implement
  }

  subscribe(topic: string, listener: FastBusSubscriber) {
    // to implement
  }

  unsubscribe(topic: string, listener: FastBusSubscriber) {
    // to implement
  }

  unsubscribeAll(topic?: string) {
    // to implement
  }

  destroy() {
    this.unsubscribeAll();
  }

  static create(opts?: CloudPubsubBusOpts): CloudPubSubBus {
    return new CloudPubSubBus(opts);
  }
}
