/**
 * This sample demonstrates how to publish message.
 */
const main = (topic = 'busTest', data = JSON.stringify({ foo: 'bar' })) => {
  const { CloudPubSubBus } = require('../../lib/cloud-pubsub-bus');

  const clientConfig = { projectId: 'project-test', apiEndpoint: 'localhost:8085' };

  const gcpOptions = {
    clientConfig,
    topicPrefix: 'topic-',
    subscriptionPrefix: 'sub-',
  };

  // Create CloudPubSub Instance
  const cloudPubSubBus = CloudPubSubBus.create(gcpOptions);

  cloudPubSubBus.publish(topic, data);
  console.log(`Message published to ${gcpOptions?.topicPrefix + topic}`);
  console.log(`Message data: ${data}`);
};

process.on('unhandledRejection', (err) => {
  console.error(err.message);
  process.exitCode = 1;
});

main(...process.argv.slice(2));
