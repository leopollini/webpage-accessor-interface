const fs = require('fs');
const path = require('./path2')
const kleur = require('kleur');
const Env = require('../env');
const { OPERATING_SYSTEM } = require('./Constants');
const { app } = require('electron');
const { createRequire } = require('module');

class BaseModule
{
	// extensions's configuration file content. Different from app.conf
	__conf = null;
	__data = null;

	window = null;
	tab = null;
	module_name = "";
	is_active = false;

	already_required = false;
	instance = null;

	required_modules = [];

	// With this, any module can be instantiated (required) by any other module, and duplicates are prevented
	constructor() { if (this.already_required) return this.instance; }

	// available functions to be overloaded
	setup() {}
	setup_windows() {}
	setup_linux() {}
	late_setup() {}

	// extension's constructors are called after window creation and after app.ready().
	__start(window, tab, data)
	{
		this.already_required = true;
		this.instance = this;

		this.window = window;
		this.tab = tab;
		this.module_name = this.MODULE_NAME || 'BaseModule';

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
		
		if (this.module_name == 'BaseModule')
			this.conf_file_path = path.joinConfigDir('data.json');
		else
			this.conf_file_path = path.joinConfigDir(this.module_name + '.json');
		
		if (fs.existsSync(this.conf_file_path))
			try { this.__conf = JSON.parse(fs.readFileSync(this.conf_file_path, 'utf-8')); }
			catch (e) { this.warn('Could not load conf file for', this.module_name, ':', e, '.'); }

		if (!this.__conf) this.warn('__conf not defined.');
		else if (this.__conf.enabled == false) return;
		
		this.__data = data;
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
		this.log('... done');
	}

	__late_start() { this.late_setup(); }

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

	// sets active status
	setActive(active = true) {this.is_active = active;}

	// returns active status
	isActive() {return this.is_active;}

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

	// setup Windows??
}

module.exports = BaseModule;