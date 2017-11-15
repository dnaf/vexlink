const Color = require("color");

class ProgressBar {
	/**
	 * @param {WritableStream} cmdStream
	 * @param {String[]} leds
	 * @param {Object} [options]
	 * @param {Color|Any} [options.background]
	 * @param {Color|Any} [options.foreground]
	 * @param {Number} [options.value]
	 */
	constructor(cmdStream, leds, options) {
		this._stream = cmdStream;

		this.leds = leds;

		options = options || {};
		this.background = new Color(options.background || "#000000");
		this.foreground = new Color(options.foreground || "#ffffff");
		this.value = options.value || 0;
	}

	refresh() {
		this._stream.write(this.getCommands() + "\n");
	}

	getCommands() {
		const foregroundWidth = Math.floor(this.value * this.leds.length);

		const aliasedLed = Math.ceil(this.value * this.leds.length) - 1;
		const aliasedAmount = (this.value * this.leds.length) % 1;
		const aliasedColor = this.background.mix(this.foreground, aliasedAmount);

		const commands = [];

		// Background
		// if (backgroundWidth > 0) {
		commands.push("rgb " + this.leds.slice(foregroundWidth + Math.ceil(aliasedAmount), this.leds.length) + ":" + this.background.hex().substr(1));
		// }

		// Foreground
		if (foregroundWidth > 0) {
			commands.push("rgb " + this.leds.slice(0, foregroundWidth) + ":" + this.foreground.hex().substr(1));
		}

		// Aliased pixel
		commands.push("rgb " + this.leds[aliasedLed] + ":" + aliasedColor.hex().substr(1));

		return commands.join(" ");
	}
}

module.exports = ProgressBar;
