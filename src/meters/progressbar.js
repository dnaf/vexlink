const Color = require("color");

class ProgressBar {
	/**
	 * @param {Device} device
	 * @param {String[]} leds
	 * @param {Object} [options]
	 * @param {Color|Any} [options.background]
	 * @param {Color|Any} [options.foreground]
	 * @param {Number} [options.value]
	 */
	constructor(device, leds, options) {
		this.device = device;

		this.leds = leds;

		options = options || {};
		this.background = new Color(options.background || "#000000");
		this.foreground = new Color(options.foreground || "#ffffff");
		this.value = options.value || 0;
	}

	refresh() {
		const foregroundWidth = Math.floor(this.value * this.leds.length);

		const aliasedLed = Math.ceil(this.value * this.leds.length) - 1;
		const aliasedAmount = (this.value * this.leds.length) % 1;
		const aliasedColor = this.background.mix(this.foreground, aliasedAmount);

		// Background
		this.device.setLED(this.leds.slice(foregroundWidth + Math.ceil(aliasedAmount), this.leds.length), this.background);

		// Foreground
		if (foregroundWidth > 0) {
			this.device.setLED(this.leds.slice(0, foregroundWidth), this.foreground);
		}

		// Aliased pixel
		this.device.setLED(this.leds[aliasedLed], aliasedColor);
	}
}

module.exports = ProgressBar;
