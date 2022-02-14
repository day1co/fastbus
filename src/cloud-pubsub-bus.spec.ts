import { PubSub } from '@google-cloud/pubsub';
import { CloudPubSubBus } from './';

describe('CloudPubSubBus', () => {
  const SECOND_TO_MILS = 1_000;
  jest.setTimeout(SECOND_TO_MILS * 10);

  let bus;
  let client;
  const projectId = 'project-test';
  const topic = 'busTest';
  const topicPrefix = 'topic-';
  const subscriptionPrefix = 'sub-';
  const topicName = topicPrefix + topic;
  const subscriptionName = subscriptionPrefix + topic;
  const TEST_DELAY = 500;
  const clientConfig = { apiEndpoint: 'localhost:8085', projectId, keyFilename: '/file-path/key.json' };

  beforeAll(async () => {
    client = new PubSub(clientConfig);
    await client.createTopic(topicName);
    await client.createSubscription(topicName, subscriptionName);
  });

  beforeEach((done) => {
    bus = new CloudPubSubBus({ topicPrefix, subscriptionPrefix, clientConfig });
    done();
  });

  afterEach((done) => {
    bus.destroy();
    setTimeout(done, TEST_DELAY);
  });

  afterAll(() => {
    client.topic(topicName).delete();
    client.subscription(subscriptionName).delete();
    client.close();
    bus.destroy();
  });

  describe('publish/subscribe', () => {
    test('should forward messages to only one receiver', (done) => {
      const acc: unknown[] = [];
      bus.subscribe(topic, (message: string) => {
        acc.push(message);
      });
      const acc2: unknown[] = [];
      bus.subscribe(topic, (message: string) => {
        acc2.push(message);
      });
      bus.publish(topic, 'foo');
      bus.publish(topic, 'bar');
      bus.publish(topic, 'baz');
      bus.publish(topic, 'qux');
      setTimeout(() => {
        expect(acc.sort()).toEqual(['bar', 'baz', 'foo', 'qux']);
        expect(acc2).toEqual([]);
        done();
      }, TEST_DELAY);
    });

    test('should not forward messages after unreceive', (done) => {
      const acc: unknown[] = [];
      const listener1 = (message: string) => {
        acc.push(message);
      };
      bus.subscribe(topic, listener1);
      const acc2: unknown[] = [];
      const listener2 = (message: string) => {
        acc2.push(message);
      };
      bus.subscribe(topic, listener2);
      bus.publish(topic, 'foo');
      bus.publish(topic, 'bar');
      setTimeout(() => {
        bus.unsubscribe(topic, listener1);
        setTimeout(() => {
          bus.publish(topic, 'baz');
          bus.publish(topic, 'qux');
          setTimeout(() => {
            expect(acc.sort()).toEqual(['bar', 'foo']);
            expect(acc2.sort()).toEqual(['baz', 'qux']);
            done();
          }, TEST_DELAY);
        }, TEST_DELAY);
      }, TEST_DELAY);
    });
  });
});