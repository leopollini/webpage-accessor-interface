const kleur = require('kleur');
const Env = require('../env');
const { app, ipcRenderer } = require('electron');
const ipcChannel = require('./icpChannel');
const fs = require('fs');
const path = require('./path2')

// like BaseModule but with less expensive features
class BasePreload
{
	// extensions's configuration file content. Different from app.conf
	__conf = null;
	MODULE_NAME;
	window = null;
	tab = null;
	module_name = "";
	await_preload = true;		// if this is false then the renderer does not wait for the main's conf response before loading DOM
	is_active = false;
	ensure_conf = true;

	// this is exposed as soon as possible, in order to avoid problems with renderer scripts
	// (which still shoud ALWAYS check if the desired api is available).
	contextbridge_expose = null;	// example: {'electronAPI': {'readfile: function_which_reads_file, ...}, ...};

	constructor() {}

	// Remember! The preload does not guarantee that the contents of the page are ready
	// for modifications (extra style, ecc) untill "DOMContentLoaded" is fired. Before
	// touching stuff like 'document.head' check if it exists; if not add this:
	// window.addEventListener('DOMContentLoaded', () => { callback() });

	// Also beware not to call contextBridge.exposeInMainWorld() with the same api name twice!

	// extension's constructors are called after window creation and after app.ready().
	async __start()
	{
		this.module_name = this.MODULE_NAME;
		this.log('preparing');

		// This is exposed EVEN IF EXTENSION IS DISABLED
		if (this.contextbridge_expose)
			ipcChannel.exposeContextBridge(this.contextbridge_expose);

		// the setup calls are managed IN PARALLEL. NO SORTING ORDER IS GRANTED FOR PRELOADED SCRIPTS.
		
		if (Env.DEBUG_MODE)
			console.log("loading", kleur.green(this.module_name));
		
		// if (this.module_name == 'BaseModule')
		// 	this.conf_file_path = path.joinConfigDir('data.json');
		// else

		if (!this.setup)
		{
			this.log("Setup function missing. Avoiding config fetch");
			return;
		}

		this.conf_file_path = path.join(__dirname, "../extensions_conf", this.module_name + '.json');
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

		// this.log('Setting up', this.module_name, 'config:', this.__conf, '...');

		this.setup();
	}

	// Colored logging! Use this instead of console.log()
    log(...message)
	{
		if (Env.DEBUG_MODE) console.log('[ \x1b[32m%s\x1b[0m', this.module_name, ']:', ...message);
	}
    warn(...message)
	{
		if (Env.DEBUG_MODE) console.log('[ \x1b[33m%s\x1b[0m', this.module_name, ']!:', ...message);
	}
    err(...message)
	{
		if (Env.DEBUG_MODE) console.log('[ \x1b[31m%s\x1b[0m', this.module_name, ']!!:', ...message);
	}

	// sets active status
	setActive(active = true) {this.is_active = active;}

	// returns active status
	isActive() {return this.is_active;}

	// setup Windows??
}

module.exports = BasePreload;