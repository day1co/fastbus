/**
 * This sample demonstrates how to perform basic operations on topics with the
 * Google Cloud Pub/Sub Client.
 */

const main = async (topicName = 'topic-busTest') => {
  const { PubSub } = require('@google-cloud/pubsub');
  const clientConfig = { projectId: 'project-test', apiEndpoint: 'localhost:8085' };

  // Imports the Google Cloud client library
  const client = new PubSub(clientConfig);

  // Creates a new topic
  // On your project, Use the Google Cloud Pub/Sub console to manage topics.
  await client.createTopic(topicName);
  console.log(`Topic ${topicName} created.`);
};

main(...process.argv.slice(2)).catch((e) => {
  console.error(e);
  process.exitCode = -1;
});
