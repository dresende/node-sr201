const TCP_PORT = 6722;
const CFG_PORT = 5111;

const EventEmitter = require("events");
const net          = require("net");

class Host extends EventEmitter {
	constructor(socket, host) {
		super();

		this._socket = socket;
		this._host   = host;
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

	async info() {
		return new Promise(async (resolve, reject) => {
			let socket = new net.Socket();

			try {
				await socket.connect(CFG_PORT, this._host);
			} catch (err) {
				return reject(err);
			}

			socket.once("data", (buffer) => {
				socket.end();

				let data = buffer.toString();

				if (data[0] != ">" || data[data.length - 1] != ";") {
					return reject(new Error("Invalid response"));
				}

				data = data.substr(1, data.length - 2);

				if (data == "ERR") {
					return reject(new Error("Host replied with error"));
				}

				data = data.split(",");

				return resolve({
					address : {
						ip      : data[0],
						subnet  : data[1],
						gateway : data[2],
						dns     : data[7],
					},
					persist_relay : (data[4] == "1"),
					build_number  : "1.0." + data[5],
					serial_number : data[6].substr(0, data[6].length - 6),
					cloud : {
						host     : data[8],
						password : data[6].substr(data[6].length - 6),
						enabled  : (data[9] == "1"),
					}
				});
			});

			socket.write("#19876;");
		});
	}

	async reconfigure(ip, subnet, gateway, dns) {
		return new Promise(async (resolve, reject) => {
			let socket = new net.Socket();

			try {
				await socket.connect(CFG_PORT, this._host);
			} catch (err) {
				return reject(err);
			}

			let set = async (command) => {
				return new Promise(async (resolve, reject) => {
					socket.once("data", (buffer) => {
						let data = buffer.toString();

						if (data[0] != ">" || data[data.length - 1] != ";") {
							return reject(new Error("Invalid response"));
						}

						data = data.substr(1, data.length - 2);

						if (data != "OK") {
							return reject(new Error("Host replied with error"));
						}

						return resolve();
					});

					socket.write("#" + command + ";");
				});
			};

			try {
				await set("29876," + ip);
				await set("39876," + subnet);
				await set("49876," + gateway);
				await set("89876," + dns);
				await set("79876");

				await socket.end();
			} catch (err) {
				return reject(err);
			}

			return resolve();
		});
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

exports.connect = async function connect(host = "192.168.1.100") {
	let socket = new net.Socket();

	await socket.connect(TCP_PORT, host);

	return new Host(socket, host);
};
