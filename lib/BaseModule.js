const fs = require('fs');
const path = require('./path2');
const kleur = require('kleur');
const { OPERATING_SYSTEM } = require('./Constants');
const { app } = require('electron');
const { SimpleLogger, BaseLogger } = require('./BaseLogger');

class BaseModule {
	// a module SHOULD never create a new tab in the SETUP function using TabsManager.newTab/setNewTab with update_modules set to true, since other modules are not yet ready.

	// extensions's configuration file content. Different from app.conf
	__conf = null;
	__data = null;

	window = null; // the only window
	tab = null; // will always point to TabsManager.activeTab
	track_active_tab = true; // as long as this is true
	module_name = '';
	status = null;
	enabled;

	static loggers = [new SimpleLogger()];

	MODULE_NAME; // specified in the derived class
	HIGHLIGHT = false; // for better logging (print in bold)
	ENTRY_STATUS; // status at instantiation
	FORCE_RUN = false; // Runs the extension even if the config file is missing
	IS_MINIMODULE = false; // Does not look for config, calls only setup
	required_modules = []; // specify here eventual sorting requirements

	static instances = {};

	// With this, any module can be instantiated (actually required) by any other module, and duplicates are prevented.
	// To get the instance just create a new object: this special constructor will redirect to the real and only instance.
	// This constructor mimics Singleton behaviour. It does nothing more, so if a special module with multiple instances is
	// needed, you can simply override the constructor without calling this one.
	constructor() {
		const derivedClass = this.constructor; // evil member manipulation
		if (derivedClass._instance) {
			return derivedClass._instance;
		}
		return (derivedClass._instance = this);
	}

	// available functions to be overloaded
	setup() {}
	setup_windows() {}
	setup_linux() {}
	late_setup() {}
	on_new_tab_created() {}

	// extension's constructors are called after window creation and after app.ready() ONLY BY loader2.load
	__start(window, tab, data) {
		this.window = window; // the one and only window
		this.tab = tab; // currently active tab (usually undefined)
		this.__data = data; // the contents of data.json
		this.FORCE_RUN = this.FORCE_RUN || this.IS_MINIMODULE;

		this.module_name = this.MODULE_NAME;
		if (!this.module_name || this.module_name == '') throw new BaseModule.ModuleError('Module name not specified');

		BaseModule.instances[this.module_name] = this;

		// load requirements first
		if (this.required_modules.length > 0) {
			const Loader = require('../extensions/loader');
			for (const ext in this.required_modules) {
				this.log('requiring', this.required_modules[ext]);
				Loader.loadModule(this.required_modules[ext]);
			}
		}

		console.log('loading', kleur.green(this.module_name));

		this.conf_file_path = path.joinConfigDir(this.module_name + '.json');

		if (this.ENTRY_STATUS) this.status = this.ENTRY_STATUS;

		// load configuration
		if (fs.existsSync(this.conf_file_path))
			try {
				this.__conf = JSON.parse(fs.readFileSync(this.conf_file_path, 'utf-8'));
			} catch (e) {
				this.warn('Could not load conf file for', this.module_name, ':', e, '.');
			}
		else {
			if (!this.FORCE_RUN) {
				this.err(`Config file at ${this.conf_file_path} does not exist. Possibly disabled in config.json`);
				this.status = kleur.bold().grey('disabled');
				return;
			}
		}

		if (!this.__conf && !this.FORCE_RUN) {
			this.warn('__conf not assigned. Presuming module is disabled.');
			this.enabled = false;
			return;
		}

		if (this.__conf?.enabled == false) {
			this.warn('Module disabled in config.');
			this.enabled = false;
			return;
		}

		// finally!
		this.setup();
		this.enabled = true;

		if (!this.IS_MINIMODULE) {
			// extra os-specific setups
			switch (OPERATING_SYSTEM) {
				case 'linux':
					this.setup_linux();
					break;
				case 'windows':
					this.setup_windows();
					break;
				default:
			}
		}
		if (this.track_active_tab) this.window?.on('new-tab-created', (ev, new_tab) => this.__onNewTab(new_tab));
		// if status was not set by extension then set it to OK
		if (this.status === null) this.setStatus(kleur.green('OK'));
		this.log('... done');
	}

	__onNewTab(new_tab) {
		const old_tab = this.tab;
		this.tab = new_tab;
		if (this.on_new_tab_created && this.status) this.on_new_tab_created(new_tab, old_tab);
		// PLEASE! always use new_tab instead of this.tab in on_new_tab_created implementations, so that
		// other extensions can access the method and inject their private tabs!
	}

	__late_start() {
		if (this.late_setup && this.enabled) this.late_setup();
	}

	// Very simple log stack. Use theese instead of console.log() in the extension's body
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
		if (!(logger instanceof BaseLogger)) return;
		BaseModule.loggers.push(logger);
		console.log('### New logger registered!');
	}

	static unRegisterLogger(logger) {
		const ind = BaseModule.loggers.indexOf(logger);
		if (ind) BaseModule.loggers.splice(ind, 1);
	}

	// returns active status
	isActive() {
		return (this.status != false && this.status != 'disabled') || this.status != 'failed';
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

	// returns app.data (data.json) content
	getAppData() {
		return app.data;
	}

	// returns app.conf (config.json) content
	getAppConfig() {
		return app.conf;
	}

	saveExtensionConfig() {
		if (this.__conf) fs.writeFileSync(this.conf_file_path, JSON.stringify(this.__conf, 0, 4));
	}

	// common to every extension, acts like immunity frames
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

	// error classes
	static ModuleError = class extends Error {
		name = 'ModuleError';
	};
	static LoadError = class extends BaseModule.ModuleError {
		name = 'LoadError';
	};
}

module.exports = BaseModule;
