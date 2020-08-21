# fastbus

fast and simple pubsub using redis

[![npm version](https://badge.fury.io/js/%40fastcampus%2Ffastbus.svg)](https://badge.fury.io/js/%40fastcampus%2Ffastbus)

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
