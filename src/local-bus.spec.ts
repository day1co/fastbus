import { setTimeout } from 'timers/promises';
import { LocalBus } from './local-bus';

describe('LocalBus', () => {
  let bus;
  const TEST_DELAY = 100;

  beforeEach(() => {
    bus = new LocalBus();
  });

  afterEach(() => {
    bus.destroy();
  });

  describe('publish/subscribe', () => {
    test('should forward messages to only one receiver', async () => {
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
      await setTimeout(TEST_DELAY);
      expect(messages).toEqual(['foo', 'bar', 'baz', 'qux']);
      expect(messages2).toEqual([]);
    });

    test('should not forward messages after unreceive', async () => {
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
      await setTimeout(TEST_DELAY);
      bus.unsubscribe('hello', listener1);
      await setTimeout(TEST_DELAY);
      bus.publish('hello', 'baz');
      bus.publish('hello', 'qux');
      await setTimeout(TEST_DELAY);
      expect(messages).toEqual(['foo', 'bar']);
      expect(messages2).toEqual(['baz', 'qux']);
    });
  });

  describe('broadcast', () => {
    it('should forward messages to all subscribers', async () => {
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
      await setTimeout(TEST_DELAY);
      expect(messages).toEqual(['foo', 'bar', 'baz', 'qux']);
      expect(messages2).toEqual(['foo', 'bar', 'baz', 'qux']);
    });

    test('should not forward messages after unsubscribe', async () => {
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
      await setTimeout(TEST_DELAY);
      bus.unsubscribe('hello', listener1);
      await setTimeout(TEST_DELAY);
      bus.publish('hello', 'baz', true);
      bus.publish('hello', 'qux', true);
      await setTimeout(TEST_DELAY);
      expect(messages).toEqual(['foo', 'bar']);
      expect(messages2).toEqual(['foo', 'bar', 'baz', 'qux']);
    });
  });
});
