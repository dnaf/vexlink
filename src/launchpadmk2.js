const Color = require("color");
const debug = require("debug")("vexlink:launchpadmk2");
const Device = require("./device");
const midi = require("midi");

module.exports = class LaunchpadMK2 extends Device {
	constructor(midiOutput) {
		super();

		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 9; x++) {
				const i = this._getLEDIndex(x, y),
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
		return 0x0B + (7 - y) * 10 + x;
	}

	setLED(i, color) {
		color = new Color(color);
		this._sendRGB([
			i,
			Math.floor(color.red() / 4),
			Math.floor(color.blue() / 4),
			Math.floor(color.green() / 4)
		]);
	}

	_sendRGB(messages) {
		console.log(messages);
		if (messages.length / 4 > 80) {
			throw new Error("Too many LED messages at once. Max supported is 80");
		}
		let message = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x18, 0x0B];
		message = message.concat(messages);
		message = message.concat([0xF7]);
		console.log(message);
		this.midiOutput.sendMessage(message);
	}
}
