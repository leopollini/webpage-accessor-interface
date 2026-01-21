const fs = require('fs');
const path = require('./path2');
const kleur = require('kleur');
const Env = require('../env');
const { OPERATING_SYSTEM } = require('./Constants');
const { app } = require('electron');
const BaseLogger = require('./BaseLogger');

class BaseModule {
	// a module's setup SHOULD never create a new tab using TabsManager.newTab/setNewTab with update_modules set to true, since other modules are not yet ready.

	// extensions's configuration file content. Different from app.conf
	__conf = null;
	__data = null;

	window = null;
	tab = null; // will always point to TabsManager.activeTab
	track_active_tab = true; // as long as this is true
	module_name = '';
	MODULE_NAME;
	HIGHLIGHT = false;
	status = null;
	static loggers = [new BaseLogger()];

	required_modules = [];

	static instances = {};

	// With this, any module can be instantiated (required) by any other module, and duplicates are prevented.
	// To get the instance just create a new object: this special constructor will redirect to the real instance.
	constructor() {
		const derivedClass = this.constructor; // evil member manipulation
		if (derivedClass._instance) return derivedClass._instance;
		derivedClass._instance = this;
	}

	// available functions to be overloaded
	setup() {}
	setup_windows() {}
	setup_linux() {}
	late_setup() {}

	// extension's constructors are called after window creation and after app.ready().
	__start(window, tab, data) {
		this.window = window;
		this.tab = tab;
		if (this.status != null) this.status = kleur.bold().yellow(this.status);

		this.module_name = this.MODULE_NAME;
		if (!this.module_name || this.module_name == '') throw new BaseModule.ModuleError('Module name not specified');

		BaseModule.instances[this.module_name] = this;

		if (this.required_modules.length > 0) {
			const Loader = require('../extensions/loader');
			for (const ext in this.required_modules) {
				this.log('requiring', this.required_modules[ext]);
				Loader.loadModule(this.required_modules[ext]);
			}
		}

		console.log('loading', kleur.green(this.module_name));

		// if (this.module_name == 'BaseModule')
		// 	this.conf_file_path = path.joinConfigDir('data.json');
		// else
		this.conf_file_path = path.joinConfigDir(this.module_name + '.json');

		if (fs.existsSync(this.conf_file_path))
			try {
				this.__conf = JSON.parse(fs.readFileSync(this.conf_file_path, 'utf-8'));
			} catch (e) {
				this.warn('Could not load conf file for', this.module_name, ':', e, '.');
			}
		else {
			this.warn('Config file not created: containing module disabled in config');
			this.status = kleur.bold().grey('disabled');
			return;
		}

		if (!this.__conf) this.warn('__conf not defined.');
		else if (this.__conf.enabled == false) {
			this.warn('Module disabled in config.');
			return;
		}

		this.__data = data; // This is the contents of data.json

		// this.log('Setting up', this.module_name, 'config:', this.__conf, '...');

		this.setup();
		switch (OPERATING_SYSTEM) {
			case 'linux':
				this.setup_linux();
				break;
			case 'windows':
				this.setup_windows();
				break;
		}
		// status was not set by extension
		if (this.status === null) this.setStatus(kleur.green('OK'));
		this.window.on('new-tab-created', (ev, new_tab) => this.__onNewTab(new_tab));
		this.log('... done');
	}

	__onNewTab(new_tab) {
		const old_tab = this.tab;
		if (this.track_active_tab) this.tab = new_tab;
		if (this.onNewTabCreated && this.status) this.onNewTabCreated(new_tab, old_tab);
		// PLEASE! always use new_tab instead of this.tab in onNewTabCreated implementations, so that
		// other extensions can access the method and inject their private tabs!
	}

	__late_start() {
		if (this.late_setup) this.late_setup();
	}

	// Colored logging! Use this instead of console.log()
	log(...message) {
		BaseModule.loggers.forEach((logger) => logger?.log(this.module_name, message, this.HIGHLIGHT));
	}
	warn(...message) {
		BaseModule.loggers.forEach((logger) => logger?.warn(this.module_name, message, this.HIGHLIGHT));
	}
	err(...message) {
		BaseModule.loggers.forEach((logger) => logger?.err(this.module_name, message, this.HIGHLIGHT));
	}

	static registerLogger(logger) {
		if (logger instanceof BaseLogger) BaseModule.loggers.push(logger);
		console.log("### New logger registered!")
	}

	static unRegisterLogger(logger) {
		const ind = BaseModule.loggers.indexOf(logger);
		if (ind) BaseModule.loggers.splice(ind, 1);
	}

	// returns active status
	isActive() {
		return (this.status != false && this.status != 'disabled') || this.status != 'failed';
	}

	getStatus() {
		return this.status;
	}

	disable() {
		this.status = kleur.grey('disabled');
	}

	failed(error) {
		this.status = kleur.bold().red('failed');
		this.fail_reason = this.fail_reason ? error + ' | ' + this.fail_reason : error;
	}

	setStatus(status) {
		this.status = kleur.bold(status);
	}

	// returns module's private folder
	getAppDataDir() {
		return path.joinAppData(this.module_name);
	}

	// returns module's data folder
	joinData(...dir) {
		return path.joinDataDir(this.module_name, ...dir);
	}

	// returns module's conf folder
	joinConf(...dir) {
		return path.joinConfigDir(this.module_name, ...dir);
	}

	// returns app.conf (config.json) content. Maybe not assigned? check main.js
	getAppConfig() {
		return app.conf;
	}

	//returns app.data (data.json) content
	// static getDataFile = false; what is this
	getAppData() {
		return app.data;
	}

	saveExtensionConfig() {
		if (this.__conf) fs.writeFileSync(path.joinAppData(this.module_name, this.module_name + '.json'), this.__conf);
	}

	// common to every extension
	static shorcurtLock;
	// this is tab dependant! Call on every tab creation!
	newCtrlShortcut(key, callback, overload_tab, do_prevent_default = true) {
		// this.log("new shortcut registered: ctrl+" + key);
		const tab = overload_tab || this.tab;
		tab.webContents.on('before-input-event', (event, input) => {
			if (!BaseModule.shorcurtLock && input.control && input.key.toLowerCase() === key) {
				if (do_prevent_default) event.preventDefault();
				callback(tab);
				BaseModule.shorcurtLock = setTimeout(() => {
					BaseModule.shorcurtLock = undefined;
				}, 150);
			}
		});
	}

	static ModuleError = class extends Error {
		name = 'ModuleError';
	};
	static LoadError = class extends BaseModule.ModuleError {
		name = 'LoadError';
	};
	// setup Windows??
}

module.exports = BaseModule;
