const EventEmitter = require("events");

module.exports = class Device extends EventEmitter {
	constructor() {
		this.nodes = [];
	}
}
