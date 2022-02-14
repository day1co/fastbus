# Cloud Pub/Sub Samples

fast and simple pubsub using cloud pub/sub

## Getting Started

```js
const { CloudPubSubBus } = require('../../lib');

const bus = new CloudPubSubBus({
  topicPrefix: 'topic-',
  subscriptionPrefix: 'sub-',
  clientConfig: { projectId: 'project-test', apiEndpoint: 'localhost:8085', keyFileName: '/file-path/key.json' },
});

bus.subscribe('greeting', (message) => console.log('hello', message));
bus.subscribe('greeting', (message) => console.log('hi', message));

bus.publish('greeting', 'there');
// hello, there
```

## How to use Samples

### Cloud Pub/Sub Local Emulator

**docs:** https://cloud.google.com/pubsub/docs/emulator

**config**

`apiEndpoint: localhost:8085`

`projectId: 'project-test'`

### Script

#### 1. create topic

Creates a new topic

**Usage**:

`node createTopic.js <topic-name with topic-prefix>`

#### 2. create subscription

Creates a new subscription

**Usage**:

`node createSubscription.js <topic-name with topic-prefix> <subscription-name with prefix>`

#### 3. susbscirbe messages

Listen to messages

**Usage**:

`node subscribeMessage.js <topic-name without subscription-prefix>`

#### 4. publish message

Publishes a message to a topic.

**Usage**:

`node publishMessage.js <topic-name without topic-prefix>`
