## SR-201 Network Relay

NodeJS SR-201 network relay protocol.

### Install

```sh
npm i sr201
```

### Usage

```js
const sr201 = require("sr201");

sr201.connect("192.168.1.100", 6722).then(async (client) => {
	await client.on(2);
	await client.delay(2000);
	await client.off(2);
	console.log(client.status(2));
	await client.end();
}, (err) => {
	console.log(err);
});
```
