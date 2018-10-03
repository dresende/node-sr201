const EventEmitter = require("events");
const net          = require("net");

class Client extends EventEmitter {
	constructor(client) {
		super();

		this._client = client;
		this._status = [];

		client.on("data", (buffer) => {
			while (this._status.length < buffer.length) {
				this._status.push(false);
			}
			if (this._status.length > buffer.length) {
				this._status.length = buffer.length;
			}

			buffer.map((byte, i) => {
				this._status[i] = (byte == 0x31);
			});
		});

		client.on("end", () => {
			this.emit("end");
		});

		client.on("error", () => {
			this.emit("error");
		});
	}

	end() {
		return new Promise((resolve, reject) => {
			this._client.end((err) => {
				if (err) return reject(err);

				return resolve();
			});
		});
	}

	status(index) {
		return this._status[index - 1];
	}

	on(index) {
		return new Promise((resolve, reject) => {
			this._client.write("1" + index, (err) => {
				if (err) return reject(err);

				this._status[index - 1] = true;

				return resolve();
			});
		});
	}

	off(index) {
		return new Promise((resolve, reject) => {
			this._client.write("2" + index, (err) => {
				if (err) return reject(err);

				this._status[index - 1] = false;

				return resolve();
			});
		});
	}

	delay(ms) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				return resolve(ms);
			}, ms);
		});
	}
}

exports.connect = async (host = "192.168.1.100", port = 6722) => {
	return new Promise((resolve, reject) => {
		let client = new net.Socket();

		client.connect(port, host, (err) => {
			if (err) return reject(err);

			return resolve(new Client(client));
		});
	});
};
