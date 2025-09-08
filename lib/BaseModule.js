const fs = require('fs');
const path = require('./path2')
const kleur = require('kleur');
const Env = require('../env');
const { OPERATIVE_SYSTEM } = require('./Constants');
const { app } = require('electron');

class BaseModule
{
	// extensions's configuration file content. Different from app.conf
	__conf = null;

	window = null;
	tab = null;
	module_name = "";
	is_active = false;

	constructor() {}

	// extension's constructors are called after window creation and after app.ready().
	__start(window, tab)
	{
		this.window = window;
		this.tab = tab;
		this.module_name = this.MODULE_NAME || 'BaseModule';
		
		if (this.module_name == 'BaseModule')
			this.conf_file_path = path.joinConfigDir('data.json');
		else
			this.conf_file_path = path.joinConfigDir(this.module_name + '.json');
		
		if (fs.existsSync(this.conf_file_path))
			try { this.__conf = JSON.parse(fs.readFileSync(this.conf_file_path, 'utf-8')); }
			catch (e) { this.warn('Could not load conf file for', this.module_name, ':', e, '.'); }

		if (!this.__conf) this.warn('__conf not defined.');
		else if (this.__conf.enabled == false) return;
		
		// this.log('Setting up', this.module_name, 'config:', this.__conf, '...');

		if (this.setup) this.setup();
		switch(OPERATIVE_SYSTEM)
		{
			case "linux": if (this.setup_linux) this.setup_linux();
		}
		// THIS SHOULD BE AFTER EVERY EXTENSSION IS INIT
		// if (this.late_setup) this.late_setup();
		this.is_active = true;
		this.log('... done');
	}

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
	appData()
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
	static getDataFile = false;
	getAppData()
	{
		return app.data;
	}

	// setup Windows??
}

module.exports = BaseModule;