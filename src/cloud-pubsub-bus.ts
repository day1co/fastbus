import pino from 'pino';
import { PubSub, ClientConfig, Subscription, Message } from '@google-cloud/pubsub';
import { EventEmitter } from 'events';
import { BaseBus, FastBusSubscriber } from './fast-bus.interface';

const logger = pino({ name: 'cloud-pubsub-bus' });

interface CloudPubsubBusOpts {
  clientConfig: ClientConfig;
  topicPrefix?: string;
  subscriptionPrefix?: string;
}

export class CloudPubSubBus implements BaseBus {
  pubsub: PubSub;
  subscriptions: EventEmitter;
  subscribeClients: Record<string, Subscription>;

  topicPrefix: string;
  subscriptionPrefix: string;

  constructor(opts: CloudPubsubBusOpts) {
    this.pubsub = new PubSub(opts.clientConfig);
    this.subscriptions = new EventEmitter();
    this.subscriptions.setMaxListeners(Infinity);
    this.subscribeClients = {};

    this.topicPrefix = opts.topicPrefix ?? '';
    this.subscriptionPrefix = opts.subscriptionPrefix ?? '';
  }

  publish(topic: string, message: string, broadcast: boolean = false) {
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
        logger.debug(`Message ${messageId} published`);
      })
      .catch((err) => {
        logger.error('publish error!', topicName, message, JSON.stringify(err));
      });
  }

  subscribe(topic: string, listener: FastBusSubscriber) {
    const subscriptionName = this.getSubscriptionName(topic);
    this.onSubscription(subscriptionName, listener);
  }

  unsubscribe(topic: string, listener: FastBusSubscriber) {
    this.subscriptions.off(this.getSubscriptionName(topic), listener);
  }

  unsubscribeAll(topic?: string) {
    if (topic) {
      const subscriptionName = this.getSubscriptionName(topic);
      this.subscriptions.removeAllListeners(subscriptionName);
      this.getSubscribeClient(subscriptionName).removeAllListeners();
    } else {
      this.subscriptions.removeAllListeners();
      for (const subscriptionName in this.subscribeClients) {
        this.getSubscribeClient(subscriptionName).removeAllListeners();
      }
    }
  }

  private onSubscription(subscriptionName: string, listener: FastBusSubscriber) {
    this.subscriptions.on(subscriptionName, listener);

    let subscribeClient = this.getSubscribeClient(subscriptionName);
    if (!subscribeClient) {
      this.subscribeClients[subscriptionName] = this.pubsub.subscription(subscriptionName);
      subscribeClient = this.getSubscribeClient(subscriptionName);
    }

    if (subscribeClient.listenerCount('message') === 0) {
      subscribeClient
        .on('message', (message: Message) => {
          if (this.subscriptions.listenerCount(subscriptionName) === 0) {
            this.getSubscribeClient(subscriptionName).removeAllListeners();
            message.nack();
            return;
          }
          logger.debug(`Received message: id ${message.id}, data ${message.data}`);
          message.ack();
          const listener = this.subscriptions.listeners(subscriptionName)[0];
          listener(message.data.toString());
        })
        .on('error', (err) => {
          logger.error('subscribe error!', JSON.stringify(err));
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

  private getSubscribeClient(subscriptionName) {
    return this.subscribeClients[subscriptionName];
  }

  destroy() {
    this.unsubscribeAll();
    this.pubsub.close();
  }
}
