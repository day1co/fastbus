import pino from 'pino';
import { PubSub, ClientConfig, Subscription, Message } from '@google-cloud/pubsub';
import { EventEmitter } from 'events';
import { BaseBus, FastBusSubscriber } from './fast-bus.interface';

const logger = pino({ name: 'cloud-pubsub-bus' });

export interface CloudPubSubBusOpts {
  clientConfig: ClientConfig;
  topicPrefix?: string;
  subscriptionPrefix?: string;
  createPubSubClient?: (ClientConfig) => PubSub;
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
    // 1. this.subscribe() 메소드를 호출할때마다 evenEmitter 생성
    this.eventEmitter.on(subscriptionName, listener);

    // 2. GCP pub/sub의 subscriptionName으로 생성된 인스턴스를 가져옴 (싱글톤)
    let subscribeClient = this.getSubscribeClient(subscriptionName);
    // 3. 생성된 인스턴스가 없으면 새로운 인스턴스를 생성
    if (!subscribeClient) {
      // pubsub.subscription을 사용해 subscriptionName 기준으로 인스턴스 생성 후 this.subscriptions 객체에 저장
      this.subscriptions[subscriptionName] = this.pubsub.subscription(subscriptionName);
      subscribeClient = this.getSubscribeClient(subscriptionName);
    }

    // 4. subscribeClient에 리스너가 없으면
    if (subscribeClient.listenerCount('message') === 0) {
      // 5. subscribeClient에 리스너가 없으면 pub/sub client 리스너를 등록
      subscribeClient
        .on('message', (message: Message) => {
          // 6. node event emitter 가 없으면 메시지를 수신할 수 없다는 의미로, nack 신호를 보냄 (다른 노드 프로세스의 컨슈머가 처리하기를 의도함)
          if (this.eventEmitter.listenerCount(subscriptionName) === 0) {
            this.getSubscribeClient(subscriptionName).removeAllListeners();
            message.nack();
            return;
          }
          logger.debug(`received message: id ${message.id}, data ${message.data}`);
          // 7. 94 line을 통과한 것은 node 프로세스에 처리해줄 listener가 등록 되어있다는 의미로 message ack 신호를 보냄
          message.ack();
          // 8. node 프로세스에 등록된 evenEmitter의 listener를 가져와 실행함
          const listener = this.eventEmitter.listeners(subscriptionName)[0];
          listener(message.data.toString());
        })
        .on('error', (err) => {
          logger.error(`subscribe error!, subscription name: ${subscriptionName}, error message ${err.message}`);
        });
    }

    // 9. this.subscriptions에 subscriptionName 인스턴스가 존재하고 listener가 존재하지만 closed 상황일때 (subscribeClient 인스턴스의 isOpen 값이 false 일 때),
    //    this.subscribe() 메소드가 한번 더 호출 되면 새로운 pub/sub lister를 등록하지 않고 (89~109 line), isOpen을 true 상태로 변경함.
    //    ** this.subscription에 저장된 pubsub client 인스턴스에 listener 갯수가 0인 상황에서는 자동으로 isOpen = false 상태가 되고, 더 이상 메시지를 받을 수 없는 상태가 됨. **
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
    return this.subscriptions[subscriptionName];
  }

  destroy() {
    this.unsubscribeAll();
    this.pubsub.close();
  }
}
