const Promise = require("bluebird");

const Color = require("color");
const cp = Promise.promisifyAll(require("child_process"));
const ProgressBar = require("./progressbar.js");

module.exports = class WorkspaceBar {
	constructor(device, i3Client, leds, options) {
		this.device = device;
		this.i3Client = i3Client;
		this.leds = leds;

		options = options || {};
		this.backgroundColor = new Color(options.background || "#000020");
		this.openColor = new Color(options.open || "#0000FF");
		this.visibleColor = new Color(options.visible || "#7F0020");
		this.focusedColor = new Color(options.focused || "#FF00FF");

		i3Client.on("workspace", this.refresh.bind(this));
	}

	async refresh() {
		const commands = [
			"rgb " + this.leds.join(",") + ":" + this.backgroundColor.hex().substr(1)
		];

		const workspaces = JSON.parse(await cp.execAsync("i3-msg -t get_workspaces"));

		for (const i in workspaces) {
			const workspace = workspaces[i];
			const led = this.leds[workspace.num];

			if (led) {
				let color = this.openColor;
				if (workspace.focused) {
					color = this.focusedColor;
				} else if (workspace.visible) {
					color = this.visibleColor;
				}
				this.device.setLED(led, color);
			}
		}
	}
};
