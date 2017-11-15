const EventEmitter = require("events");

module.exports = class Device extends EventEmitter {
	constructor() {
		super();
		this.nodes = [];
	}

	_parseLEDs(leds) {
		if (typeof (leds) === "string" || typeof (leds) === "number") {
			leds = [leds];
		} else if (!leds) {
			return [];
		} else if (!(Array.isArray(leds))) {
			throw new TypeError("LED index must be a number, string, or array. Received " + typeof (leds));
		}

		for (let i = 0; i < leds.length; i++) {
			leds[i] = String(leds[i]);
			if (!leds[i].match(/^[a-zA-Z0-9_-]+$/)) {
				throw new Error("Invalid LED index `" + leds[i] + "`");
			}
		}

		return leds;
	}
};
