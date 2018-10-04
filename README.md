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

### Reconfigure

```js
const sr201 = require("sr201");

sr201.connect("192.168.1.100", 6722).then(async (client) => {
	await client.reconfigure(
		"192.168.10.123", // ip
		"255.255.255.0",  // mask
		"192.168.10.1",   // gateway
		"192.168.10.1",   // dns
	);
	// in the end, settings are saved and device restarts
}, (err) => {
	console.log(err);
});
```
