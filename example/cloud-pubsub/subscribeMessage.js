/**
 * This sample demonstrates how to subscribe from subscription.
 */
const main = async (topic = 'busTest') => {
  const { CloudPubSubBus } = require('../../lib/cloud-pubsub-bus');

  const clientConfig = { projectId: 'project-test', apiEndpoint: 'localhost:8085' };

  const gcpOptions = {
    clientConfig,
    topicPrefix: 'topic-',
    subscriptionPrefix: 'sub-',
  };

  // Create CloudPubSub Instance
  const cloudPubSubBus = new CloudPubSubBus(gcpOptions);

  // subscriptionName = subscriptionPrefix + topic
  console.log(`Subscriber to subscription ${gcpOptions.subscriptionPrefix}${topic} is ready to receive messages`);

  cloudPubSubBus.subscribe(topic, (message) => {
    console.log(`Received message: \n ${message}`);
  });
};

process.on('unhandledRejection', (err) => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
