const Promise = require("bluebird");

const _ = require("lodash");
const Cava = require("./cava.js");
const Color = require("color");
const cp = Promise.promisifyAll(require("child_process"));
const debug = require("debug")("vexlink");
const fs = Promise.promisifyAll(require("fs"));
const i3Client = require("i3").createClient();
const mpd = require("mpd");
const MusicProgressBar = require("./musicprogressbar.js");
const ProgressBar = require("./progressbar.js");
const WorkspaceBar = require("./workspacebar.js");

debug("Opening keyboard write stream");
const keyboardCmdStream = fs.createWriteStream("/dev/input/ckb2/cmd");
keyboardCmdStream.write("active");
const _oldWrite = keyboardCmdStream.write;
keyboardCmdStream.write = function(data) {
	_oldWrite.bind(keyboardCmdStream)("mode 4 " + data)
}
keyboardCmdStream.write("switch");
keyboardCmdStream.write("rgb 000000");

debug("Connecting to MPD");
const mpdClient = Promise.promisifyAll(mpd.connect());

debug("Creating bars");
//const musicBar = new ProgressBar(keyboardCmdStream, ["esc", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12"]);
const musicBar = new MusicProgressBar(keyboardCmdStream, mpdClient, ["esc", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12"]);

const pacmanBar = new ProgressBar(keyboardCmdStream, ["del", "ins", "prtscn"], {foreground: "#00ff00"});
const aurBar = new ProgressBar(keyboardCmdStream, ["end", "home", "scroll"], {foreground: "#00ff00"});

const workspaceBar = new WorkspaceBar(keyboardCmdStream, i3Client, ["inv", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"], {});

const spectrumBars = [["lctrl", "lwin", "lshift", "caps", "tab", "grave"], ["lalt", "z", "a", "q"], ["x", "s", "w"], ["c", "d", "e"], ["v", "f", "r"], ["space", "b", "g", "t"], ["n", "h", "y"], ["m", "j", "u"], ["comma", "k", "i"], ["ralt", "dot", "l", "o"], ["rwin", "slash", "colon", "p"], ["rmenu", "quote", "lbrace", "minus"], ["inv", "inv", "inv", "rbrace", "plus"], ["rctrl", "rshift", "enter", "bslash", "bspace"]];

for (const bar in spectrumBars) {
	spectrumBars[bar] = new ProgressBar(keyboardCmdStream, spectrumBars[bar], {foreground: "#ff00ff"});
}

const cava = new Cava(bars => {
	// Split bars into three bands
	let bands = [];
	for (let i = 0; i < bars.length; i += bars.length / 3) {
		bands.push(bars.slice(i, i + bars.length / 3));
	}

	// Get averages of bands
	bands = _.chain(bands)
		.map(_.mean) // Get averages of bands
		.map((v, i, bands) => {
			return v / (_.sum(_.without(bands)) || 1); // Get ratio of band to other bands
		})
		.map(v => v * 255) // Multiply by 255
		.value();

	const color = new Color(bands).saturate(2);

	for (const bar in bars) {
		spectrumBars[bar].value = bars[bar];
		spectrumBars[bar].foreground = color;
		spectrumBars[bar].refresh();
	}
}, {
	bars: 14,
	bitDepth: 8,

	integralSmoothing: 50,
	monstercatSmoothing: true,

	gravity: 2000,
	framerate: 60
});

async function updateUpdateBar() {
	const pacmanUpdates = ((await cp.execAsync("checkupdates", {encoding: "utf8"})).match(/.+\n/g) || []).length;
	const aurUpdates = ((await cp.execAsync("pacaur -k", {encoding: "utf8"}).catch(() => { return ""; })).match(/.+\n/g) || []).length;

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
