const EventEmitter = require("events");
const net          = require("net");

class Host extends EventEmitter {
	constructor(socket) {
		super();

		this._socket = socket;
		this._status = [];

		socket.on("data", (buffer) => {
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

		socket.on("end", () => {
			this.emit("end");
		});

		socket.on("error", () => {
			this.emit("error");
		});
	}

	status(index) {
		return this._status[index - 1];
	}

	async end() {
		await this._socket.end();
	}

	async on(index) {
		this._socket.write("1" + index);

		this._status[index - 1] = true;
	}

	async off(index) {
		this._socket.write("2" + index);

		this._status[index - 1] = false;
	}

	delay(ms) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				return resolve(ms);
			}, ms);
		});
	}
}

exports.connect = async function connect(host = "192.168.1.100", port = 6722) {
	let socket = new net.Socket();

	await socket.connect(port, host);

	return new Host(socket);
};
