import pino from 'pino';
import { PubSub, ClientConfig, Subscription, Message } from '@google-cloud/pubsub';
import { EventEmitter } from 'events';
import { BaseBus, FastBusSubscriber } from './fast-bus.interface';

const logger = pino({ name: 'cloud-pubsub-bus' });

export interface CloudPubSubBusOpts {
  clientConfig: ClientConfig;
  topicPrefix?: string;
  subscriptionPrefix?: string;
  createPubSubClient?: (opts: ClientConfig) => PubSub;
}

export class CloudPubSubBus implements BaseBus {
  pubsub: PubSub;
  eventEmitter: EventEmitter;
  subscriptions: Record<string, Subscription>;

  topicPrefix: string;
  subscriptionPrefix: string;

  constructor(opts: CloudPubSubBusOpts) {
    this.pubsub = opts.createPubSubClient ? opts.createPubSubClient(opts.clientConfig) : new PubSub(opts.clientConfig);
    logger.debug(`connect cloud pub sub: ${opts.clientConfig.projectId}`);

    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(Infinity);
    this.subscriptions = {};

    this.topicPrefix = opts.topicPrefix ?? '';
    this.subscriptionPrefix = opts.subscriptionPrefix ?? '';
  }

  publish(topic: string, message: string, broadcast = false) {
    if (broadcast) {
      logger.warn('broadcast is not implemented!');
      return;
    }
    const dataBuffer = Buffer.from(message);
    const topicName = this.getTopicName(topic);
    this.pubsub
      .topic(topicName)
      .publish(dataBuffer)
      .then((messageId) => {
        logger.debug(`message ${messageId} published`);
      })
      .catch((err) => {
        logger.error(`publish error!', topicName: ${topicName}, message: ${message}, error message: ${err.message}`);
      });
  }

  subscribe(topic: string, listener: FastBusSubscriber) {
    const subscriptionName = this.getSubscriptionName(topic);
    this.onSubscription(subscriptionName, listener);
  }

  unsubscribe(topic: string, listener: FastBusSubscriber) {
    this.eventEmitter.off(this.getSubscriptionName(topic), listener);
  }

  unsubscribeAll(topic?: string) {
    if (topic) {
      const subscriptionName = this.getSubscriptionName(topic);
      this.eventEmitter.removeAllListeners(subscriptionName);
      this.getSubscribeClient(subscriptionName).removeAllListeners();
    } else {
      this.eventEmitter.removeAllListeners();
      for (const subscriptionName in this.subscriptions) {
        this.getSubscribeClient(subscriptionName).removeAllListeners();
      }
    }
  }

  private onSubscription(subscriptionName: string, listener: FastBusSubscriber) {
    this.eventEmitter.on(subscriptionName, listener);

    let subscribeClient = this.getSubscribeClient(subscriptionName);
    if (!subscribeClient) {
      this.subscriptions[subscriptionName] = this.pubsub.subscription(subscriptionName);
      subscribeClient = this.getSubscribeClient(subscriptionName);
    }

    if (subscribeClient.listenerCount('message') === 0) {
      subscribeClient
        .on('message', (message: Message) => {
          if (this.eventEmitter.listenerCount(subscriptionName) === 0) {
            this.getSubscribeClient(subscriptionName).removeAllListeners();
            message.nack();
            return;
          }
          logger.debug(`received message: id ${message.id}, data ${message.data}`);
          message.ack();
          const listener = this.eventEmitter.listeners(subscriptionName)[0];
          listener(message.data.toString());
        })
        .on('error', (err) => {
          logger.error(`subscribe error!, subscription name: ${subscriptionName}, error message ${err.message}`);
        });
    }

    if (!subscribeClient.isOpen) {
      subscribeClient.open();
    }
  }

  private getTopicName(topic: string) {
    return this.topicPrefix + topic;
  }

  private getSubscriptionName(topic: string) {
    return this.subscriptionPrefix + topic;
  }

  private getSubscribeClient(subscriptionName: string) {
    return this.subscriptions[subscriptionName];
  }

  destroy() {
    this.unsubscribeAll();
    this.pubsub.close();
  }
}
