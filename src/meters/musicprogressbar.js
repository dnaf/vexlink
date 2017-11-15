const Color = require("color");
const mpd = require("mpd");
const ProgressBar = require("./progressbar.js");

module.exports = class MusicProgressBar extends ProgressBar {
	constructor(device, mpdClient, leds) {
		super(device, leds);

		this.mpdClient = mpdClient;

		setInterval(this.refresh.bind(this), 1000 / 60);
	}

	async refresh() {
		const status = await this.mpdClient.sendCommandAsync("status")
			.then(mpd.parseKeyValueMessage);

		if (status.elapsed && status.duration) {
			const progress = Number(status.elapsed) / Number(status.duration);

			this.value = progress;
			this.background = new Color("#0000ff").mix(new Color("#000000"), progress * 2);
			this.foreground = new Color("#ff0000").mix(new Color("#0000ff"), progress);

			return super.refresh();
		}
	}
};
