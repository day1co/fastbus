import Debug from 'debug';
import { PubSub, ClientConfig, Subscription, Message } from '@google-cloud/pubsub';
import { EventEmitter } from 'events';
import { BaseBus, FastBusOpts, FastBusSubscriber } from './fast-bus.interface';
const debug = Debug('fastbus');

interface CloudPubsubBusOpts extends FastBusOpts {
  clientConfig: ClientConfig;
  topicPrefix?: string;
  subscriptionPrefix?: string;
}

export class CloudPubSubBus implements BaseBus {
  busType: string;
  topicPrefix?: string;
  subscriptionPrefix?: string;
  pubsub: PubSub;
  subscribeClients: Record<string, Subscription>;
  subscriptions: EventEmitter;

  constructor(opts?: CloudPubsubBusOpts) {
    this.pubsub = new PubSub(opts?.clientConfig);
    this.busType = 'CloudPubSub';
    this.topicPrefix = opts?.topicPrefix || '';
    this.subscriptionPrefix = opts?.subscriptionPrefix || '';
    this.subscribeClients = {};

    this.subscriptions = new EventEmitter();
    this.subscriptions.setMaxListeners(Infinity);
  }

  publish(topic: string, message: string, broadcast: boolean = false) {
    if (broadcast) {
      debug('broadcast is not implemented!');
      return;
    }
    const dataBuffer = Buffer.from(message);
    const topicName = this.toTopicName(topic);
    this.pubsub
      .topic(topicName)
      .publish(dataBuffer)
      .then((messageId) => {
        debug(`Message ${messageId} published`);
      })
      .catch((err) => {
        debug('**warning** publish error!', topicName, message, JSON.stringify(err));
      });
  }

  subscribe(topic: string, listener: FastBusSubscriber) {
    const subscriptionName = this.toSubscriptionName(topic);
    this.subscriptions.on(subscriptionName, listener);
    this.onSubscription(subscriptionName);
  }

  unsubscribe(topic: string, listener: FastBusSubscriber) {
    this.subscriptions.off(this.toSubscriptionName(topic), listener);
  }

  unsubscribeAll(topic?: string) {
    if (topic) {
      const subscriptionName = this.toSubscriptionName(topic);
      this.subscriptions.removeAllListeners(subscriptionName);
      this.getSubscribeClient(subscriptionName).removeAllListeners();
    } else {
      this.subscriptions.removeAllListeners();
      for (const subscriptionName in this.subscribeClients) {
        this.getSubscribeClient(subscriptionName).removeAllListeners();
      }
    }
  }

  private onSubscription(subscriptionName: string) {
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
          debug(`Received message: id ${message.id}, data ${message.data}`);
          message.ack();
          const listener = this.subscriptions.listeners(subscriptionName)[0];
          listener(message.data.toString());
        })
        .on('error', (err) => {
          debug('**warning** subscribe error!', JSON.stringify(err));
        });
    }

    if (!subscribeClient.isOpen) {
      subscribeClient.open();
    }
  }

  private toTopicName(topic: string) {
    return this.topicPrefix + topic;
  }

  private toSubscriptionName(topic: string) {
    return this.subscriptionPrefix + topic;
  }

  private getSubscribeClient(subscriptionName) {
    return this.subscribeClients[subscriptionName];
  }

  destroy() {
    this.unsubscribeAll();
    this.pubsub.close();
  }

  static create(opts?: CloudPubsubBusOpts): CloudPubSubBus {
    return new CloudPubSubBus(opts);
  }
}
