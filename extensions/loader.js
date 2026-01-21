const BaseModule = require('../lib/BaseModule');
const path = require('../lib/path2');
const fs = require('fs');
const kleur = require('kleur');
const TabsManager = require('../lib/TabsManager');

const EXT_LOAD_DIR = __dirname;

const modules = {};

module.exports = class Loader2 {
	mainWindow = null;
	mainTab = null;
	data = null;
	enabled_modules;

	// 'data' shoud be app.data
	static load(data) {
		this.mainWindow = TabsManager.mainWindow;
		this.mainTab = TabsManager.getActiveTab();
		this.data = data;
		this.enabled_modules = new Set();

		// load modules -> no setup
		fs.readdirSync(EXT_LOAD_DIR).forEach(function (ext) {
			const main = path.join(EXT_LOAD_DIR, ext, 'main.js');
			// console.log("\t at", main_dir);
			if (!fs.existsSync(main)) return;

			// if (Env.DEBUG_MODE)
			//     console.log("loading", kleur.green(main));
			modules[ext] = main;
		});

		// setup all loaded modules
		for (const ext in modules) {
			this.loadModule(ext);
		}

		// deprecated
		// Loader2.allowGetPreloadData()
		return [...this.enabled_modules];
	}

	static lateLoad() {
		// Module late start
		this.enabled_modules.forEach(function (module) {
			if (module.isActive()) module.__late_start();
		});
	}

	static loadModule(ext) {
		let mod;
		try {
			if (!ext || !modules[ext]) return console.log(kleur.red('Error:'), ext, 'is not a module!!');
			const ModuleClass = require(modules[ext]);
			if (typeof ModuleClass !== typeof function () {} || Object.getPrototypeOf(ModuleClass) !== BaseModule) {
				throw new BaseModule.ModuleError('Not a module');
			}
			mod = new ModuleClass();
			this.enabled_modules.add(mod);
			mod.__start(this.mainWindow, this.mainTab, this.data, ext);
		} catch (e) {
			if (e instanceof BaseModule.ModuleError) {
				console.log('Module not loaded: ' + e);
				if (mod) {
					mod.failed(e);
				}
			} else console.log('Module not loaded:', e);
		}
	}

	// It appears that preload modules can still access local files, so this is useless P:
	// static allowGetPreloadData() {
	// 	ipcMain.handle('preload-get-extension-conf', async (event, ext) => {
	// 		if (ext.indexOf('..') > 0 || ext.indexOf('/') > 0) {
	// 			console.log(
	// 				'detected ill request from extension:',
	// 				'"' + kleur.yellow(ext) + '"',
	// 				'returning'
	// 			);
	// 			return { nice_try: 'lol' };
	// 		}
	// 		const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
	// 		await sleep(1000);

	// 		if (!fs.existsSync(path.joinConfigDir(ext + '.json'))) {
	// 			console.log('Requested config file does not exist.');
	// 			return {};
	// 		}
	// 		const res = JSON.parse(
	// 			fs.readFileSync(path.joinConfigDir(ext + '.json'))
	// 		);
	// 		if (Env.VERBOSE)
	// 			console.log(
	// 				ext,
	// 				"requested config info at '" +
	// 					path.joinConfigDir(ext + '.json') +
	// 					"'",
	// 				'sending',
	// 				res
	// 			);
	// 		return res;
	// 	});
	// 	// ipcMain.handle('preload-get-extension-conf', async (event, ext) => {await fs.readFile(path.joinConfigDir(ext + '.json'));});
	// }
};
