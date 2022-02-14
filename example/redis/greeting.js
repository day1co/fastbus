const { RedisBus } = require('../../lib');

const bus = RedisBus.create({ prefix: 'bus', redis: { host: 'localhost', port: 6379, db: 0 } });

bus.subscribe('greeting', (message) => console.log('hello', message));
bus.subscribe('greeting', (message) => console.log('hi', message));

bus.publish('greeting', 'there');
// hello, there

bus.publish('greeting', 'everyone', true);
// hello, everyone
// hi, everyone
