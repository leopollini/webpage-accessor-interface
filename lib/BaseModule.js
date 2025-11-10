const fs = require('fs');
const path = require('./path2')
const kleur = require('kleur');
const Env = require('../env');
const { OPERATING_SYSTEM } = require('./Constants');
const { app } = require('electron');
const { createRequire } = require('module');

class BaseModule
{
	// a module's setup SHOULD never create a new tab using TabsManager.newTab/setNewTab with update_modules set to true, since other modules are not yet ready.
	
	// extensions's configuration file content. Different from app.conf
	__conf = null;
	__data = null;

	window = null;
	tab = null;					// will always point to TabsManager.activeTab
	track_active_tab = true;	// as long as this is true
	module_name = "";
	MODULE_NAME;
	is_active = false;

	already_required = false;
	instance = null;

	required_modules = [];

	// With this, any module can be instantiated (required) by any other module, and duplicates are prevented
	constructor() { if (this.already_required) return this.instance; }
	getInstance() { if (this.already_required) return this.instance; return undefined; }

	// available functions to be overloaded
	setup() {}
	setup_windows() {}
	setup_linux() {}
	late_setup() {}

	onNewTabCreated(tab) {}

	// extension's constructors are called after window creation and after app.ready().
	__start(window, tab, data)
	{
		this.already_required = true;
		this.instance = this;

		this.window = window;
		this.tab = tab;

		this.module_name = this.MODULE_NAME;

		if (this.required_modules.length > 0)
		{
			const Loader = require('../extensions/loader');
			for (const ext in this.required_modules)
			{
				if (Env.DEBUG_MODE)
					this.log('requiring', this.required_modules[ext]);
				Loader.loadModule(this.required_modules[ext]);
			}
		}

		if (Env.DEBUG_MODE)
			console.log("loading", kleur.green(this.module_name));
		
		// if (this.module_name == 'BaseModule')
		// 	this.conf_file_path = path.joinConfigDir('data.json');
		// else
		this.conf_file_path = path.joinConfigDir(this.module_name + '.json');
		
		if (fs.existsSync(this.conf_file_path))
			try { this.__conf = JSON.parse(fs.readFileSync(this.conf_file_path, 'utf-8')); }
			catch (e) { this.warn('Could not load conf file for', this.module_name, ':', e, '.'); }
		else
		{
			this.warn("Config file not created: containing module disabled in config");
			return;
		}

		if (!this.__conf) this.warn('__conf not defined.');
		else if (this.__conf.enabled == false)
		{
			this.warn('Module disabled in config.');
			return;
		}

		this.__data = data;	// This is the contents of data.json

		// this.log('Setting up', this.module_name, 'config:', this.__conf, '...');

		this.setup();
		switch(OPERATING_SYSTEM)
		{
			case 'linux': this.setup_linux();
			 break ;
			case 'windows': this.setup_windows()
			 break ;
		}
		this.is_active = true;
		this.window.on('new-tab-created', (new_tab) => this.__onNewTab(new_tab));
		this.log('... done');
	}

	__onNewTab(new_tab)
	{
		const old_tab = this.tab;
		if (this.track_active_tab) this.tab = new_tab;
		if (this.onNewTabCreated && this.is_active) this.onNewTabCreated(new_tab, old_tab);
	}

	__late_start() { if (this.late_setup) this.late_setup(); }

	// Colored logging! Use this instead of console.log()
    log(...message)
	{
		if (Env.DEBUG_MODE) console.log('[', kleur.green(this.module_name), ']:', ...message);
	}
    warn(...message)
	{
		if (Env.DEBUG_MODE) console.log('[', kleur.yellow(this.module_name), ']:', ...message);
	}
    err(...message)
	{
		if (Env.DEBUG_MODE) console.log('[', kleur.red(this.module_name), ']:', ...message);
	}

	// returns active status
	isActive() {return this.is_active;}

	disable() {this.is_active = false;}

	// returns module's private folder
	getAppDataDir()
	{
		return path.joinAppData(this.module_name);
	}

	// returns module's data folder
	joinData(...dir)
	{
		return path.joinDataDir(this.module_name, ...dir);
	}

	// returns module's conf folder
	joinConf(...dir)
	{
		return path.joinConfigDir(this.module_name, ...dir);
	}

	// returns app.conf (config.json) content. Maybe not assigned? check main.js
	getAppConfig()
	{
		return app.conf;
	}

	//returns app.data (data.json) content
	// static getDataFile = false; what is this
	getAppData()
	{
		return app.data;
	}

	saveExtensionConfig()
	{
		if (this.__conf)
			fs.writeFileSync(path.joinAppData(this.module_name, this.module_name + '.json'), this.__conf);
	}

	// this is tab dependant! Call on every tab creation!
	newCtrlShortcut(key, callback, do_prevent_default = true)
	{
		this.log("new shortcut registered: ctrl+" + key);
		this.tab.webContents.on('before-input-event', (event, input) => {
			if (input.control && input.key.toLowerCase() === key)
			{
				if (do_prevent_default)
					event.preventDefault();
				callback();
			}
		});
	}
	// setup Windows??
}

module.exports = BaseModule;