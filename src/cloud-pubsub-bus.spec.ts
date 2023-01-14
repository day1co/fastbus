import { PubSub } from '@google-cloud/pubsub';
import { FastBus, BusType, CloudPubSubBus } from './';

describe('CloudPubSubBus', () => {
  const SECOND_TO_MILS = 1_000;
  jest.setTimeout(SECOND_TO_MILS * 10);

  let bus: CloudPubSubBus;
  let client: PubSub;
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
    const fastBusOpts = { topicPrefix, subscriptionPrefix, clientConfig };
    bus = <CloudPubSubBus>FastBus.create({ fastBusOpts, busType: BusType.CLOUD_PUBSUB });
    done();
  });

  afterEach((done) => {
    bus.destroy();
    setTimeout(done, TEST_DELAY);
  });

  afterAll(async () => {
    bus.destroy();
    await client.subscription(subscriptionName).delete();
    await client.topic(topicName).delete();
    client.close();
  });

  describe('publish/subscribe', () => {
    test('should forward messages to only one receiver', (done) => {
      const messages: unknown[] = [];
      bus.subscribe(topic, (message: string) => {
        messages.push(message);
      });
      const messages2: unknown[] = [];
      bus.subscribe(topic, (message: string) => {
        messages2.push(message);
      });
      bus.publish(topic, 'foo');
      bus.publish(topic, 'bar');
      bus.publish(topic, 'baz');
      bus.publish(topic, 'qux');
      setTimeout(() => {
        expect(messages.sort()).toEqual(['bar', 'baz', 'foo', 'qux']);
        expect(messages2).toEqual([]);
        done();
      }, TEST_DELAY);
    });

    test('should not forward messages after unreceive', (done) => {
      const messages: unknown[] = [];
      const listener1 = (message: string) => {
        messages.push(message);
      };
      bus.subscribe(topic, listener1);
      const messages2: unknown[] = [];
      const listener2 = (message: string) => {
        messages2.push(message);
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
            expect(messages.sort()).toEqual(['bar', 'foo']);
            expect(messages2.sort()).toEqual(['baz', 'qux']);
            done();
          }, TEST_DELAY);
        }, TEST_DELAY);
      }, TEST_DELAY);
    });
  });
});
