import Redis from 'ioredis-mock';
import { RedisBus } from './redis-bus';

describe('RedisBus', () => {
  let bus;
  let client;
  const TEST_DELAY = 100;

  beforeEach((done) => {
    bus = new RedisBus({ createRedisClient: () => new Redis() });
    client = new Redis();
    client.flushdb(done);
  });

  afterEach((done) => {
    client.disconnect();
    bus.destroy();
    setTimeout(done, TEST_DELAY);
  });

  describe('publish/subscribe', () => {
    test('should forward messages to only one receiver', (done) => {
      const messages: unknown[] = [];
      bus.subscribe('hello', (message: string) => {
        messages.push(message);
      });
      const messages2: unknown[] = [];
      bus.subscribe('hello', (message: string) => {
        messages2.push(message);
      });
      bus.publish('hello', 'foo');
      bus.publish('hello', 'bar');
      bus.publish('hello', 'baz');
      bus.publish('hello', 'qux');
      setTimeout(() => {
        expect(messages).toEqual(['foo', 'bar', 'baz', 'qux']);
        expect(messages2).toEqual([]);
        done();
      }, TEST_DELAY);
    });

    test('should not forward messages after unreceive', (done) => {
      const messages: unknown[] = [];
      const listener1 = (message: string) => {
        messages.push(message);
      };
      bus.subscribe('hello', listener1);
      const messages2: unknown[] = [];
      const listener2 = (message: string) => {
        messages2.push(message);
      };
      bus.subscribe('hello', listener2);
      bus.publish('hello', 'foo');
      bus.publish('hello', 'bar');
      setTimeout(() => {
        bus.unsubscribe('hello', listener1);
        setTimeout(() => {
          bus.publish('hello', 'baz');
          bus.publish('hello', 'qux');
          setTimeout(() => {
            expect(messages).toEqual(['foo', 'bar']);
            expect(messages2).toEqual(['baz', 'qux']);
            done();
          }, TEST_DELAY);
        }, TEST_DELAY);
      }, TEST_DELAY);
    });
  });

  describe('broadcast', () => {
    it('should forward messages to all subscribers', (done) => {
      const messages: unknown[] = [];
      bus.subscribe('hello', (message: string) => {
        messages.push(message);
      });
      const messages2: unknown[] = [];
      bus.subscribe('hello', (message: string) => {
        messages2.push(message);
      });
      bus.publish('hello', 'foo', true);
      bus.publish('hello', 'bar', true);
      bus.publish('hello', 'baz', true);
      bus.publish('hello', 'qux', true);
      setTimeout(() => {
        expect(messages).toEqual(['foo', 'bar', 'baz', 'qux']);
        expect(messages2).toEqual(['foo', 'bar', 'baz', 'qux']);
        done();
      }, TEST_DELAY);
    });

    test('should not forward messages after unsubscribe', (done) => {
      const messages: unknown[] = [];
      const listener1 = (message: string) => {
        messages.push(message);
      };
      bus.subscribe('hello', listener1);
      const messages2: unknown[] = [];
      const listener2 = (message: string) => {
        messages2.push(message);
      };
      bus.subscribe('hello', listener2);
      bus.publish('hello', 'foo', true);
      bus.publish('hello', 'bar', true);
      setTimeout(() => {
        bus.unsubscribe('hello', listener1);
        setTimeout(() => {
          bus.publish('hello', 'baz', true);
          bus.publish('hello', 'qux', true);
          setTimeout(() => {
            expect(messages).toEqual(['foo', 'bar']);
            expect(messages2).toEqual(['foo', 'bar', 'baz', 'qux']);
            done();
          }, TEST_DELAY);
        }, TEST_DELAY);
      }, TEST_DELAY);
    });
  });
});
