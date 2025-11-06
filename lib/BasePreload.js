const kleur = require('kleur');
const Env = require('../env');
const { app, ipcRenderer } = require('electron');
const ipcChannel = require('./icpChannel');

// like BaseModule but with less expensive features
class BasePreload
{
	// extensions's configuration file content. Different from app.conf
	__conf = null;
	MODULE_NAME;
	window = null;
	tab = null;
	module_name = "";
	await_preload = true;		// if this is false then the renderer does not wait for the main's response before loading DOM
	is_active = false;

	// this is exposed as soon as possible, in order to avoid problems with renderer scripts
	// (which still shoud ALWAYS check if the desired api is available).
	contextbridge_expose = null;	// example: {'electronAPI': {'readfile: function_which_reads_file, ...}, ...};

	constructor() {}

	instant_setup() {}			// no config, no nothing

	// Remember! The preload does not guarantee that the contents of the page are ready
	// for modifications (extra style, ecc) untill "DOMContentLoaded" is fired. Before
	// touching stuff like 'document.head' check if it exists; if not add this:
	// window.addEventListener('DOMContentLoaded', () => { callback() });

	// Also beware not to call contextBridge.exposeInMainWorld() with the same api name twice!

	// extension's constructors are called after window creation and after app.ready().
	async __start(ext)
	{
		this.module_name = this.MODULE_NAME;
		this.log(this.module_name);
		if (this.instant_setup) this.instant_setup();

		if (this.contextbridge_expose)
			ipcChannel.exposeContextBridge(this.contextbridge_expose);

		// the responses and the setup calls are managed IN PARALLEL. NO SORTING ORDER IS GRANTED.
		const conf_callback = async (conf) => {
			this.__conf = conf;
			if (!this.__conf) this.warn('__conf not defined.');
			else if (this.__conf.enabled == false) return;
			
			if (this.__conf.enabled == false)
			{
				this.warn("not setting up because disabled in", this.module_name + ".json");
				return ;
			}
			this.log('Setting up', this.module_name, 'config:', this.__conf, '...');
			if (this.setup) await this.setup();
		}

		// avoid calling main if setup does not exist
		if (this.setup)
		{
			if (this.await_preload)
			{
				console.log('waiting for:', this.module_name);
				conf_callback(await ipcRenderer.invoke('preload-get-extension-conf', this.module_name));
			}
			else
				ipcRenderer.invoke('preload-get-extension-conf', this.module_name).then(conf_callback);
		}
	}

	// Colored logging! Use this instead of console.log()
    log(...message)
	{
		if (Env.DEBUG_MODE) console.log('[', kleur.green(this.module_name), ']:', ...message);
	}
    warn(...message)
	{
		if (Env.DEBUG_MODE) console.log('[', kleur.yellow(this.module_name), ']!:', ...message);
	}
    err(...message)
	{
		if (Env.DEBUG_MODE) console.log('[', kleur.red(this.module_name), ']!!:', ...message);
	}

	// sets active status
	setActive(active = true) {this.is_active = active;}

	// returns active status
	isActive() {return this.is_active;}

	// setup Windows??
}

module.exports = BasePreload;