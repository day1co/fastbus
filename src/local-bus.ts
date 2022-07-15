import pino from 'pino';
import { EventEmitter } from 'events';
import { BaseBus, FastBusSubscriber } from './fast-bus.interface';

const logger = pino({ name: 'local-bus' });

export interface LocalBusOpts {}

export class LocalBus implements BaseBus {
  eventEmitter: EventEmitter;

  constructor(opts?: LocalBusOpts) {
    logger.debug(`create LocalBus: ${opts}`);
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(Infinity);
  }

  destroy() {
    this.unsubscribeAll();
  }

  publish(topic: string, message: string, broadcast: boolean = false) {
    logger.debug(`publish ${topic} ${message} ${broadcast}`);
    if (this.eventEmitter.listenerCount(topic) === 0) {
      logger.debug(`ignore publish: no subscriber! ${topic} ${message}`);
      return;
    }
    if (broadcast) {
      this.eventEmitter.emit(topic, message);
      return;
    }
    const listener = this.eventEmitter.listeners(topic)[0];
    if (listener) {
      listener(message);
    }
  }

  subscribe(topic: string, listener: FastBusSubscriber) {
    logger.debug(`subscribe ${topic}`);
    this.eventEmitter.on(topic, listener);
  }

  unsubscribe(topic: string, listener: FastBusSubscriber) {
    logger.debug(`unsubscribe ${topic}`);
    this.eventEmitter.off(topic, listener);
  }

  unsubscribeAll(topic?: string) {
    if (topic) {
      this.eventEmitter.removeAllListeners(topic);
    } else {
      this.eventEmitter.removeAllListeners();
    }
  }
}
