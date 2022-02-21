# fastbus

fast and simple pubsub using redis and cloud pub/sub

![version](https://img.shields.io/github/package-json/v/day1co/fastbus)

## Getting Started

#### How to Get Client

1. **Using `busType`**

   ```javascript
   const { FastBus, BusType } = require('../lib');

   // redis
   const redisOpts = { prefix: 'bus', redis: { host: 'localhost', port: 6379, db: 0 } };
   const redisBus = FastBus.create({ fastBusOpts: redisOpts, busType: BusType.REDIS });

   // cloud pub/sub
   const gcpOptions = {
     clientConfig: { projectId: 'project-test', apiEndpoint: 'localhost:8085' },
     topicPrefix: 'topic-',
     subscriptionPrefix: 'sub-',
   };
   const cloudPubSubBus = FastBus.create({ fastBusOpts: gcpOptions, busType: BusType.CLOUD_PUBSUB });
   ```

2. **Using env**

   **env setting**

   - Redis setting: `process.env.FASTBUS_BACKEND=redis`

     ```sh
     export FASTBUS_BACKEND="redis"
     ```

   - Cloud PubSub setting: `process.env.FASTBUS_BACKEND=gcp_pubsub`

     ```sh
     export FASTBUS_BACKEND="gcp_pubsub"
     ```

   **source code**

   ```js
   const { FastBus } = require('../lib');

   // redis
   const redisOpts = { prefix: 'bus', redis: { host: 'localhost', port: 6379, db: 0 } };
   const redisBus = FastBus.create({ fastBusOpts: redisOpts });

   // cloud pub/sub
   const gcpOptions = {
     clientConfig: { projectId: 'project-test', apiEndpoint: 'localhost:8085' },
     topicPrefix: 'topic-',
     subscriptionPrefix: 'sub-',
   };
   const cloudPubSubBus = FastBus.create({ fastBusOpts: gcpOptions });
   ```

3. **Inject create client method in `opts` parameter**

   ```js
   const { FastBus } = require('../lib');

   // redis
   const createRedisClient = new RedisClient(opts);
   const redisOpts = { createRedisClient, prefix: 'bus', redis: { host: 'localhost', port: 6379, db: 0 } };
   const redisBus = FastBus.create({ fastBusOpts: redisOpts });

   // cloud pub/sub
   const createPubSubClient = () => new PubSub(opts);
   const gcpOptions = {
     createPubSubClient,
     clientConfig: { projectId: 'project-test', apiEndpoint: 'localhost:8085' },
     topicPrefix: 'topic-',
     subscriptionPrefix: 'sub-',
   };
   const cloudPubSubBus = FastBus.create({ fastBusOpts: gcpOptions });
   ```

#### How to Use

```js
const { FastBus, BusType } = require('../lib');

// redis
const opts = { prefix: 'bus', redis: { host: 'localhost', port: 6379, db: 0 } };
const bus = FastBus.create({ fastBusOpts: opts, busType: BusType.REDIS });

bus.subscribe('greeting', (message) => console.log('hello', message));
bus.subscribe('greeting', (message) => console.log('hi', message));

bus.publish('greeting', 'there');
// hello, there

bus.publish('greeting', 'everyone', true);
// hello, everyone
// hi, everyone
```

## Contributing

### test

```console
$ npm test
```

### build

```console
$ npm run build
```

### watch(continuous build)

```console
$ npm start
```

---

may the **SOURCE** be with you...
