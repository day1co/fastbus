/**
 * This sample demonstrates how to create subscriptions with the
 * Google Cloud Pub/Sub Client.
 */

const { PubSub } = require('@google-cloud/pubsub');

const clientConfig = { projectId: 'project-test', apiEndpoint: 'localhost:8085' };

const main = async (topicName = 'topic-busTest', subscriptionName = 'sub-busTest') => {
  // Imports the Google Cloud client library
  const client = new PubSub(clientConfig);

  // Creates a new subscription
  // On your project, Use the Google Cloud Pub/Sub console to manage subscriptions.
  await client.topic(topicName).createSubscription(subscriptionName);
  console.log(`Subscription ${subscriptionName} created under the ${topicName} topic`);
};

main(...process.argv.slice(2)).catch((e) => {
  console.error(e);
  process.exitCode = -1;
});
