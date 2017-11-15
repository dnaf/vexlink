const Promise = require("bluebird");

const _ = require("lodash");
const Color = require("color");
const cp = Promise.promisifyAll(require("child_process"));
const debug = require("debug")("vexlink");
const fs = Promise.promisifyAll(require("fs"));
const i3Client = require("i3").createClient();
const K70 = require("./devices/k70");
const LaunchpadMK2 = require("./devices/launchpadmk2");
const mpd = require("mpd");
const MusicProgressBar = require("./meters/musicprogressbar");
const ProgressBar = require("./meters/progressbar");
const Spectrum = require("./meters/spectrum");
const WorkspaceBar = require("./meters/workspacebar");

debug("Connecting to devices");
const keyboardDevice = new K70("ckb2");
const launchpad = new LaunchpadMK2();

debug("Connecting to MPD");
const mpdClient = Promise.promisifyAll(mpd.connect());

debug("Creating bars");
const musicBar = new MusicProgressBar(keyboardDevice, mpdClient, ["esc", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12"]);

const launchpadMusicBarLEDs = _.range(8).map(x => launchpad._getLEDIndex(x, 0));
const launchpadMusicBar = new MusicProgressBar(launchpad, mpdClient, launchpadMusicBarLEDs);

const pacmanBar = new ProgressBar(keyboardDevice, ["del", "ins", "prtscn"], {foreground: "#00ff00"});
const aurBar = new ProgressBar(keyboardDevice, ["end", "home", "scroll"], {foreground: "#00ff00"});

const workspaceBar = new WorkspaceBar(keyboardDevice, i3Client, ["inv", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"], {});

const keyboardSpectrumBars = [["lctrl", "lwin", "lshift", "caps", "tab", "grave"], ["lalt", "z", "a", "q"], ["x", "s", "w"], ["c", "d", "e"], ["v", "f", "r"], ["space", "b", "g", "t"], ["n", "h", "y"], ["m", "j", "u"], ["comma", "k", "i"], ["ralt", "dot", "l", "o"], ["rwin", "slash", "colon", "p"], ["rmenu", "quote", "lbrace", "minus"], ["inv", "inv", "inv", "rbrace", "plus"], ["rctrl", "rshift", "enter", "bslash", "bspace"]];
const keyboardSpectrum = new Spectrum(keyboardDevice, keyboardSpectrumBars, {
	bars: 14,
	bitDepth: 8,

	integralSmoothing: 50,
	monstercatSmoothing: true,

	framerate: 60,
	gravity: 2000
});

const launchpadSpectrumBars = [];
for (let x = 0; x < 8; x++) {
	launchpadSpectrumBars[x] = [];
	for (let y = 0; y < 8; y++) {
		launchpadSpectrumBars[x][7 - y] = launchpad._getLEDIndex(x, y + 1);
	}
}
const launchpadSpectrum = new Spectrum(launchpad, launchpadSpectrumBars, {
	bars: 8,
	bitDepth: 8,

	integralSmoothing: 50,
	monstercatSmoothing: true,

	framerate: 30,
	gravity: 2000
});

async function updateUpdateBar() {
	const pacmanUpdates = ((await cp.execAsync("checkupdates", {encoding: "utf8"})).match(/.+\n/g) || []).length;
	const aurUpdates = ((await cp.execAsync("pacaur -k", {encoding: "utf8"}).catch(() => {
		return "";
	})).match(/.+\n/g) || []).length;

	pacmanBar.value = ((0.5 + Math.log(pacmanUpdates)) / Math.log(4)) / 4;
	pacmanBar.refresh();

	aurBar.value = ((0.5 + Math.log(aurUpdates)) / Math.log(4)) / 4;
	aurBar.refresh();
}
setInterval(updateUpdateBar, 10000);
updateUpdateBar();

async function setMPDVolume(value) {
	return mpdClient.sendCommandAsync("setvol " + Math.floor(value * 100));
}

