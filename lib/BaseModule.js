const fs = require('fs');
const path = require('./path2')
const kleur = require('kleur');
const Env = require('../env');

const { EXT_CONFIGS_DIR } = require('./Constants');

class BaseModule
{
	__conf = null;
	window = null;
	tab = null;
	module_name = "";
	is_active = false;

	constructor() {}

	__start(window, tab)
	{
		this.window = window;
		this.tab = tab;
		this.module_name = this.MODULE_NAME || 'BaseModule';
		this.conf_file_path = path.joinConfigDir(this.module_name + '.json');
		try { this.__conf = JSON.parse(fs.readFileSync(this.conf_file_path, 'utf-8')); }
		catch (e) { console.log('Could not load conf file for', this.module_name, ':', e, '.'); }

		if (!this.__conf) console.log('__conf not defined.');
		else if (this.__conf.enabled == false) return;
		
		// this.log('Setting up', this.module_name, 'config:', this.__conf, '...');

		this.setup();
		this.is_active = true;
		this.log('... done');
	}

	// Colored logging!
    log(...message)
	{
		if (Env.DEBUG_MODE) console.log('[', kleur.green(this.module_name), ']:', ...message);
	}
    warn(...message)
	{
		if (Env.DEBUG_MODE) console.log('[', kleur.yellow(this.module_name), ']:', ...message);
	}

	setActive(active = true) {this.is_active = active;}

	isActive() {return this.is_active;}
}

module.exports = BaseModule;