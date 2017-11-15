const Color = require("color");
const Device = require("../device");
const Path = require("path");
const fs = require("fs");

module.exports = class CKBDevice extends Device {
	constructor(path) {
		super();

		this.path = Path.resolve("/dev/input/", path);
		this.cmdStream = fs.createWriteStream(this.cmdPath);
		this.cmdStream.write("mode 4 active\nmode 4 switch\nmode 4 rgb 000000\n");
	}

	setLED(leds, color) {
		leds = this._parseLEDs(leds);
		// Convert color to hexadecimal and remove leading hash sign
		color = new Color(color).hex().substr(1);

		this.cmdStream.write("mode 4 rgb " + leds.join(",") + ":" + color + "\n");
	}

	get cmdPath() {
		return Path.resolve(this.path, "cmd");
	}
};
