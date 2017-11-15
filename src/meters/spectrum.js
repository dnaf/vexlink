const _ = require("lodash");
const Cava = require("../cava");
const Color = require("color");
const ProgressBar = require("./progressbar.js");

module.exports = class Spectrum {
	constructor(device, bars, options) {
		this.device = device;

		this.bars = [];
		for (const bar in bars) {
			this.bars[bar] = new ProgressBar(device, bars[bar], {foreground: "#ffffff"});
		}

		this.cava = new Cava(bands => {
			// Split into three RGB bands
			let rgbBands = [];
			for (let i = 0; i < bands.length; i += bands.length / 3) {
				rgbBands.push(bands.slice(i, i + bands.length / 3));
			}

			// Get averages of bands
			rgbBands = _.chain(rgbBands)
				.map(_.mean) // Get averages of bands
				.map((v, i, bands) => {
					return v / (_.sum(_.without(bands)) || 1); // Get ratio of band to other bands
				})
				.map(v => v * 255) // Multiply by 255
				.value();

			const color = new Color(rgbBands).saturate(2);

			for (const band in bands) {
				const bar = Math.floor(band / bands.length * this.bars.length);
				this.bars[bar].value = bands[bar];
				this.bars[bar].foreground = color;
				this.bars[bar].refresh();
			}
		}, options);
	}
};
