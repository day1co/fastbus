import redis from 'redis';
import FastBus from '../src/fast-bus';

describe('FastBus', () => {
  let bus;
  let client;
  const TEST_DELAY = 100;

  beforeEach(done => {
    const redisConfig = { host: 'localhost', port: 6379, db: 0 };
    bus = FastBus.create({ prefix: 'bustest', redis: redisConfig });
    client = redis.createClient(redisConfig);
    client.flushdb(done);
  });

  afterEach(done => {
    client.end(true);
    bus.destroy();
    setTimeout(done, TEST_DELAY);
  });

  describe('publish/subscribe', () => {
    test('should forward messages to only one receiver', done => {
      const acc = [];
      bus.subscribe('hello', message => {
        acc.push(message);
      });
      const acc2 = [];
      bus.subscribe('hello', message => {
        acc2.push(message);
      });
      bus.publish('hello', 'foo');
      bus.publish('hello', 'bar');
      bus.publish('hello', 'baz');
      bus.publish('hello', 'qux');
      setTimeout(() => {
        expect(acc).toEqual(['foo', 'bar', 'baz', 'qux']);
        expect(acc2).toEqual([]);
        done();
      }, TEST_DELAY);
    });

    test('should not forward messages after unreceive', done => {
      const acc = [];
      const listener1 = message => {
        acc.push(message);
      };
      bus.subscribe('hello', listener1);
      const acc2 = [];
      const listener2 = message => {
        acc2.push(message);
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
            expect(acc).toEqual(['foo', 'bar']);
            expect(acc2).toEqual(['baz', 'qux']);
            done();
          }, TEST_DELAY);
        }, TEST_DELAY);
      }, TEST_DELAY);
    });
  });

  describe('broadcast', () => {
    it('should forward messages to all subscribers', done => {
      const acc = [];
      bus.subscribe('hello', message => {
        acc.push(message);
      });
      const acc2 = [];
      bus.subscribe('hello', message => {
        acc2.push(message);
      });
      bus.publish('hello', 'foo', true);
      bus.publish('hello', 'bar', true);
      bus.publish('hello', 'baz', true);
      bus.publish('hello', 'qux', true);
      setTimeout(() => {
        expect(acc).toEqual(['foo', 'bar', 'baz', 'qux']);
        expect(acc2).toEqual(['foo', 'bar', 'baz', 'qux']);
        done();
      }, TEST_DELAY);
    });

    test('should not forward messages after unsubscribe', done => {
      const acc = [];
      const listener1 = message => {
        acc.push(message);
      };
      bus.subscribe('hello', listener1);
      const acc2 = [];
      const listener2 = message => {
        acc2.push(message);
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
            expect(acc).toEqual(['foo', 'bar']);
            expect(acc2).toEqual(['foo', 'bar', 'baz', 'qux']);
            done();
          }, TEST_DELAY);
        }, TEST_DELAY);
      }, TEST_DELAY);
    });
  });
});
