# fastbus

fast and simple pubsub using redis

## Getting Started

```js
const FastBus = require('../lib');

const bus = FastBus.create({ prefix: 'bus', redis: { host: 'localhost', port: 6379, db: 0 } });

bus.subscribe('greeting', message => console.log('hello', message));
bus.subscribe('greeting', message => console.log('hi', message));

bus.publish('greeting', 'there');
// hello, there

bus.publish('greeting', 'everyone', true);
// hello, everyone
// hi, everyone
```

## Contributing

### lint

```console
$ npm run lint
```

### test

```console
$ npm run test
```

may the **SOURCE** be with you...
