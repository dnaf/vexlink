const Color = require("color");
const debug = require("debug")("vexlink:launchpadmk2");
const Device = require("./device");
const midi = require("midi");

module.exports = class LaunchpadMK2 extends Device {
	constructor(midiOutput) {
		super();

		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 9; x++) {
				const i = this._getLEDIndex(x, y);
				this.nodes[i] = {
					hasLED: true,
					hasButton: true,
					x,
					y
				};
			}
		}

		if (!midiOutput) {
			debug("No MIDI output given; creating my own");
			midiOutput = new midi.output();

			debug("Attempting to find connected Launchpad");
			for (let i = 0; i < midiOutput.getPortCount(); i++) {
				if (midiOutput.getPortName(i).match("Launchpad MK2")) {
					debug("Found Launchpad MK2 at port %s", i);
					midiOutput.openPort(i);
					break;
				}
			}

			this.midiOutput = midiOutput;
		}
	}

	_getLEDIndex(x, y) {
		if (y > 0 && x >= 0 && x <= 8) {
			return 0x0B + (8 - y) * 10 + x;
		} else if (y === 0 && x >= 0 && x < 8) { // Yes, i do actually mean < x and not <= x. the top row of buttons only has 7 buttons
			return 0x68 + x;
		}
		return -1;
	}

	setLED(leds, color) {
		leds = this._parseLEDs(leds);
		color = new Color(color);

		for (let i = 0; i < leds.length; i++) {
			this._sendRGB([
				leds[i],
				Math.floor(color.red() / 4),
				Math.floor(color.green() / 4),
				Math.floor(color.blue() / 4)
			]);
		}
	}

	_sendRGB(messages) {
		if (messages.length / 4 > 80) {
			throw new Error("Too many LED messages at once. Max supported is 80");
		}
		let message = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x18, 0x0B];
		message = message.concat(messages);
		message = message.concat([0xF7]);
		this.midiOutput.sendMessage(message);
	}
};
