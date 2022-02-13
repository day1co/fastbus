import Debug from 'debug';
import { EventEmitter } from 'events';
import { ClientOpts, RedisClient, createClient } from 'redis';

const debug = Debug('fastbus');

interface FastBusOpts {
  prefix?: string;
  redis?: ClientOpts;
  createRedisClient?: (ClientOpts) => RedisClient;
}

interface FastBusSubscriber {
  (string): void;
}

export class FastBus {
  prefix: string;
  subscriptions: EventEmitter;
  pubClient: RedisClient;
  subClient: RedisClient;

  constructor(opts?: FastBusOpts) {
    const createRedisClient = opts?.createRedisClient ?? createClient;
    this.pubClient = createRedisClient(opts?.redis);
    this.subClient = createRedisClient(opts?.redis);
    debug(`connect redis: ${opts?.redis?.host}:${opts?.redis?.port}/${opts?.redis?.db}`);

    this.prefix = `${opts?.prefix ?? 'bus'}:${opts?.redis?.db ?? '0'}:`;

    this.subscriptions = new EventEmitter();
    this.subscriptions.setMaxListeners(Infinity);

    this.subClient.on('pmessage', (pattern, channel, message) => {
      debug('on pmessage', pattern, channel, message);
      if (this.subscriptions.listenerCount(channel) === 0) {
        debug('**ignore** no subscriber!', channel, message);
        return;
      }
      if (channel !== message) {
        debug('forward to all subscribers!', channel, message);
        this.subscriptions.emit(channel, message);
        return;
      }
      // TODO: scheduling?
      const listener = this.subscriptions.listeners(channel)[0];
      this.pubClient.rpop(channel, (err, message) => {
        if (err) {
          debug('**warning** rpop error!', err, channel);
        }
        if (message) {
          listener(message);
          debug('forward to the first subscriber!', channel);
        } else {
          debug('**warning** nothing to forward!', channel);
        }
      });
    });

    this.subClient.psubscribe(`${this.prefix}*`);
    debug(`psubscribe ${this.prefix}*`);
  }

  destroy() {
    debug('destroy');
    this.unsubscribeAll();
    this.subClient.end(true);
    this.pubClient.end(true);
  }

  // 주의: redis pub/sub 은 db(key space)를 구분하지 않음 기본 db가 아니면 토픽 이름에 db 를 포함
  private toChannelName(topic) {
    return this.prefix + topic;
  }

  publish(topic: string, message: string, broadcast: boolean = false) {
    debug('publish', topic, message, broadcast);
    const channel = this.toChannelName(topic);
    if (broadcast) {
      this.pubClient.publish(channel, message);
      return;
    }
    this.pubClient.lpush(channel, message, (err) => {
      if (err) {
        debug('**warning** lpush error!', channel, message, err);
        return;
      }
      // XXX: channel === message to distinguish from broadcast
      this.pubClient.publish(channel, channel);
    });
  }

  subscribe(topic: string, listener: FastBusSubscriber) {
    debug('subscribe', topic);
    this.subscriptions.on(this.toChannelName(topic), listener);
  }

  unsubscribe(topic: string, listener: FastBusSubscriber) {
    debug('unsubscribe', topic);
    this.subscriptions.off(this.toChannelName(topic), listener);
  }

  unsubscribeAll(topic?: string) {
    debug('unsubscribeAll', topic);
    if (topic) {
      this.subscriptions.removeAllListeners(this.toChannelName(topic));
    } else {
      this.subscriptions.removeAllListeners();
    }
  }

  static create(opts?: FastBusOpts): FastBus {
    return new FastBus(opts);
  }
}
