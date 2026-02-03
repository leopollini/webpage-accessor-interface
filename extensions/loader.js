const BaseModule = require('../lib/BaseModule');
const path = require('../lib/path2');
const fs = require('fs');
const kleur = require('kleur');
const TabsManager = require('../lib/TabsManager');

const EXT_LOAD_DIR = __dirname;

const modules = {};

// looks for available modules and loads them. Is a static class
module.exports = class Loader2 {
	mainWindow = null;
	mainTab = null;
	data = null;
	enabled_modules;

	// 'data' should be the contents of data.json
	static load(data) {
		this.mainWindow = TabsManager.mainWindow;
		this.mainTab = TabsManager.getActiveTab();
		this.data = data;
		this.enabled_modules = new Set();

		// look for valid modules: DOES NOT SETUP
		fs.readdirSync(EXT_LOAD_DIR).forEach(function (ext) {
			const main = path.join(EXT_LOAD_DIR, ext, 'main.js');
			// console.log("\t at", main_dir);
			if (!fs.existsSync(main)) return;
			// if (Env.DEBUG_MODE)
			//     console.log("loading", kleur.green(main));
			modules[ext] = main;
		});

		// setup all valid found modules
		for (const ext in modules) {
			this.loadModule(ext);
		}

		return [...this.enabled_modules];
	}

	static lateLoad() {
		// Module late start
		this.enabled_modules.forEach(function (module) {
			if (module.isActive?.()) module.__late_start();
		});
	}

	// does some checks before tryinc to call module.__start() -> setup()
	// If this function is reached by an invalid module, the error is saved in the object and
	// dumped upon checkActiveModules(), even if it is not actually a BaseModule inheritor
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
					mod.failed = BaseModule.prototype.failed;
					mod.failed(e);
				}
			} else console.log('Module not loaded:', e);
		}
	}
};
