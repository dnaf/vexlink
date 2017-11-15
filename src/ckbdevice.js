const Color = require("color");
const Device = require("./device.js");
const Path = require("path")

module.exports = class CKBDevice extends Device {
	constructor(path) {
		this.path = Path.resolve("/dev/input/", path);
		this.cmdStream = fs.createWriteStream(this.cmdPath);
	}

	setLED(index, color) {
		// Convert color to hexadecimal and remove leading hash sign
		color = new Color(color).hex().substr(1);

		this.cmdStream.write("rgb " + index + ":" + color);
	}

	get cmdPath() {
		return Path.resolve(this.path, "cmd");
	}
}
